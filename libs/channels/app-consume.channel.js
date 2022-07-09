/**
 * Subscribing to this vhannel tells the server that we ant to
 * catch partitionc record messages from broker
 */
class AppConsumerChannel {
  static path = '/app/consume';
}

module.exports = AppConsumerChannel;