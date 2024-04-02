class SimpleCoder {
  constructor(key) {
    this.key = key
  }

  decode(encodedNumber) {
    return (encodedNumber + this.key) / 2
  }

  encode(number) {
    return 2 * number - this.key
  }
}

class SimpleCoderPro {
  decode(key, encodedNumber) {
    let num = (encodedNumber - key)
    return (num - (num % 10)) / 10
  }

  encode(key, number) {
    return (number % 10) + key + number * 10
  }
}

const sellCoder = new SimpleCoder(3)
function orderButtonDataEncoder(sell) {
  return sellCoder.encode(sell.id)
}

function orderButtonDataDecoder(stateId, encodedSellId) {
  stateId = parseInt(stateId)
  encodedSellId = parseInt(encodedSellId)
  sellId = sellCoder.decode(encodedSellId)

  return {
    stateId,
    sellId
  }
}

module.exports = {
  SimpleCoder,
  SimpleCoderPro,
  orderButtonDataEncoder,
  orderButtonDataDecoder
}