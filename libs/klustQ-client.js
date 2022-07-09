const EventEmitter = require("events");
const axios = require("axios").default;
const TopicBroadcastChannel = require("./channels/topic.broadcast.channel");
const Client = require("./client");
const ConsumerSubscribeErrorEvent = require("./events/consumer-subscribe-error-event");
const ConsumerSubscibedEvent = require("./events/consumer-subscribed-event");
const HealthEvent = require("./events/health-event");
const UserQueueMessageChannel = require('./channels/user-queue.messages.channel');
const UserTopicPrivateChannel = require("./channels/user-topic.private");
const AppConsumerChannel = require("./channels/app-consume.channel");
const { CONSUMER_PARTICIPANT_TYPE, PRODUCER_PARTICIPANT_TYPE } = require("./participant");

/**
 * @class KlustQ_Client wraps consumer and producer into one element
 */
class KlustQ_Client extends Client {

  /**
   * Constructor
   * 
   * @param {{host: string, port: number}} options 
   */
  constructor(options) {
    super(`${options.host}:${options.port}`);

    this.options = options;
    this.consumerId = null;
    this.sessionId = null;

    //Listener to the client events
    this.on('connection', (...args) => {
      this.ready = true;
    });
  }

  /**
   * Set the participant type. Set if the current client
   * will be a consumer or a producer
   * 
   * @param {string} value
   * 
   * @throws Error if the value provided is invalid 
   */
  setType(value) {
    if ([CONSUMER_PARTICIPANT_TYPE, PRODUCER_PARTICIPANT_TYPE].includes(value) == true) {
      this.participantType = value;
      console.debug("QKlust Client set participant type to " + this.participantType);
    } else {
      throw new Error("Invalid KlustQ participant type. Allowed value are CONSUMER, PRODUCER");
    }
  }

  /**
   * Update some client attributes and ajust it for the 
   * cuurent class use
   * 
   * @throws Error when the participant type is not set
   */
  setHandlers() {
    if (this.participantType == null) {
      throw new Error("Participant type  CONSUMER or PRIDUCER is not set");
    }
    //Update the the connection handler
    console.debug("Updating client onConnect function");
    this.stompClient.onConnect = (frame) => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect

      console.log(frame);
      this.emit('connection');

      console.debug(`Subscribing to ${TopicBroadcastChannel.path} channel`);
      this.subscriptions.push(
        this.stompClient.subscribe(TopicBroadcastChannel.path, (message) => {
          //console.log(message);
          console.log(message.body);

          let d = JSON.parse(message.body);
          if (d.event == HealthEvent.name) {
            if (d.health == "OK") {
              console.log("Server is alive...");
            }
          }
        })
      );



      if (this.participantType == CONSUMER_PARTICIPANT_TYPE) {
        //Since we are a consumer by default
        console.debug(`Subscribing to ${UserQueueMessageChannel.path} channel`);
        this.subscriptions.push(
          this.stompClient.subscribe(UserQueueMessageChannel.path, (message) => {
            //console.log(message);
            console.log(message.body);
            let d = JSON.parse(message.body)
            //Tells that we have a record from the broker
            this.emit("message", d);
          })
        );

        //Topic data are already stored for us in case we are a consumer
        //We have just to tell the server that we want to start consuming
        console.debug(`Subscribing to ${AppConsumerChannel.path} channel`);
        this.subscriptions.push(
          this.stompClient.subscribe(AppConsumerChannel.path, {}, (message) => {
            //console.log(message);
            //console.log(message.body);
            let d = JSON.parse(message.body);

            //Here we save client id assigned by the broker
            //It will serve to deconnec the consumer client from the borker
            this.consumerId = d.id;
          })
        );
      }


      //Private message
      console.debug(`Subscribing to ${UserTopicPrivateChannel.path} channel`);
      this.subscriptions.push(
        this.stompClient.subscribe(UserTopicPrivateChannel.path, (message) => {
          //console.log(message);
          console.log(message.body);

          const msg = JSON.parse(message.body);
          if (msg.event == ConsumerSubscribeErrorEvent.name) {
            this.emit("error", new Error(msg.error));
          } else if (msg.event == ConsumerSubscibedEvent.name) {
            this.canConsume = true;
            this.consumerId = msg.client_id;
          }
        })
      );

    };
  }


  /**
   * Fecth session id
   * 
   * @param {string} topic 
   * @return {Promise<string>}
   */
  fetchSessionId(topic) {
    //TODO use async await here please
    console.debug("Fetching session id...");
    return new Promise((resolve, reject) => {
      axios.post(`http://${this.options.host}:${this.options.port}/broker`, {
        type: this.participantType,
        topic: topic
      })
        .then((response) => {
          this.sessionId = response.data.id;
          console.debug("Got session id " + this.sessionId);
          resolve(this.sessionId);
        })
        .catch((error) => {
          reject(error);
          this.emit("error", new Error(error.message));
        });
    });
  }

  /**
   * Disconnect the current client from the broker
   * 
   * @param {string} topic
   */
  async disconnect(topic) {
    if (this.participantType == CONSUMER_PARTICIPANT_TYPE) {
      //Send request to api to disconnect the consumer from broker
      try {
        console.debug("Deconnection KlustQ client as consumer from broker topic " + topic);
        await axios.delete(`http://${this.options.host}:${this.options.port}/broker/consumers`, {
          headers: {
            "content-type": "application/json",
            "Content-Type": "application/json"
          },    
          data: {
            topic: topic,
            consumer_id: this.consumerId,
            ws_id: this.sessionId
          }

        });
        console.debug("Deconnection KlustQ client as consumer from broker")
      } catch (error) {
        //console.log(error);
        console.error("Error while disconnection from server");
      }
    }

    super.destroy();
  }
}

module.exports = KlustQ_Client;