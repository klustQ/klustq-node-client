const EventEmitter = require("events");
const KlustQ_Client = require("../klustQ-client");
const { CONSUMER_PARTICIPANT_TYPE } = require("../participant");

/**
 * A klust queue consumer. It used to read partition reacord from broker
 */
class QConsumer extends EventEmitter {

  /**
   * 
   * @param {KlustQ_Client} client
   * @param {{topic: string, group: string}}  options
   */
  constructor(client, options) {
    super();
    this.client = client;
    this.options = options;

    this.client.setType(CONSUMER_PARTICIPANT_TYPE);
  }

  /**
   * Connect to the server. It will first get the id from the
   * server
   */
  async connect() {
    try {
      const sessionId = await this.client.fetchSessionId(this.options.topic);
      console.log("Consumer Got Session id: " + sessionId);

      //Start the connection
      this.client.init({
        id: sessionId, topic: this.options.topic,
        group: this.options.group
      });



      this.client.on("message", (message) => {
        this.emit("message", message);
      });
      this.client.on('error', (err) => {
        this.disconnect();
      });

      this.client.setHandlers();
      this.client.connect();
      
    } catch (error) {
      console.log(error);
      //throw error;
    }

  }

  /**
   * Disconnect the client consumer
   */
  disconnect() {
    this.client.disconnect(this.options.topic);
    this.emit("disconnect");
  }
}

module.exports = QConsumer;