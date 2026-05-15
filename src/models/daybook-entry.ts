import { Schema, model, models } from "mongoose";

export const DAYBOOK_ENTRY_TYPES = [
  "purchase",
  "sale",
  "payment_given",
  "payment_received",
] as const;

export type DaybookEntryType = (typeof DAYBOOK_ENTRY_TYPES)[number];

export type DaybookEntryDocument = {
  entryDateKey: string;
  entryDate: Date;
  type: DaybookEntryType;
  partyName: string;
  category: string;
  materialSource?: string;
  materialName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  weight?: number;
  amount?: number;
  note?: string;
};

const daybookEntrySchema = new Schema<DaybookEntryDocument>(
  {
    entryDateKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entryDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: DAYBOOK_ENTRY_TYPES,
      required: true,
      index: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    materialSource: {
      type: String,
      trim: true,
      default: "",
    },
    materialName: {
      type: String,
      trim: true,
      default: "",
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },
    driverName: {
      type: String,
      trim: true,
      default: "",
    },
    driverPhone: {
      type: String,
      trim: true,
      default: "",
    },
    weight: {
      type: Number,
      min: 0,
      default: null,
    },
    amount: {
      type: Number,
      min: 0,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const DaybookEntryModel =
  models.DaybookEntry || model<DaybookEntryDocument>("DaybookEntry", daybookEntrySchema);
