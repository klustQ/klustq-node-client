/**
 * Fired when the server decided to shutdown the consumer because
 * of ttl lake
 */
class ConsumerDisconnectedEvent {
  static name = 'consumer-disconnected-event';
}

module.exports = ConsumerDisconnectedEvent;