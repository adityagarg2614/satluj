import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { AdminModel } from "@/models/admin";

export async function ensureSeedAdmin() {
  await connectToDatabase();

  const existingAdmin = await AdminModel.findOne().lean();
  if (existingAdmin) {
    return existingAdmin;
  }

  const email = getRequiredEnv("ADMIN_EMAIL").toLowerCase();
  const password = getRequiredEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Satluj Stones Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  return AdminModel.create({
    email,
    name,
    passwordHash,
  });
}

export async function verifyAdminLogin(email: string, password: string) {
  await ensureSeedAdmin();

  const admin = await AdminModel.findOne({
    email: email.toLowerCase(),
  });

  if (!admin) {
    return null;
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
  };
}
