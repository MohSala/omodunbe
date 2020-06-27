import { TransactionPayload, transactionModel } from "../model/transaction"
import { WalletPayload, walletModel } from "../model/wallet"

export class TransactionServices {
    public async registerCreditTransaction(param: any) {
        const { description, walletId, amount, mobile, reference } = param;

        const creditTransaction = new transactionModel({
            type: "CREDIT",
            description,
            walletId,
            status: "COMPLETED",
            amount,
            mobile,
            channel: "CARD",
            reference
        });
        return creditTransaction.save();
    }

    public async getUserTransactions(walletId: any) {
        return transactionModel.find({ walletId }).sort({ updatedAt: -1 }).exec();
    }

    public async createWallet(mobile: any) {
        const createWallet = new walletModel({
            mobile
        })
        return createWallet.save();
    }

    public async findWallet(mobile: string) {
        return walletModel.findOne({ mobile }).exec();
    }
}