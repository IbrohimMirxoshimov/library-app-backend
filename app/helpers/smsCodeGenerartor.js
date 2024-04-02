async function generateCode() {
  return Number.parseInt(
    (Math.random() * 1000 * Date.now()).toString().slice(0, 6),
    10
  )
}

module.exports = {
  generateCode,
}
