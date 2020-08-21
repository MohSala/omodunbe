import { Schema, Model, model, Types } from 'mongoose';
import { config } from '../config/config'

export interface UserPayload {
  _id: string;
  fullName: string;
  email: string;
  mobile: number;
  password: string;
  otpVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      trim: true
    },
    mobile: {
      type: String,
    },

    otpVerified: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false
    }

  },
  {
    timestamps: true
  }
);


export const userModel: Model<UserPayload> = model<UserPayload>('users', userSchema);

