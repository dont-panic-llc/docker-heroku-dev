const { sign } = require('jsonwebtoken')
const { createHash } = require('crypto')
require('dotenv').config()
const jwtId = createHash('sha256').digest('hex')

const signConfig = () => ({
  audience: process.env.JWT_AUDIENCE,
  issuer: process.env.JWT_ISSUER,
  subject: '',
  expiresIn: process.env.JWT_EXPIRY * 60 * 60, // expiresIn is expected in hours
  notBefore: 0,
  jwtid: jwtId
})


const generateToken = async () => {
  const secret = process.env.JWT_SECRET || createHash('sha256').digest('hex');
  try {
    const token = await sign({}, secret, signConfig())
    console.log(token)
    console.log(process.env.JWT_AUDIENCE)
    console.log(process.env.JWT_ISSUER)
    console.log(process.env.JWT_EXPIRY * 60 * 60)
    console.log(jwtId)
    return { token }
  } catch(e) {
    console.error(e)
  }
  return
}


const start = async () => {
  await generateToken()
  process.exit(0)
}

start()