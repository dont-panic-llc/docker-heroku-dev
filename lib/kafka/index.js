const fp = require('fastify-plugin')
const Producer = require('./producer.js')

const fastifyKafka = async (fastify, opts, next) => {
  const producer = new Producer()
  await producer.init()
  fastify.decorate('kafka', producer)
  next()
}

module.exports = fp(fastifyKafka)