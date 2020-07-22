import { Schema, Model, model, Types } from "mongoose";

export interface StaffPayload {
  _id: string;
  fullName: string;
  email: string;
  mobile: number;
  password: string;
  active: boolean;
  otpVerified: boolean;
  status?: string;
  isDeleted: boolean;
  services: Array<string>;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["APPROVED", "DISAPPROVED", "PENDING"],
      default: "PENDING",
    },

    active: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    onTask: {
      type: Boolean,
      default: false,
    },
    services: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  },
);

export const staffModel: Model<StaffPayload> = model<StaffPayload>(
  "staffs",
  staffSchema,
);
