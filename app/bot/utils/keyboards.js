const { Markup } = require("telegraf")
const texts = require("../../constants/texts")

const searchButton = () => {
  return Markup.button.switchToCurrentChat(texts.search, "")
}

const backButton = () => {
  return Markup.button.callback(texts.back, texts.cb_data.back)
}
const registerButton = () => {
  return Markup.button.callback(texts.register, texts.cb_data.register)
}

const updateButton = (book_id) => {
  return Markup.button.callback(texts.update, `b_${book_id}`)
}

const searchMarkup = () =>
  Markup.inlineKeyboard([
    [searchButton()],
    [Markup.button.callback(texts.rent, "g_rent")],
    [Markup.button.callback(texts.chl, "chl")],
    [
      Markup.button.callback(
        texts.menu.text.my_profile,
        texts.menu.data.my_profile
      ),
      Markup.button.callback(texts.stats, "stats"),
    ],
  ])

const backMarkup = () => Markup.inlineKeyboard([[backButton()]])

const searchAndRentMarkup = (bookId) =>
  Markup.inlineKeyboard([
    [searchButton()],
    [backButton(), updateButton(bookId)],
  ])

const getBookMarkup = (bookId, locationId) => {
  let fline = [searchButton()]
  if (locationId) {
    fline.unshift(
      Markup.button.callback(texts.will_free, `wf_${bookId}_${locationId}`)
    )
  }
  return Markup.inlineKeyboard([
    fline,
    [Markup.button.callback(texts.rent, "g_rent")],
    [backButton(), updateButton(bookId)],
  ])
}

module.exports = {
  searchMarkup: searchMarkup,
  searchButton: searchButton,
  searchAndRentMarkup: searchAndRentMarkup,
  getBookMarkup: getBookMarkup,
  backMarkup: backMarkup,
  backButton: backButton,
  registerButton: registerButton,
}
