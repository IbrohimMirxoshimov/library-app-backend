const { Router } = require("express")
const { SmsController } = require("../../controllers/sms.controller")
const route = Router()

module.exports = (app) => {
  route.post("/auth", SmsController.smsAuth())
  route.post("/sendSms", SmsController.sendSms())
  route.post("/verify", SmsController.verifyCode())
}
