const EventEmitter = require("events");
const axios = require("axios").default;
const KlustQ_Client = require("../klustQ-client");
const { PRODUCER_PARTICIPANT_TYPE } = require("../participant");

/**
 * A klust queur producer. It helps to send data to klust queue server
 */
class QProducer extends EventEmitter {

  /**
   * 
   * @param {KlustQ_Client} client
   * @param {{topic: string}}  options
   */
  constructor(client, options) {
    super();
    this.client = client;
    this.options = options;

    this.client.setType(PRODUCER_PARTICIPANT_TYPE);
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
        id: sessionId, topic: this.options.topic
      });

      this.client.setHandlers();

      this.client.connect();
      this.client.on('error', (err) => {
        //We do not disconnect producer on error
        //this.disconnect();
      })
    } catch (error) {
      console.log(error);
      //throw error;
    }

  }


  /**
   * 
   * Send message to broker
   * 
   * @param {string  | null} key a key associated to the msg 
   * @param {any} msg an object. The mesage will be converted into 
   * a json string 
   * 
   * @throws Error
   */
  async send(key, msg) {
    if (msg == null) {
      throw new Error("Invalid message. Can not be null");
    }

    const url = `http://${this.client.options.host}:${this.client.options.port}/broker/topics/${this.options.topic}/messages`;
    const d = JSON.stringify(msg);

    try {
      await axios.post(url, {
        message: d,
        key: key
      }
      );
      console.debug("Sent message " + d);
    } catch (error) {
      //console.log(error);
      console.error("Error while sending message to server");
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

module.exports = QProducer;