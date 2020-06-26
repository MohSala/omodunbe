import { UserPayload, userModel } from "../model/user"
import { TaskPayload, taskModel } from "../model/task"
import axios from "axios"
import { config } from "../config/config"
export class UserServices {
    logger: any;
    mongoclient: any;
    /**
     *
     * @param {*} logger Logger Object
     * @param {*} mongoclient mongoclient Object
     */
    constructor(logger: any, mongoclient: any) {
        this.logger = logger;
        this.mongoclient = mongoclient
    }


    public async findUser(mobile: any) {
        return userModel.findOne({ mobile })
    }

    public async findOne(email: string) {
        return userModel.findOne({ email })
    }

    public async findById(id: string) {
        return userModel.findOne({ _id: id }).exec();
    }

    public async updatePassword(mobile: string, password: string) {
        return userModel.findOneAndUpdate({ mobile }, { password }, { new: true }).exec();
    }

    public async verifyUser(mobile: string) {
        return await userModel.findOneAndUpdate({ mobile }, { active: true, otpVerified: true }, { new: true, upsert: true }).exec()
    }


    public async uploadUserImage(mobile: string, image: string) {
        return userModel.findOneAndUpdate({ mobile }, { image }, { new: true }).exec();
    }

    public async getAllUsers(query, paginate) {
        return userModel.find({ userType: query }).select("-password -fcmtoken")
            .sort({ updatedAt: -1 })
            .limit(paginate.limit).skip(paginate.page * paginate.limit)
            .exec();
    }

    async countWithSearchQuery(query) {
        const count = await userModel.countDocuments({ userType: query })
        return count;
    }

    async updateUserDetails(id: string, body: string) {
        return userModel.findByIdAndUpdate({ _id: id }, { $set: body }, { new: true }).exec()
    }

    async addEmailAddress(email: string, mobile: string) {
        return userModel.findOneAndUpdate({ mobile }, { email }, { new: true }).exec();
    }


    /**
     * 
     * TASK SERVICE LIVES HERE
     */

    async createTask(param: any) {
        const { merchant_id, staff_id, task_type, task_subtype, price, status, scheduled_date } = param;
        const createTask = new taskModel({
            merchant_id,
            staff_id,
            task_type,
            task_subtype,
            price,
            status,
            scheduled_date
        })
        return createTask.save();
    }
};