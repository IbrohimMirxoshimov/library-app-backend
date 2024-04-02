const { getSmsAuthToken, sendSms } = require("../services/sms.service")
const HttpError = require("../utils/HttpError")
const obj = {
  code: null,
  expiresAt: null,
  phoneOfUser: null,
}

const SmsController = {
  smsAuth: async (req, res, next) => {
    return await getSmsAuthToken()
  },

  sendSms: async (req, res, next) => {
    const token = getSmsAuthToken()
    const { phone } = req.body
    const code = await sendSms(phone, token)
    obj.code = code
    const date = new Date()
    obj.expiresAt = date.setMinutes(date.getMinutes() + 1)
    obj.phoneOfUser = phone
    return
  },
  verifyCode: async (req, res, next) => {
    const { code, phone } = req.body
    if (obj.expiresAt < new Date()) {
      if (code == obj.code && obj.phoneOfUser == phone) {
        verifyNumber(phone)
          .then(() => {
            return res.json({ message: "Verified successfully" }).status(200)
          })
          .catch((error) => {
            throw HttpError(400, "Not verified try again")
          })
      } else throw HttpError(400, "Verification code incorrect")
    }
    throw HttpError(400, "Verification code is expired")
  },
}

module.exports = {
  SmsController,
}
