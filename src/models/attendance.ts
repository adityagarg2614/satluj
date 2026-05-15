import { Schema, Types, model, models } from "mongoose";

export const ATTENDANCE_STATUSES = ["present", "half", "absent"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceDocument = {
  workerId: Types.ObjectId;
  dateKey: string;
  date: Date;
  status: AttendanceStatus;
  dayValue: number;
};

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    dayValue: {
      type: Number,
      required: true,
      enum: [0, 0.5, 1],
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ workerId: 1, dateKey: 1 }, { unique: true });

export const AttendanceModel =
  models.Attendance || model<AttendanceDocument>("Attendance", attendanceSchema);
