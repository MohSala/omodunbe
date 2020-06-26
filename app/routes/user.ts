import express = require('express');
import bodyParser = require('body-parser');
import { serviceLocate } from '../config/di';
const authenticateUser = require("../services/authMiddleware")

const upload = require("../services/uploadService")
const userController = serviceLocate.get('userController');
export const userRouter = express.Router();

userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: false }));



// USER ROUTES
userRouter.post('/checkUser', (req, res) => {
    return userController.checkIfUserExists(req, res);
})

userRouter.get('/wallet', (req, res) => {
    return userController.getWalletBalance(req, res);
})

userRouter.get('/transactions', (req, res) => {
    return userController.getUserTransactions(req, res);
})

userRouter.post('/creditTransaction', (req, res) => {
    return userController.createCreditTransaction(req, res);
})

userRouter.post('/addEmailAddress', (req, res) => {
    return userController.updateEmailAddress(req, res);
})

userRouter.post('/validatePassword', (req, res) => {
    return userController.checkOtpVerifiedAndUpdatePwd(req, res);
})

userRouter.post('/createMerchant', (req, res) => {
    console.log(req.body);
    return userController.merchantSignUp(req, res);
})

userRouter.post('/changePassword', authenticateUser, (req, res) => {
    return userController.changePasswordWithoutOTP(req, res);
})


userRouter.post('/verifyUser', (req, res) => {
    return userController.verifyUser(req, res);
})

userRouter.post('/login', (req, res) => {
    return userController.login(req, res);
})

userRouter.post('/sendOtpForPassword', (req, res) => {
    return userController.sendOtpForForgotPassword(req, res);
})

userRouter.post('/updatePassword', (req, res) => {
    return userController.updatePassword(req, res);
})

userRouter.post('/logout', (req, res) => {
    return userController.logout(req, res);
})

userRouter.post('/resendOTP', (req, res) => {
    return userController.resendOTP(req, res);
})

userRouter.post('/uploadImage', authenticateUser, (req, res) => {
    return userController.uploadImage(req, res);
})

userRouter.get('/myUserInformation', authenticateUser, (req, res) => {
    return userController.getUserInformation(req, res);
})


userRouter.post('/updateUser',
    upload.single('file'),
    authenticateUser, (req, res) => {
        return userController.updateUserDetails(req, res);
    })
// USER ROUTES