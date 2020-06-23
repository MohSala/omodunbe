import { success, failure } from '../lib/response_manager';
import { HTTPStatus } from '../constants/http_status';
import { UserPayload } from "../model/user"
import { config } from '../config/config';
import redis from "redis";
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
import bluebird from "bluebird"
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient();
const upload = require("../services/uploadService")
import pagination from "../services/pagination"


export class UserController {
    logger: any;
    userService: any;
    otpService: any;
    /**
     *
     * @param {*} logger Logger Object
     * @param {*} userService userService Object
     * @param {*} otpService otpService object
     */
    constructor(logger: any, userService: any, otpService: any) {
        this.logger = logger;
        this.userService = userService;
        this.otpService = otpService;
    }


    async checkIfUserExists(req: any, res: any) {
        const { mobile } = req.body;
        if (!mobile) {
            return failure(res, {
                message: 'Please fill in Mobile',
            }, HTTPStatus.BAD_REQUEST);
        }

        try {
            const data: UserPayload = await this.userService.findUser(mobile);
            if (!data) {
                let code = Math.floor(Math.random() * 90000) + 10000;
                client.set(mobile, code);
                client.expire(mobile, 300);
                let message = `Activation code for TherapyBox: ${code}.`;
                this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1))
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
            this.logger.info("Error from checking user ", error)
            return failure(res, {
                message: 'Sorry an error occured',
            }, HTTPStatus.BAD_REQUEST);
        }
    }
    async merchantSignUp(req: any, res: any) {
        let { fullName, email, password, mobile, referer } = req.body;
        if (!fullName || !email || !password || !mobile) {
            return failure(res, { message: 'Please fill in all required fields' },
                HTTPStatus.BAD_REQUEST);
        }
        const existingUserRecord = await this.userService.findUser(mobile);
        if (existingUserRecord != null) {
            return failure(res, { message: 'This Merchant already exists' },
                HTTPStatus.BAD_REQUEST);
        }
        const userRecordWithEmail: UserPayload = await this.userService.findOne(email)
        if (userRecordWithEmail != null) {
            return failure(res, { message: 'This Merchant already exists' },
                HTTPStatus.BAD_REQUEST);
        }
        try {
            let param = {
                fullName, email, password, mobile, referer
            }

            try {
                const salt: String = await bcrypt.genSalt(10);
                const hash: String = await bcrypt.hash(param.password, salt)
                param.password = hash
                const data = await this.userService.saveNewMerchant(param)
                // Generate code and add to cache
                let code = Math.floor(Math.random() * 90000) + 10000;
                client.set(mobile, code);
                client.expire(mobile, 300);
                let message = `Activation code for ODA: ${code}.`;
                this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1))
                const payload = {
                    fullName: data.fullName,
                    email: data.email,
                    mobile: data.mobile,
                    id: data._id,
                    userType: data.userType
                }
                const token = await jwt.sign(payload, config.secretKey, { expiresIn: '14d' })
                const createUserWallet = await this.userService.createUserWallet(data._id, token);
                this.logger.info(createUserWallet.data.message, createUserWallet.data);
                // Push user Id to Queue for referral system
                const queue = 'referralGeneratorJobs'
                return success(res, {
                    message: `Merchant Created Successfully,otp code is ${code}`,
                    response: { user: data, token },
                }, HTTPStatus.OK);
            } catch (error) {
                this.logger.info("Error from signing token ", error)
                return failure(res, {
                    message: 'Sorry an error occured',
                }, HTTPStatus.BAD_REQUEST);
            }
        } catch (error) {
            this.logger.info("Error Occured during signup ", error)
            return failure(res, {
                message: 'Sorry an internal server error occured',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }

    }

    async verifyUser(req: any, res: any) {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            return failure(res, { message: 'Kindly add mobile and otp fields' },
                HTTPStatus.BAD_REQUEST);
        }

        const reply = await client.getAsync(mobile)
        if (otp === reply) {
            const data: UserPayload = await this.userService.verifyUser(mobile)
            return success(res, {
                message: 'User Verified Successfully',
            }, HTTPStatus.OK);
        }
        else {
            return failure(res, { message: 'OTP is invalid' },
                HTTPStatus.BAD_REQUEST);
        }



    }

    async updateEmailAddress(req: any, res: any) {
        let { mobile, email } = req.body;
        if (!mobile || !email) {
            return failure(res, {
                message: 'Please fill in Mobile and password fields',
            }, HTTPStatus.BAD_REQUEST);
        }
        const userRecordWithEmail: UserPayload = await this.userService.findOne(email)
        if (userRecordWithEmail) {
            return failure(res, { message: 'This Merchant already exists' },
                HTTPStatus.BAD_REQUEST);
        }
        else {
            try {
                const data: UserPayload = await this.userService.addEmailAddress(email, mobile);
                return success(res, {
                    message: 'User Email Added Successfully',
                    response: data
                }, HTTPStatus.CREATED);
            } catch (error) {
                this.logger.info("Error Occured during email addition ", error)
                return failure(res, {
                    message: 'Sorry an internal server error occured while adding email address',
                }, HTTPStatus.INTERNAL_SERVER_ERROR);
            }
        }

    }

    async checkOtpVerifiedAndUpdatePwd(req: any, res: any) {
        let { mobile, password } = req.body;
        if (!mobile || !password) {
            return failure(res, {
                message: 'Please fill in Mobile and password fields',
            }, HTTPStatus.BAD_REQUEST);
        }
        try {
            const data: UserPayload = await this.userService.findUser(mobile);
            if (data.otpVerified) {
                const salt: String = await bcrypt.genSalt(10);
                const hash: String = await bcrypt.hash(password, salt)
                password = hash
                const savePwd = await this.userService.updatePassword(mobile, password);
                const token = await jwt.sign({ mobile, password }, config.secretKey, { expiresIn: '0' })
                return success(res, {
                    message: 'User Updated password credential Successfully',
                    response: { savePwd, token },
                }, HTTPStatus.CREATED);
            }
            else {
                return failure(res, {
                    message: 'User OTP has not been verified',
                }, HTTPStatus.BAD_REQUEST);
            }
        } catch (error) {
            this.logger.info("Error from updating user pwd ", error)
            return failure(res, {
                message: 'Sorry an error occured',
            }, HTTPStatus.BAD_REQUEST);
        }
    }

    async login(req: any, res: any) {
        let { mobile, password } = req.body;
        try {
            if (!mobile || !password) {
                return failure(res, {
                    message: 'Please fill in Mobile and Password Field',
                }, HTTPStatus.BAD_REQUEST);
            }
            const user: UserPayload = await this.userService.findUser(mobile);
            if (!user) {
                return failure(res, { message: 'No user found' },
                    HTTPStatus.BAD_REQUEST);
            }
            const match = await bcrypt.compareSync(password, user.password)
            if (!match) {
                return failure(res, { message: 'Password incorrect' },
                    HTTPStatus.BAD_REQUEST);
            }
            else {
                const payload = {
                    mobile: user.mobile,
                }
                const token = await jwt.sign({ mobile }, config.secretKey, { expiresIn: '0' })
                return success(res, {
                    message: 'User Signed in Successfully',
                    response: { user, token },
                }, HTTPStatus.OK);

            }


        } catch (error) {
            this.logger.info("Error Occured during signin ", error)
            return failure(res, {
                message: 'Sorry an internal server error occured',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async sendOtpForForgotPassword(req: any, res: any) {
        const { mobile } = req.body;
        if (!mobile) {
            return failure(res, {
                message: 'Please fill in Mobile number',
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
                this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1))
                return success(res, {
                    message: `OTP sent successfully, otp code is ${code}`,
                }, HTTPStatus.OK);
            }
            else {
                return failure(res, { message: 'Sorry, no user found' },
                    HTTPStatus.BAD_REQUEST);
            }
        } catch (error) {
            this.logger.info("Error from sending forgot password otp  ", error)
            return failure(res, {
                message: 'Sorry an error occured',
            }, HTTPStatus.BAD_REQUEST);
        }
    }

    async updatePassword(req: any, res: any) {
        const { mobile, password } = req.body;
        if (!mobile || !password) {
            return failure(res, {
                message: 'Please fill in all required fields including mobile and password',
            }, HTTPStatus.BAD_REQUEST);
        }

        try {
            const user = await this.userService.findUser(mobile)
            if (user) {
                if (user.deliveryAddress.coordinates.length === 0) user.deliveryAddress = null
                const verifiedQuestionBoolean: Boolean = user.verifiedQuestion;
                if (verifiedQuestionBoolean) {
                    const salt: String = await bcrypt.genSalt(10);
                    const hash: String = await bcrypt.hash(password, salt)
                    await this.userService.findAndChangePasswordAndVerifyQuestionBoolean(mobile, hash);
                    const payload = { user }
                    const token = await jwt.sign(payload, config.secretKey, { expiresIn: '14d' })
                    return success(res, {
                        message: 'User Password has been updated successfully',
                        response: { user, token }
                    }, HTTPStatus.OK);
                }
                else {
                    return failure(res, { message: 'Sorry, password could not be updated' },
                        HTTPStatus.BAD_REQUEST);
                }
            }
            else {
                return failure(res, { message: 'Sorry, User could not be found' },
                    HTTPStatus.BAD_REQUEST);
            }
        } catch (error) {
            this.logger.info("Error from updating password ", error)
            return failure(res, {
                message: 'Sorry an error occured',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async changePasswordWithoutOTP(req: any, res: any) {
        const { id } = req.userData;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return failure(res, { message: 'Please fill in required fields including oldPassword and newPassword' },
                HTTPStatus.BAD_REQUEST);
        }
        try {
            const findUser: UserPayload = await this.userService.findById(id);
            const old = findUser.password;
            const match = await bcrypt.compare(oldPassword, old)
            if (!match) {
                return failure(res, { message: 'Password incorrect' },
                    HTTPStatus.BAD_REQUEST);
            }
            const salt: String = await bcrypt.genSalt(10);
            const hash: String = await bcrypt.hash(newPassword, salt)
            const user: UserPayload = await this.userService.updatePassword(id, hash);
            const payload = {
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
                id: user._id,
                userType: user.userType
            }
            const token = await jwt.sign(payload, config.secretKey, { expiresIn: '14d' })

            return success(res, {
                message: 'User Changed password Successfully',
                response: { user, token },
            }, HTTPStatus.OK);
        } catch (error) {
            this.logger.info("Error Occured during password change ", error)
            return failure(res, {
                message: 'Sorry an internal server error occured while changing password',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async logout(req: any, res: any) {
        const { fcmtoken } = req.body;
        let token = req.headers['authorization'];
        if (!fcmtoken) {
            return failure(res, {
                message: 'Please Provide FCMTOKEN',
            }, HTTPStatus.BAD_REQUEST);
        }
        if (!token) {
            return failure(res, {
                message: 'Please Provide Token',
            }, HTTPStatus.UNAUTHORIZED);
        }
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length)
        }
        try {
            await jwt.verify(token, config.secretKey, async (err, decoded) => {
                if (err) {
                    this.logger.info('Could not verify user token ', err);
                    return failure(res, {
                        message: 'Could not verify user',
                    }, HTTPStatus.BAD_REQUEST);
                }
                const { mobile } = decoded
                const removedToken = await this.userService.removeFcmTokenFromArray(mobile, fcmtoken)
                return success(res, {
                    message: 'User FCMTOKEN removed Successfully',
                    response: removedToken
                }, HTTPStatus.OK);
            })
        } catch (error) {

        }
    }

    async resendOTP(req: any, res: any) {
        const { mobile } = req.body;
        if (!mobile) {
            return failure(res, {
                message: 'Provide missing mobile field',
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
                this.otpService.sendOtpToUser(message, "+234" + mobile.slice(1))
                return success(res, {
                    message: `OTP Sent Successfully, otp code is ${code}`,
                }, HTTPStatus.OK);
            }
            else {
                return failure(res, {
                    message: 'User could not be found',
                }, HTTPStatus.BAD_REQUEST);
            }
        } catch (error) {
            this.logger.info("Error from resending OTP ", error)
            return failure(res, {
                message: 'Sorry an error occured while resending OTP',
            }, HTTPStatus.BAD_REQUEST);
        }
    }

    async uploadImage(req: any, res: any) {
        const singleUpload = upload.single('image');
        const { mobile } = req.userData
        try {
            return singleUpload(req, res, async (err) => {
                if (err) {
                    this.logger.info("Error Uploading image ", err)
                    return failure(res, {
                        message: 'Sorry user image could not be uploaded',
                    }, HTTPStatus.BAD_REQUEST);
                }
                const imageUrl: String = req.file.location
                const data: UserPayload = await this.userService.uploadUserImage(mobile, imageUrl);
                return success(res, {
                    message: 'Image Uploaded Successfully',
                    response: { url: imageUrl }
                }, HTTPStatus.OK);
            })

        } catch (error) {
            this.logger.info("Error Uploading image ", error)
            return failure(res, {
                message: 'Sorry an error occured while uploading image',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }


    }

    async updateUserDetails(req: any, res: any) {
        const { id } = req.userData;
        const single = upload.single('file');
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
                        this.logger.error("Error Uploading image ", err)
                        return failure(res, {
                            message: 'Sorry user image could not be uploaded',
                        }, HTTPStatus.BAD_REQUEST);
                    }
                    const imageUrl = req.file.location
                    const param = {
                        fullName,
                        email,
                        mobile,
                        image: imageUrl
                    }
                    const data: UserPayload = await this.userService.updateUserDetails(id, param);
                    return success(res, {
                        message: 'User Details edited successfully',
                        response: data
                    }, HTTPStatus.OK);
                })
            }
            else {
                const param = {
                    fullName,
                    email,
                    mobile
                }

                const data: UserPayload = await this.userService.updateUserDetails(id, param);
                return success(res, {
                    message: 'User Details edited successfully',
                    response: data
                }, HTTPStatus.OK);
            }
        } catch (error) {
            this.logger.error("could not edit user details ", error)
            return failure(res, {
                message: 'Could Not update user at this time',
            }, HTTPStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
