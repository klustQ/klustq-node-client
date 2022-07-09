const EventEmitter = require("events");
const StompJs = require("@stomp/stompjs");
const axios = require('axios').default;

/**
 * @class Client an interface to handle peer to peer connection
 * between a klust queue client and the server. Its jobs is handle
 * all communication with server and emit events if necessary, hold
 * the server state and provide interfaces for others class to send
 * data to the server through itself and consume data from the server.
 */
class Client extends EventEmitter {

  /**
   * Constructor
   * 
   * @param {string} wsUrl the websocket urL
   */
  constructor(wsUrl) {
    super();
    console.log(`Constructing base client with url ${wsUrl}`);

    this.wsUrl = wsUrl;

    //By default our client is not yet connected
    this.ready = false;

    /**
     * @var {StompJs.Client} stompClient
     */
    this.stompClient = null;

    /**
     * An array of stomp subscription
     */
    this.subscriptions = [];
  }

  /**
   * Establish the connection with  the websocket server
   * 
   * @param {{id: string, topic: string, group: string?}} params
   */
  init(params) {
    this.stompClient = new StompJs.Client({
      brokerURL: `ws://${this.wsUrl}/klust-queue`,
      connectHeaders: {
        ...params
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    console.log(`Setup stomp client with headers ${params}`);

    /*
     Since we will be in aserver environnment we won't need this
  
    if (typeof WebSocket !== 'function') {
      // For SockJS you need to set a factory that creates a new SockJS instance
      // to be used for each (re)connect
      this.stompClient.webSocketFactory = function () {
        // Note that the URL is different from the WebSocket URL
        return new SockJS(`http://${BROKER_URL}/sockJs`);
      };
    }*/

    this.stompClient.onStompError = (frame) => {
      // Will be invoked in case of error encountered at Broker
      // Bad login/passcode typically will cause an error
      // Complaint brokers will set `message` header with a brief message. Body may contain details.
      // Compliant brokers will terminate the connection after any error
      console.log('Broker reported error: ' + frame.headers['message']);
      console.log('Additional details: ' + frame.body);

      //Notify others
      this.emit('error', new Error("Unable to connect to the server..."));
    };

  }

  /**
   * Connect to the websocketserver
   */
  connect() {
    if (this.stompClient != null) {
      console.debug("Activating stomp client connection;;;");
      this.stompClient.activate();
      console.debug("Stomp client connection activated");
    }
  }

  /**
   * Stop the client connection and stop the reconnect attemps
   */
  destroy() {
    //First we unsubscribe from all channels
    this.subscriptions.forEach(
      c => {
        console.debug("Unsubscribing from channel...");
        console.log(c);
        c.unsubscribe();
        console.debug("Unsubscrubed");
      }
    )

    if (this.stompClient != null) {
      console.debug("Deactivating stomp client connection...");
      this.stompClient.deactivate();
      console.debug("Stomp client connection deactivated.");
    } 
  }
}

module.exports = Client;