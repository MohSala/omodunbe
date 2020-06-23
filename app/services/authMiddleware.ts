import { config } from "../config/config"
import jwt from "jsonwebtoken";
import { failure } from '../lib/response_manager';
import { HTTPStatus } from '../constants/http_status';
import { serviceLocate } from '../config/di';

const userService = serviceLocate.get('userService');
const logger = serviceLocate.get('logger')


const authenticateUser = async (req: any, res: any, next: any) => {

    let token = req.headers['authorization']
    if (!token) {
        return failure(res, {
            message: 'Please Provide Token',
        }, HTTPStatus.UNAUTHORIZED);
    }
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length)
    }

    await jwt.verify(token, config.secretKey, async (err, decoded) => {
        if (err) {
            logger.info("Error Occured during token validation ", err)
            return failure(res, {
                message: 'User Token could not be verified',
            }, HTTPStatus.UNAUTHORIZED);
        }
        if (decoded) {
            const userData = decoded;
            req.userData = userData;
            next()
        }
        else {
            return failure(res, {
                message: 'User Token could not be verified',
            }, HTTPStatus.UNAUTHORIZED);
        }
    });
}

module.exports = authenticateUser


