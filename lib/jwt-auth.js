const fp = require('fastify-plugin')

module.exports = fp(async (fastify, opts) => {
  fastify.register(require('fastify-jwt'), {
    secret: process.env.JWT_SECRET,
    decode: { complete: true },
    sign: {
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER,
    },
    verify: {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
      clockTolerance: 1,
    },
  })

  fastify.decorate('authrequired', async (request, reply) => {
    await request.jwtVerify()
  })
})
