import { Schema, Model, model, Types } from 'mongoose';


export interface TransactionPayload {
    _id: string;
    type: string;
    description: string;
    reference: string;
    walletId: string;
    userId: string;
    amount: number;
    channel: string;
    status?: string;
}

const transactionSchema = new Schema({
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
    },
    description: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
        trim: true
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: "wallets",
        trim: true
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'ABANDONED', 'PENDING'],
        default: 'PENDING'
    },
    amount: {
        type: Number,
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        trim: true
    },
    channel: {
        type: String,
        trim: true
    }
},
    {
        timestamps: true
    })

export const transactionModel: Model<TransactionPayload> = model<TransactionPayload>('transactions', transactionSchema);