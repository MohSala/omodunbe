import { config } from "../config/config"
import axios from "axios"
let apiKey = config.sms.apiKey;

export class OtpService {
    logger: any;
    /**
     *
     * @param {*} logger Logger Object
     */
    constructor(logger: any) {
        this.logger = logger;
    }

    async sendOtpToUser(msg: any, recepient: any) {
        const headers = {
            "Content-Type": "application/json",
            Authorization: apiKey,
        };
        try {
            const callSling = await axios.post("https://v2.sling.com.ng/api/v1/send-sms",
                {
                    message: msg,
                    to: recepient,
                    channel: '0000'
                },
                { headers }
            )
            return this.logger.info(`message sent, ${callSling.data.status} | ${callSling.data.message}| ${callSling.data.recipient}`)
        } catch (error) {
            return this.logger.info(`message not sent ${error}`)
        }

    }
};