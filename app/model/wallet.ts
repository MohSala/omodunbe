import { Schema, Model, model, Types } from 'mongoose';


export interface WalletPayload {
    _id: string;
    availableBalance: number;
    bonusBalance: number;
    active: boolean;
    mobile: string;
}


const walletSchema = new Schema({
    availableBalance: {
        type: Number,
        trim: true,
        default: 0
    },
    bonusBalance: {
        type: Number,
        trim: true,
        default: 0
    },
    active: {
        type: Boolean,
        default: false
    },
    mobile: {
        type: String,
        trim: true
    },
})

export const walletModel: Model<WalletPayload> = model<WalletPayload>('wallets', walletSchema);