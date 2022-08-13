const QConsumer = require(".");
const { parentPort } = require('worker_threads');
const KlustQ_Client = require("../klustQ-client");

/**
 * parse a string into a json
 * 
 * @param {string} s
 */
 function parseJSON(s) {
  try {
    return JSON.parse(s);
  } catch (ignored) { }

  return s;
}


class WorkerKlustQConsumer {

  /**
   * 
   * @param {KlustQ_Client} client 
   * @param {string} topic 
   * @param {string} group the default value is "group_0" 
   */
  constructor(client, topic, group="group_0"){
    this.client = client;
    this.topic = topic;
    this.group = group;
  }

  build() {
    this.consumer = new QConsumer(this.client,
      {
        topic: this.topic, 
        group: this.group
      }
    );

    this.consumer.on("message", (message) => {
      try {
        message.data.message = parseJSON(message.data.message);
      } catch (error) {
        
      }
      
      parentPort.postMessage(message);
    });
    
    parentPort.on('message', (message) => {
      switch (message.command) {
        case 'STOP':
          this.consumer.disconnect();
          break;
        case 'START':
          this.consumer.connect();
          break;
        default:
          break;
      }
    });
  }
}

module.exports = WorkerKlustQConsumer;