const EventEmitter = require("events");
const axios = require("axios").default;
const KlustQ_Client = require("../klustQ-client");
const { PRODUCER_PARTICIPANT_TYPE } = require("../participant");

/**
 * A simple klust queur producer. It helps to send data to klust queue server.
 * It does not need to connect to the server before.
 * 
 * Important: before use this make sure shure that the KlustQ server is in
 *            a private network.
 */
class QSimpleProducer extends EventEmitter {

  /**
   * 
   * @param {KlustQ_Client} client
   * @param {{topic: string}}  options
   */
  constructor(client, options) {
    super();
    this.client = client;
    this.options = options;
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
    //Nothing to do
    this.emit("disconnect");
  }
}


module.exports = QSimpleProducer;