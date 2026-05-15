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
