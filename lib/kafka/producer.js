const Kafka = require('no-kafka')
const { KAFKA_URL, KAFKA_CLIENT_CERT = '', KAFKA_CLIENT_CERT_KEY = '', KAFKA_PREFIX = '' } = process.env

/**
 * Creates a new Kafka Producer with wrapper methods
 * @class
 * @classdesc Inherits all methods from Kafka.Producer
 * @see https://github.com/heroku/no-kafka for documentation on kafka producers
 * The init<Promise> method must be called before using the push/send methods
 * @author David Tompkins
 * @returns {Producer Instance}
 * @example
 *  const producer = new Producer()
 *  producer.init()
 *  producer.push({...})
 */
class Producer extends Kafka.Producer {
  constructor () {
    super({
      connectionString: KAFKA_URL,
      ssl: {
        cert: KAFKA_CLIENT_CERT.replace(/\\n/gi, '\n'),
        key: KAFKA_CLIENT_CERT_KEY.replace(/\\n/gi, '\n'),
      },
    })
    this.send = this.send.bind(this)
    this.init = this.init.bind(this)
  }

  /**
   * @method push
   * @param {Object} params the parameter is a deconstructed Object
   * @param {Object || String} param.value the Message itself, will be stringified if it is an object
   * @param {String} param.key the messsage key
   * @param {topic} param.topic the topic that is used to send the message (important because it is used to determine what action needs to be taken on the message)
   * @returns {Promise}
   */
  async push ({ value, key, topic }) {
    const { send } = this

    topic = `${KAFKA_PREFIX || ''}${topic}`
    value = typeof value === 'object' ? JSON.stringify(value) : value

    const message = { key, value }

    return send({
      topic,
      message,
    }, {
      batch: {
        size: 1024,
        maxWait: 100,
      },
    })
  }
}

module.exports = Producer
