import { Schema, model, models } from "mongoose";

export const WORKER_TYPES = ["permanent", "dihadi"] as const;

export type WorkerType = (typeof WORKER_TYPES)[number];

export type WorkerDocument = {
  name: string;
  role: string;
  workerType: WorkerType;
  joiningDate: Date;
  salary: number;
  phoneNumber?: string;
  photoUrl?: string;
};

const workerSchema = new Schema<WorkerDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    workerType: {
      type: String,
      enum: WORKER_TYPES,
      required: true,
      default: "permanent",
      index: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    photoUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const WorkerModel = models.Worker || model<WorkerDocument>("Worker", workerSchema);
