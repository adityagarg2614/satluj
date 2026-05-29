"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureSeedAdmin, verifyAdminLogin } from "@/lib/admin";
import {
  clearAdminSession,
  requireAdminSession,
  setAdminSession,
} from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { normalizeDateKey } from "@/lib/format";
import {
  DIHADI_PAYMENT_CATEGORIES,
  WORKER_PAYMENT_CATEGORIES,
} from "@/lib/salary";
import { resolveWorkerType } from "@/lib/worker-utils";
import {
  ATTENDANCE_STATUSES,
  AttendanceModel,
  type AttendanceStatus,
} from "@/models/attendance";
import { CompanyModel } from "@/models/company";
import { DAYBOOK_ENTRY_TYPES, DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel, WORKER_TYPES, type WorkerType } from "@/models/worker";

const DIHADI_PHONE_PLACEHOLDER = "N/A";

function getStatusDayValue(status: AttendanceStatus) {
  if (status === "present") {
    return 1;
  }

  if (status === "half") {
    return 0.5;
  }

  return 0;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=missing-fields");
  }

  const admin = await verifyAdminLogin(email, password);
  if (!admin) {
    redirect("/admin/login?error=invalid-credentials");
  }

  await setAdminSession({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function addWorkerAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();
  await ensureSeedAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const workerTypeValue = String(formData.get("workerType") ?? "permanent").trim();
  const workerType = WORKER_TYPES.includes(workerTypeValue as WorkerType)
    ? (workerTypeValue as WorkerType)
    : "permanent";
  const joiningDate = String(formData.get("joiningDate") ?? "").trim();
  const salary = Number(formData.get("salary") ?? 0);
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const finalRole = workerType === "dihadi" ? "Daily Wage" : role;
  const finalJoiningDate = joiningDate || new Date().toISOString().slice(0, 10);
  const finalPhoneNumber =
    workerType === "dihadi" ? DIHADI_PHONE_PLACEHOLDER : phoneNumber;

  if (
    !name ||
    !salary ||
    (workerType === "permanent" && (!role || !finalJoiningDate || !phoneNumber))
  ) {
    redirect("/admin/workers?error=worker-fields");
  }

  await WorkerModel.create({
    name,
    role: finalRole,
    workerType,
    joiningDate: new Date(finalJoiningDate),
    salary,
    phoneNumber: finalPhoneNumber,
    photoUrl,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  redirect("/admin/workers?success=worker-added");
}

export async function addDihadiWorkerForDayAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const dateKey = normalizeDateKey(String(formData.get("date") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const salary = Number(formData.get("salary") ?? 0);

  if (!name || !salary) {
    redirect(`/admin/attendance?date=${dateKey}&error=dihadi-fields`);
  }

  const existingWorkers = await WorkerModel.find({
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  }).sort({ createdAt: 1 });
  const existingWorker =
    existingWorkers.find((worker) => resolveWorkerType(worker) === "dihadi") ?? null;

  const worker =
    existingWorker ??
    (await WorkerModel.create({
      name,
      role: "Daily Wage",
      workerType: "dihadi",
      joiningDate: new Date(`${dateKey}T00:00:00.000Z`),
      salary,
      phoneNumber: DIHADI_PHONE_PLACEHOLDER,
      photoUrl: "",
    }));

  if (existingWorker) {
    existingWorker.workerType = "dihadi";
    existingWorker.role = "Daily Wage";
    existingWorker.salary = salary;
    existingWorker.phoneNumber =
      existingWorker.phoneNumber?.trim() || DIHADI_PHONE_PLACEHOLDER;
    await existingWorker.save();
  }

  await AttendanceModel.findOneAndUpdate(
    { workerId: worker._id, dateKey },
    {
      workerId: worker._id,
      dateKey,
      date: new Date(`${dateKey}T00:00:00.000Z`),
      status: "present",
      dayValue: 1,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dihadi-records");
  revalidatePath("/admin/daybook");
  redirect(`/admin/attendance?date=${dateKey}&success=dihadi-added`);
}

export async function deleteWorkerAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const workerId = String(formData.get("workerId") ?? "").trim();
  const requestedReturnTo = String(formData.get("returnTo") ?? "/admin/workers").trim();
  const returnTo =
    requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin/workers";
  const separator = returnTo.includes("?") ? "&" : "?";

  if (!workerId) {
    redirect(`${returnTo}${separator}error=worker-delete-missing`);
  }

  const worker = await WorkerModel.findById(workerId);

  if (!worker) {
    redirect(`${returnTo}${separator}error=worker-delete-missing`);
  }

  if (resolveWorkerType(worker) === "dihadi") {
    const duplicateWorkers = await WorkerModel.find({
      name: new RegExp(`^${worker.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).select("_id name role workerType");
    const duplicateWorkerIds = duplicateWorkers
      .filter((candidate) => resolveWorkerType(candidate) === "dihadi")
      .map((candidate) => candidate._id);

    await AttendanceModel.deleteMany({ workerId: { $in: duplicateWorkerIds } });
    await WorkerModel.deleteMany({ _id: { $in: duplicateWorkerIds } });
  } else {
    await AttendanceModel.deleteMany({ workerId });
    await WorkerModel.findByIdAndDelete(workerId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/attendance-summary");
  redirect(`${returnTo}${separator}success=worker-deleted`);
}

export async function updateWorkerSalaryAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const workerId = String(formData.get("workerId") ?? "").trim();
  const salary = Number(formData.get("salary") ?? 0);
  const requestedReturnTo = String(formData.get("returnTo") ?? "/admin/workers").trim();
  const returnTo =
    requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin/workers";
  const separator = returnTo.includes("?") ? "&" : "?";

  if (!workerId || !salary) {
    redirect(`${returnTo}${separator}error=worker-salary-fields`);
  }

  const worker = await WorkerModel.findById(workerId);

  if (!worker) {
    redirect(`${returnTo}${separator}error=worker-salary-fields`);
  }

  if (resolveWorkerType(worker) === "dihadi") {
    const duplicateWorkers = await WorkerModel.find({
      name: new RegExp(`^${worker.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).select("_id name role workerType");
    const duplicateWorkerIds = duplicateWorkers
      .filter((candidate) => resolveWorkerType(candidate) === "dihadi")
      .map((candidate) => candidate._id);

    await WorkerModel.updateMany({ _id: { $in: duplicateWorkerIds } }, { salary });
  } else {
    await WorkerModel.findByIdAndUpdate(workerId, { salary });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/attendance-summary");
  redirect(`${returnTo}${separator}success=worker-salary-updated`);
}

export async function saveAttendanceAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const dateKey = normalizeDateKey(String(formData.get("date") ?? ""));
  const workerIds = formData.getAll("workerIds").map(String);

  if (workerIds.length === 0) {
    redirect(`/admin/attendance?date=${dateKey}&error=no-workers`);
  }

  await Promise.all(
    workerIds.map(async (workerId) => {
      const statusValue = String(formData.get(`status-${workerId}`) ?? "absent");
      const status = ATTENDANCE_STATUSES.includes(statusValue as AttendanceStatus)
        ? (statusValue as AttendanceStatus)
        : "absent";

      await AttendanceModel.findOneAndUpdate(
        { workerId, dateKey },
        {
          workerId,
          dateKey,
          date: new Date(`${dateKey}T00:00:00.000Z`),
          status,
          dayValue: getStatusDayValue(status),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );
    }),
  );

  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  redirect(`/admin/attendance?date=${dateKey}&success=attendance-saved`);
}

export async function updateWorkerAttendanceDayAction(input: {
  workerId: string;
  dateKey: string;
  status: AttendanceStatus;
}) {
  await requireAdminSession();
  await connectToDatabase();

  const workerId = String(input.workerId ?? "").trim();
  const dateKey = normalizeDateKey(String(input.dateKey ?? ""));
  const statusValue = String(input.status ?? "absent");
  const status = ATTENDANCE_STATUSES.includes(statusValue as AttendanceStatus)
    ? (statusValue as AttendanceStatus)
    : null;

  if (!workerId || !status) {
    return {
      ok: false,
      message: "Unable to update attendance for this day.",
    };
  }

  await AttendanceModel.findOneAndUpdate(
    { workerId, dateKey },
    {
      workerId,
      dateKey,
      date: new Date(`${dateKey}T00:00:00.000Z`),
      status,
      dayValue: getStatusDayValue(status),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/attendance-summary");
  revalidatePath(`/admin/workers/${workerId}`);
  revalidatePath(`/admin/workers/${workerId}/attendance`);

  return {
    ok: true,
    message: `Attendance updated to ${
      status === "present" ? "Present" : status === "half" ? "Half Day" : "Absent"
    }.`,
  };
}

function normalizeCompanyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeWorkerNameRegex(name: string) {
  return new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

export async function addDaybookEntryAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const entryType = String(formData.get("entryType") ?? "");
  const entryDateKey = normalizeDateKey(String(formData.get("entryDate") ?? ""));
  const partyName = String(formData.get("partyName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const expenseItem = String(formData.get("expenseItem") ?? formData.get("partyName") ?? "").trim();

  if (!DAYBOOK_ENTRY_TYPES.includes(entryType as (typeof DAYBOOK_ENTRY_TYPES)[number])) {
    redirect(`/admin/daybook?date=${entryDateKey}&error=invalid-type`);
  }

  if (!partyName) {
    redirect(`/admin/daybook?date=${entryDateKey}&error=missing-party`);
  }

  const payload: Record<string, string | number | Date> = {
    entryDateKey,
    entryDate: new Date(`${entryDateKey}T00:00:00.000Z`),
    type: entryType,
    partyName,
    category: String(formData.get("category") ?? "").trim() || entryType,
    note,
  };

  if (entryType === "purchase") {
    const purchaseSource = String(formData.get("purchaseSource") ?? "").trim();
    const materialName = String(
      formData.get("materialName") ?? formData.get("otherMaterialName") ?? "",
    ).trim();
    const otherMaterialName = String(formData.get("otherMaterialName") ?? "").trim();
    const finalMaterialName = materialName === "Other" ? otherMaterialName : materialName;
    const vehicleNumber = String(formData.get("vehicleNumber") ?? "").trim();
    const driverName = String(formData.get("driverName") ?? "").trim();
    const driverPhone = String(formData.get("driverPhone") ?? "").trim();
    const weight = Number(formData.get("weight") ?? 0);

    if (!purchaseSource || !finalMaterialName || !vehicleNumber || !driverName || !driverPhone || !weight) {
      redirect(`/admin/daybook?date=${entryDateKey}&error=missing-fields`);
    }

    payload.category = purchaseSource;
    payload.materialSource = purchaseSource;
    payload.materialName = finalMaterialName;
    payload.vehicleNumber = vehicleNumber;
    payload.driverName = driverName;
    payload.driverPhone = driverPhone;
    payload.weight = weight;
  }

  if (entryType === "sale") {
    const materialName = String(formData.get("materialName") ?? "").trim();
    const vehicleNumber = String(formData.get("vehicleNumber") ?? "").trim();
    const driverName = String(formData.get("driverName") ?? "").trim();
    const driverPhone = String(formData.get("driverPhone") ?? "").trim();
    const weight = Number(formData.get("weight") ?? 0);

    if (!materialName || !vehicleNumber || !driverName || !driverPhone || !weight) {
      redirect(`/admin/daybook?date=${entryDateKey}&error=missing-fields`);
    }

    payload.category = "company-sale";
    payload.materialName = materialName;
    payload.vehicleNumber = vehicleNumber;
    payload.driverName = driverName;
    payload.driverPhone = driverPhone;
    payload.weight = weight;

    const normalizedName = normalizeCompanyName(partyName);
    await CompanyModel.findOneAndUpdate(
      { normalizedName },
      {
        name: partyName,
        normalizedName,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  if (entryType === "payment_given" || entryType === "payment_received") {
    const amount = Number(formData.get("amount") ?? 0);
    const category = String(formData.get("category") ?? "").trim();

    if (!amount || !category) {
      redirect(`/admin/daybook?date=${entryDateKey}&error=missing-fields`);
    }

    payload.category = category;
    payload.amount = amount;

    if (category === "Other Expense" && !expenseItem) {
      redirect(`/admin/daybook?date=${entryDateKey}&error=missing-fields`);
    }

    if (category === "Other Expense") {
      payload.partyName = expenseItem;
    }

    if (entryType === "payment_given" && WORKER_PAYMENT_CATEGORIES.includes(category as (typeof WORKER_PAYMENT_CATEGORIES)[number])) {
      const workerType =
        DIHADI_PAYMENT_CATEGORIES.includes(category as (typeof DIHADI_PAYMENT_CATEGORIES)[number])
          ? "dihadi"
          : "permanent";
      const relatedWorker = (
        await WorkerModel.find({
          name: normalizeWorkerNameRegex(partyName),
        })
          .select("_id name role workerType")
          .lean()
      ).find((worker) => resolveWorkerType(worker) === workerType);

      if (relatedWorker?._id) {
        payload.workerId = relatedWorker._id;
      }
    }
  }

  await DaybookEntryModel.create(payload);

  revalidatePath("/admin");
  revalidatePath("/admin/daybook");
  redirect(`/admin/daybook?date=${entryDateKey}&success=entry-added`);
}

export async function deleteDaybookEntryAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const entryId = String(formData.get("entryId") ?? "").trim();
  const entryDateKey = normalizeDateKey(String(formData.get("entryDateKey") ?? ""));

  if (!entryId) {
    redirect(`/admin/daybook?date=${entryDateKey}&error=missing-entry`);
  }

  await DaybookEntryModel.findByIdAndDelete(entryId);

  revalidatePath("/admin");
  revalidatePath("/admin/daybook");
  redirect(`/admin/daybook?date=${entryDateKey}&success=entry-deleted`);
}
