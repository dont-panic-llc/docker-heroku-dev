const fp = require('fastify-plugin')
const Producer = require('./producer.js')

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const fastifyKafka = async (fastify, opts, next) => {
  const producer = new Producer()
  for (let i = 0; i < 5; ++i) {
    try {
      await producer.init()
      fastify.log.info('Connected to Kafka')
      break
    } catch (err) {
      fastify.log.error(err)
    }
    await sleep(1000)
  }
  fastify.decorate('kafka', producer)
  next()
}

module.exports = fp(fastifyKafka)
