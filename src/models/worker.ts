import { Schema, model, models } from "mongoose";

export type WorkerDocument = {
  name: string;
  role: string;
  joiningDate: Date;
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
