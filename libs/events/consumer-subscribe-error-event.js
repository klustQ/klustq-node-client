class ConsumerSubscribeErrorEvent extends Error {

  constructor(){
    super("Error while consumer is subscribing")
  }

  static name = "consumer-subscribe-error-event";
}

module.exports = ConsumerSubscribeErrorEvent;