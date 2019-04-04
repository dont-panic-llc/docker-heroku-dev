const log = require('pino')({ 
  level: 'info',
  prettyPrint: true
})
const fastify = require('fastify')({
  logger: log
})

// fastify.register(require('fastify-redis'), process.env.REDIS_URL )

fastify.get('/', async (request, reply) => {
  return {
    hello: 'world'
  }
})

fastify.register(require('./lib/jwt-auth.js'))
fastify.register(require('./lib/kafka'))


const start = async () => {
  try {
    await fastify.listen(process.env.PORT, '0.0.0.0')
  } catch (err) {
    log.error(err)
    process.exit(1)
  }
}
start()