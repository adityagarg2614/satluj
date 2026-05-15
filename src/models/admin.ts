import { Schema, model, models } from "mongoose";

export type AdminDocument = {
  email: string;
  name: string;
  passwordHash: string;
};

const adminSchema = new Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const AdminModel = models.Admin || model<AdminDocument>("Admin", adminSchema);
