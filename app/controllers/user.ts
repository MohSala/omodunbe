import { success, failure } from "../lib/response_manager";
import { HTTPStatus } from "../constants/http_status";
import { UserPayload } from "../model/user";
import { config } from "../config/config";
import redis from "redis";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
import bluebird from "bluebird";
const connectionParams = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 10,
};
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient(connectionParams);
const upload = require("../services/uploadService");
import pagination from "../services/pagination";
import { TaskPayload } from "../model/task";
import { TransactionPayload } from "../model/transaction";
import { WalletPayload } from "../model/wallet";
import { StaffPayload } from "../model/staff";

client.on("connect", () => {
  console.log("redis client connected successfully");
});
client.on("error", (err) => {
  console.log("Error connecting to redis" + err);
});

export class UserController {
  logger: any;
  userService: any;
  otpService: any;
  transactionService: any;
  /**
     *
     * @param {*} logger Logger Object
     * @param {*} userService userService Object
     * @param {*} otpService otpService object
     */
  constructor(
    logger: any,
    userService: any,
    otpService: any,
    transactionService: any,
  ) {
    this.logger = logger;
    this.userService = userService;
    this.otpService = otpService;
    this.transactionService = transactionService;
  }

  async checkIfUserExists(req: any, res: any) {
    const { mobile } = req.body;
    if (!mobile) {
      return failure(res, {
        message: "Please fill in Mobile",
      }, HTTPStatus.BAD_REQUEST);
    }

    try {
      const data: UserPayload = await this.userService.findUser(mobile);
      if (!data) {
        let code = Math.floor(Math.random() * 90000) + 10000;
        client.set(mobile, code);
        client.expire(mobile, 300);
        let message = `Activation code for TherapyBox: ${code}.`;
        this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1));
        return success(res, {
          message: `Merchant Created Successfully,otp code is ${code}`,
        }, HTTPStatus.CREATED);
      } else {
        return success(res, {
          message: `User Exists`,
          response: data,
        }, HTTPStatus.OK);
      }
    } catch (error) {
      this.logger.info("Error from checking user ", error);
      return failure(res, {
        message: "Sorry an error occured",
      }, HTTPStatus.BAD_REQUEST);
    }
  }

  async registerTask(req: any, res: any) {
    const {
      mobile,
      task_type,
      task_subtype,
      price,
      scheduled_date,
      description,
    } = req.body;
    if (
      !mobile || !task_subtype || !task_type || !price || !scheduled_date
    ) {
      return failure(
        res,
        { message: "Kindly add all required fields" },
        HTTPStatus.BAD_REQUEST,
      );
    }

    try {
      // remember to registr a task as a transaction
      const findStaff: StaffPayload = await this.userService
        .findAvailableStaffForTask(task_type);
      if (findStaff) {
        const param = {
          mobile,
          staff_id: findStaff._id,
          task_type,
          task_subtype,
          price,
          scheduled_date,
          description,
        };
        const data: TaskPayload = await this.userService.createTask(param);
        const setOnTask: StaffPayload = await this.userService.setOnTaskToTrue(
          findStaff._id,
        );
        if (data && setOnTask) {
          return success(res, {
            message: "Task Created Successfully",
            response: { data, staff: findStaff },
          }, HTTPStatus.CREATED);
        } else {
          return failure(res, {
            message: "Sorry could not create task at the moment",
          }, HTTPStatus.BAD_REQUEST);
        }
      } else {
        return failure(res, {
          message:
            "Sorry could not find an available representative, give us a few!",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from checking task ", error);
      return failure(res, {
        message: "Sorry an error occured while creating task",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createCreditTransaction(req: any, res: any) {
    const { description, walletId, mobile, amount, reference } = req.body;
    if (!description || !walletId || !mobile || !amount || !reference) {
      return failure(
        res,
        { message: "Kindly add all required fields" },
        HTTPStatus.BAD_REQUEST,
      );
    }
    try {
      const param = {
        description,
        walletId,
        amount,
        mobile,
        reference,
      };
      const createCreditTransaction: TransactionPayload = await this
        .transactionService.registerCreditTransaction(param);
      if (createCreditTransaction) {
        const wallet = await this.transactionService.findWallet(mobile);
        if (wallet) {
          wallet.availableBalance += amount * 100;
          await wallet.save();
          return success(res, {
            message: "Transaction Created Successfully",
            response: createCreditTransaction,
          }, HTTPStatus.OK);
        } else {
          return failure(
            res,
            { message: "User Wallet not found" },
            HTTPStatus.BAD_REQUEST,
          );
        }
      } else {
        return failure(
          res,
          { message: "Transaction could not be created" },
          HTTPStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.info("Error from creating credit transaction ", error);
      return failure(res, {
        message: "Sorry an error occured while creating a credit transaction ",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createStaff(req: any, res: any) {
    const { fullName, email, password, mobile, services } = req.body;

    if (!fullName || !email || !password || !mobile || !services) {
      return failure(res, {
        message: "Please fill in Name, Email, Mobile and password fields",
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      const param = {
        fullName,
        email,
        password,
        mobile,
        services,
        status: "PENDING",
        active: false,
      };

      const data: StaffPayload = await this.userService.createStaff(param);
      if (data) {
        return success(res, {
          message: `Staff created Successfully`,
          response: data,
        }, HTTPStatus.OK);
      } else {
        return failure(res, {
          message: "Sorry staff could not be created",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from creating staff ", error);
      return failure(res, {
        message: "Sorry an error occured while creating staff ",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletBalance(req: any, res: any) {
    const { mobile } = req.query;
    if (!mobile) {
      return failure(res, {
        message: "Please fill in Mobile",
      }, HTTPStatus.BAD_REQUEST);
    }

    try {
      const data: WalletPayload = await this.transactionService.findWallet(
        mobile,
      );
      if (data) {
        return success(res, {
          message: `Wallet Returned Successfully`,
          response: data,
        }, HTTPStatus.OK);
      } else {
        return failure(res, {
          message: "Wallet not found for User",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from retrieving wallet ", error);
      return failure(res, {
        message: "Sorry an error occured while retrieving user wallet ",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserTransactions(req: any, res: any) {
    const { walletId } = req.query;
    if (!walletId) {
      return failure(res, {
        message: "Please fill in walletId",
      }, HTTPStatus.BAD_REQUEST);
    }

    try {
      const data: TransactionPayload = await this.transactionService
        .getUserTransactions(walletId);
      if (data) {
        return success(res, {
          message: `Transaction data Returned Successfully`,
          response: data,
        }, HTTPStatus.OK);
      } else {
        return failure(res, {
          message: "No Transaction data found",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from retrieving transaction data ", error);
      return failure(res, {
        message:
          "Sorry an error occured while retrieving user transaction data ",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getLatestActivity(req: any, res: any) {
    const { walletId } = req.query;
    if (!walletId) {
      return failure(res, {
        message: "Please fill in walletId",
      }, HTTPStatus.BAD_REQUEST);
    }

    try {
      const data: TransactionPayload = await this.transactionService
        .getLatestActivity(walletId);
      if (data) {
        return success(res, {
          message: `Transaction data Returned Successfully`,
          response: data,
        }, HTTPStatus.OK);
      } else {
        return failure(res, {
          message: "No Transaction data found",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from retrieving transaction data ", error);
      return failure(res, {
        message:
          "Sorry an error occured while retrieving user transaction data ",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyUser(req: any, res: any) {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return failure(
        res,
        { message: "Kindly add mobile and otp fields" },
        HTTPStatus.BAD_REQUEST,
      );
    }

    const reply = await client.getAsync(mobile);
    if (otp === reply) {
      const data: UserPayload = await this.userService.verifyUser(mobile);
      return success(res, {
        message: "User Verified Successfully",
      }, HTTPStatus.OK);
    } else {
      return failure(
        res,
        { message: "OTP is invalid" },
        HTTPStatus.BAD_REQUEST,
      );
    }
  }

  async updateEmailAddress(req: any, res: any) {
    let { mobile, email } = req.body;
    if (!mobile || !email) {
      return failure(res, {
        message: "Please fill in Mobile and password fields",
      }, HTTPStatus.BAD_REQUEST);
    }
    const userRecordWithEmail: UserPayload = await this.userService.findOne(
      email,
    );
    if (userRecordWithEmail) {
      return failure(
        res,
        { message: "This Merchant already exists" },
        HTTPStatus.BAD_REQUEST,
      );
    } else {
      try {
        const data: UserPayload = await this.userService.addEmailAddress(
          email,
          mobile,
        );
        if (data) {
          await this.transactionService.createWallet(mobile);
        }
        return success(res, {
          message: "User Email Added Successfully",
          response: data,
        }, HTTPStatus.CREATED);
      } catch (error) {
        this.logger.info("Error Occured during email addition ", error);
        return failure(res, {
          message:
            "Sorry an internal server error occured while adding email address",
        }, HTTPStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async checkOtpVerifiedAndUpdatePwd(req: any, res: any) {
    let { mobile, password } = req.body;
    if (!mobile || !password) {
      return failure(res, {
        message: "Please fill in Mobile and password fields",
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      const data: UserPayload = await this.userService.findUser(mobile);
      if (data.otpVerified) {
        const salt: String = await bcrypt.genSalt(10);
        const hash: String = await bcrypt.hash(password, salt);
        password = hash;
        const savePwd = await this.userService.updatePassword(mobile, password);
        const token = await jwt.sign(
          { mobile, password },
          config.secretKey,
          { expiresIn: "0" },
        );
        return success(res, {
          message: "User Updated password credential Successfully",
          response: { savePwd, token },
        }, HTTPStatus.CREATED);
      } else {
        return failure(res, {
          message: "User OTP has not been verified",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from updating user pwd ", error);
      return failure(res, {
        message: "Sorry an error occured",
      }, HTTPStatus.BAD_REQUEST);
    }
  }

  async login(req: any, res: any) {
    let { mobile, password } = req.body;
    if (!mobile || !password) {
      return failure(res, {
        message: "Please fill in Mobile and Password Field",
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      const user: UserPayload = await this.userService.findUser(mobile);
      if (!user) {
        return failure(
          res,
          { message: "No user found" },
          HTTPStatus.BAD_REQUEST,
        );
      }
      const match = await bcrypt.compareSync(password, user.password);
      if (!match) {
        return failure(
          res,
          { message: "Password incorrect" },
          HTTPStatus.BAD_REQUEST,
        );
      } else {
        const token = await jwt.sign(
          { mobile },
          config.secretKey,
          { expiresIn: "0" },
        );
        return success(res, {
          message: "User Signed in Successfully",
          response: { user, token },
        }, HTTPStatus.OK);
      }
    } catch (error) {
      this.logger.info("Error Occured during signin ", error);
      return failure(res, {
        message: "Sorry an internal server error occured",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendOtpForForgotPassword(req: any, res: any) {
    const { mobile } = req.body;
    if (!mobile) {
      return failure(res, {
        message: "Please fill in Mobile number",
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      const user: UserPayload = await this.userService.findUser(mobile);
      if (user) {
        // Generate code and add to cache
        let code: Number = Math.floor(Math.random() * 90000) + 10000;
        client.set(mobile, code);
        client.expire(mobile, 300);
        let message: String = `Password Reset code for TherapyBox: ${code}.`;
        this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1));
        return success(res, {
          message: `OTP sent successfully, otp code is ${code}`,
        }, HTTPStatus.OK);
      } else {
        return failure(
          res,
          { message: "Sorry, no user found" },
          HTTPStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.info("Error from sending forgot password otp  ", error);
      return failure(res, {
        message: "Sorry an error occured",
      }, HTTPStatus.BAD_REQUEST);
    }
  }

  async updatePassword(req: any, res: any) {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return failure(res, {
        message:
          "Please fill in all required fields including mobile and password",
      }, HTTPStatus.BAD_REQUEST);
    }

    try {
      const user = await this.userService.findUser(mobile);
      if (user) {
        if (user.deliveryAddress.coordinates.length === 0) {
          user.deliveryAddress = null;
        }
        const verifiedQuestionBoolean: Boolean = user.verifiedQuestion;
        if (verifiedQuestionBoolean) {
          const salt: String = await bcrypt.genSalt(10);
          const hash: String = await bcrypt.hash(password, salt);
          await this.userService.findAndChangePasswordAndVerifyQuestionBoolean(
            mobile,
            hash,
          );
          const payload = { user };
          const token = await jwt.sign(
            payload,
            config.secretKey,
            { expiresIn: "14d" },
          );
          return success(res, {
            message: "User Password has been updated successfully",
            response: { user, token },
          }, HTTPStatus.OK);
        } else {
          return failure(
            res,
            { message: "Sorry, password could not be updated" },
            HTTPStatus.BAD_REQUEST,
          );
        }
      } else {
        return failure(
          res,
          { message: "Sorry, User could not be found" },
          HTTPStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.info("Error from updating password ", error);
      return failure(res, {
        message: "Sorry an error occured",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async changePasswordWithoutOTP(req: any, res: any) {
    const { id } = req.userData;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return failure(
        res,
        {
          message:
            "Please fill in required fields including oldPassword and newPassword",
        },
        HTTPStatus.BAD_REQUEST,
      );
    }
    try {
      const findUser: UserPayload = await this.userService.findById(id);
      const old = findUser.password;
      const match = await bcrypt.compare(oldPassword, old);
      if (!match) {
        return failure(
          res,
          { message: "Password incorrect" },
          HTTPStatus.BAD_REQUEST,
        );
      }
      const salt: String = await bcrypt.genSalt(10);
      const hash: String = await bcrypt.hash(newPassword, salt);
      const user: UserPayload = await this.userService.updatePassword(id, hash);
      const payload = {
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        id: user._id,
        userType: user.userType,
      };
      const token = await jwt.sign(
        payload,
        config.secretKey,
        { expiresIn: "14d" },
      );

      return success(res, {
        message: "User Changed password Successfully",
        response: { user, token },
      }, HTTPStatus.OK);
    } catch (error) {
      this.logger.info("Error Occured during password change ", error);
      return failure(res, {
        message:
          "Sorry an internal server error occured while changing password",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(req: any, res: any) {
    const { fcmtoken } = req.body;
    let token = req.headers["authorization"];
    if (!fcmtoken) {
      return failure(res, {
        message: "Please Provide FCMTOKEN",
      }, HTTPStatus.BAD_REQUEST);
    }
    if (!token) {
      return failure(res, {
        message: "Please Provide Token",
      }, HTTPStatus.UNAUTHORIZED);
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }
    try {
      await jwt.verify(token, config.secretKey, async (err, decoded) => {
        if (err) {
          this.logger.info("Could not verify user token ", err);
          return failure(res, {
            message: "Could not verify user",
          }, HTTPStatus.BAD_REQUEST);
        }
        const { mobile } = decoded;
        const removedToken = await this.userService.removeFcmTokenFromArray(
          mobile,
          fcmtoken,
        );
        return success(res, {
          message: "User FCMTOKEN removed Successfully",
          response: removedToken,
        }, HTTPStatus.OK);
      });
    } catch (error) {
    }
  }

  async resendOTP(req: any, res: any) {
    const { mobile } = req.body;
    if (!mobile) {
      return failure(res, {
        message: "Provide missing mobile field",
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      const user: UserPayload = await this.userService.findUser(mobile);
      if (user) {
        // Regenerate code and add to cache
        let code = Math.floor(Math.random() * 90000) + 10000;
        client.set(mobile, code);
        client.expire(mobile, 300);
        let message = `Activation code for ODA: ${code}.`;
        this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1));
        return success(res, {
          message: `OTP Sent Successfully, otp code is ${code}`,
        }, HTTPStatus.OK);
      } else {
        return failure(res, {
          message: "User could not be found",
        }, HTTPStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.info("Error from resending OTP ", error);
      return failure(res, {
        message: "Sorry an error occured while resending OTP",
      }, HTTPStatus.BAD_REQUEST);
    }
  }

  async uploadImage(req: any, res: any) {
    const singleUpload = upload.single("image");
    const { mobile } = req.userData;
    try {
      return singleUpload(req, res, async (err) => {
        if (err) {
          this.logger.info("Error Uploading image ", err);
          return failure(res, {
            message: "Sorry user image could not be uploaded",
          }, HTTPStatus.BAD_REQUEST);
        }
        const imageUrl: String = req.file.location;
        const data: UserPayload = await this.userService.uploadUserImage(
          mobile,
          imageUrl,
        );
        return success(res, {
          message: "Image Uploaded Successfully",
          response: { url: imageUrl },
        }, HTTPStatus.OK);
      });
    } catch (error) {
      this.logger.info("Error Uploading image ", error);
      return failure(res, {
        message: "Sorry an error occured while uploading image",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserDetails(req: any, res: any) {
    const { id } = req.userData;
    const single = upload.single("file");
    let { email, fullName, mobile } = req.body;
    if (!id) {
      return failure(res, {
        message: `Token could not be validated`,
      }, HTTPStatus.BAD_REQUEST);
    }
    try {
      if (req.file) {
        return single(req, res, async (err) => {
          if (err) {
            this.logger.error("Error Uploading image ", err);
            return failure(res, {
              message: "Sorry user image could not be uploaded",
            }, HTTPStatus.BAD_REQUEST);
          }
          const imageUrl = req.file.location;
          const param = {
            fullName,
            email,
            mobile,
            image: imageUrl,
          };
          const data: UserPayload = await this.userService.updateUserDetails(
            id,
            param,
          );
          return success(res, {
            message: "User Details edited successfully",
            response: data,
          }, HTTPStatus.OK);
        });
      } else {
        const param = {
          fullName,
          email,
          mobile,
        };

        const data: UserPayload = await this.userService.updateUserDetails(
          id,
          param,
        );
        return success(res, {
          message: "User Details edited successfully",
          response: data,
        }, HTTPStatus.OK);
      }
    } catch (error) {
      this.logger.error("could not edit user details ", error);
      return failure(res, {
        message: "Could Not update user at this time",
      }, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
