import { Schema, Model, model, Types } from 'mongoose';

export interface TaskPayload {
    _id: string;
    merchant_id: string;
    staff_id: string;
    task_type: string;
    task_subtype: string;
    price: string;
    scheduled_date: Date;
    status?: string;
    isDeleted: boolean;
}

const taskSchema = new Schema(
    {
        merchant_id: {
            type: Schema.Types.ObjectId,
            ref: "users",
            trim: true
        },
        staff_id: {
            type: Schema.Types.ObjectId,
            ref: "staffs",
            trim: true,
        },

        task_type: {
            type: String,
            trim: true
        },
        task_subtype: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            trim: true
        },

        status: {
            type: String,
            enum: ['COMPLETED', 'ABANDONED', 'PENDING'],
            default: 'PENDING'
        },

        scheduled_date: {
            type: Date
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


export const taskModel: Model<TaskPayload> = model<TaskPayload>('tasks', taskSchema);

