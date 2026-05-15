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
  ATTENDANCE_STATUSES,
  AttendanceModel,
  type AttendanceStatus,
} from "@/models/attendance";
import { CompanyModel } from "@/models/company";
import { DAYBOOK_ENTRY_TYPES, DaybookEntryModel } from "@/models/daybook-entry";
import { WorkerModel } from "@/models/worker";

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
  const joiningDate = String(formData.get("joiningDate") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  if (!name || !role || !joiningDate || !phoneNumber) {
    redirect("/admin/workers?error=worker-fields");
  }

  await WorkerModel.create({
    name,
    role,
    joiningDate: new Date(joiningDate),
    phoneNumber,
    photoUrl,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  redirect("/admin/workers?success=worker-added");
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

function normalizeCompanyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function addDaybookEntryAction(formData: FormData) {
  await requireAdminSession();
  await connectToDatabase();

  const entryType = String(formData.get("entryType") ?? "");
  const entryDateKey = normalizeDateKey(String(formData.get("entryDate") ?? ""));
  const partyName = String(formData.get("partyName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

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
  }

  await DaybookEntryModel.create(payload);

  revalidatePath("/admin");
  revalidatePath("/admin/daybook");
  redirect(`/admin/daybook?date=${entryDateKey}&success=entry-added`);
}
