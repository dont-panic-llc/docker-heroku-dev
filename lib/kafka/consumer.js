const Kafka = require('no-kafka')
const { KAFKA_URL, KAFKA_CLIENT_CERT = '', KAFKA_CLIENT_CERT_KEY = '', KAFKA_PREFIX = '' } = process.env

// TODO start here https://github.com/oleksiyk/kafka#groupconsumer-new-unified-consumer-api

/**
 * Creates a new Kafka Consumer with wrapper methods
 * @class
 * @classdesc Inherits all methods from Kafka.Consumer
 * @see https://github.com/heroku/no-kafka for documentation on kafka producers
 * The init<Promise> method must be called before using the push/send methods
 * @author David Tompkins
 * @param {async function(Object)} messageHandler - Handles the incoming message object
 * @note messageHandlers should be async functions, and should be tolerant to a shutdown mid operation
 * @param {string[]} topics - The topic(s) this consumer is subscribed to
 * @param {Object} config - Configuration object
 * @param {string} config.groupId - The group identifier. If there are multiple consumers in a group they should all have the same id
 * @param {string} [config.clientId] - Client id that is consuming the data
 * @param {string} [idleTimeout] -  Timeout between fetch calls, defaults to 1000ms
 * @param {function(string)} [logger] - data logger
 * @param {Object} [metadata] @see https://github.com/oleksiyk/kafka#assignment-strategies
 * @return {GroupConsumer Instance}
 * @example
 *  const consumer = new Consumer(messageHandler, ['topic_a', 'topic_b'], {groupId: 'ConsumeTopicAB'} ) // Creates a new consumer
 *  await consumer.consume() // Starts consuming topics
 * @note disconnects should be handled by the no-kafka library seemlessly.
 */
class Consumer extends Kafka.GroupConsumer {
  constructor (messageHandler, topics, { groupId, clientId = 'HerokuKafkaGroupConsumer', idleTimeout = 1000 }, logger = console.log, metadata = {}) {
    if (!groupId) throw new Error('Groupd ID is required.')
    if (!topics) throw new Error('Topic subscription list is required.')

    groupId = `${KAFKA_PREFIX || ''}${groupId}`

    super({
      connectionString: KAFKA_URL,
      ssl: {
        cert: KAFKA_CLIENT_CERT.replace(/\\n/gi, '\n'), // Newline replacement is a fix for docker-compose not supporting multiline env vars.
        key: KAFKA_CLIENT_CERT_KEY.replace(/\\n/gi, '\n'),
      },
      startingOffset: Kafka.EARLIEST_OFFSET,
      groupId,
      clientId,
      idleTimeout,
      // You can add a logger for no-kafka here as well, see https://github.com/oleksiyk/kafka#logging
    })

    this.messageHandler = messageHandler

    const subscriptions = []
    subscriptions.push(...topics.map(topic => `${KAFKA_PREFIX || ''}${topic}`)) // Add prefix if it exists

    this.consumerConfig = {
      subscriptions,
      strategy: new Kafka.WeightedRoundRobinAssignmentStrategy(),
      metadata: {
        weight: 4,
        ...metadata, // Props defined later override earlier defined props, meta data would override the above defaults
      },
    }

    this.consume = this.consume.bind(this)
    this.init = this.init.bind(this)
    this.handler = this.handler.bind(this)
    this.commitOffset = this.commitOffset.bind(this)

    // Set the data handler after bind
    this.consumerConfig.handler = this.handler
  }

  /**
   * @async
   * @function consume
   * @return {Promise}
   * @description - Tells the consumer to start consuming messages from Kafka
   */
  async consume () {
    const { init, consumerConfig } = this
    return init([consumerConfig])
  }

  /**
   * @async
   * @function handler
   * @note Intended to be used internally only, this is a wrapper for the message handler that handles commit automatically
   * @note Throwing in the message handler will prevent the message from being committed so it can be retried.
   * @param {Object[]} messages
   * @param {number} messages.offset - message offset, needed to commit the message
   * @param {Object} messages.message - message Object
   * @param {Buffer} message.value - Buffer message value, this is what will be passed to the message handler after being converted to a string/Object
   * @param {number} partition - What partition is being processed, Needed when we commit completion
   * @return
   */
  async handler (messages, topic, partition) {
    const { messageHandler, commitOffset, parseMsg } = this
    return Promise.all(messages.map(async ({ offset, message }) => {
      try {
        const msg = parseMsg(message)
        // logger(msg) // Logger is not working at the moment
        await messageHandler(msg) // pass the message into the provided handler
        // console.log(topic, partition, offset, message)
        return await commitOffset({ topic, partition, offset }) // Commit message
      } catch (e) {
        console.trace(e)
        // logger(e)
        throw new Error(e)
      }
    }))
  }

  /**
   * @function parseMsg
   * @param {Buffer} msg - Message buffer
   * @param  {} {msg=msg.value.toString(
   * @return {Object || string} - Depends on if JSON.parse succeeds or not
   * @description - Internal - Returns an object or string from a buffer
   */
  parseMsg (msg) {
    msg = msg.value.toString() // convert message to a string
    try {
      return JSON.parse(msg) // Might be stringified
    } catch (e) { console.log(e) }
    return msg
  }
}

module.exports = Consumer
