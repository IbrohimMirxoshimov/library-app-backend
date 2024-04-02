const { default: axios } = require("axios")
const { Sequelize, Op } = require("sequelize")
const { User } = require("../database/models")
const {
  SMS_AUTH_LOGIN,
  SMS_AUTH_PASSWORD,
  SMS_AUTH_URL,
  SEND_SMS_URL,
} = require("../config")
const texts = require("../constants/texts")
const { generateCode } = require("../helpers/smsCodeGenerartor")
const HttpError = require("../utils/HttpError")

async function getSmsAuthToken() {
  const res = await axios.post(
    SMS_AUTH_URL,
    {
      email: SMS_AUTH_LOGIN,
      password: SMS_AUTH_PASSWORD,
    },
    { timeout: 10000 }
  )

  return res.data["data"]["token"]
}
async function sendSms(phone, token) {
  const code = generateCode()
  const message = `${texts.phone_number_verification_message} ${code}`
  await axios.post(
    SEND_SMS_URL,
    {
      mobile_phone: phone,
      message,
      from: 4546,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return
}

async function verifyNumber(phone) {
  const user = User.findOne({ where: { phone: phone } })
  if (user)
    return User.update({ verifiedPhone: true }, { where: { phone: phone } })
  throw HttpError(400, "User not exists")
}

module.exports = {
  sendSms,
  getSmsAuthToken,
  verifyNumber,
}
