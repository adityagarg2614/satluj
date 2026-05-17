import { Schema, model, models } from "mongoose";

export type WorkerDocument = {
  name: string;
  role: string;
  joiningDate: Date;
  salary: number;
  phoneNumber: string;
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
      required: true,
      trim: true,
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
