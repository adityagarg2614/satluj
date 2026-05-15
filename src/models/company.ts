import { Schema, model, models } from "mongoose";

export type CompanyDocument = {
  name: string;
  normalizedName: string;
};

const companySchema = new Schema<CompanyDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CompanyModel =
  models.Company || model<CompanyDocument>("Company", companySchema);
