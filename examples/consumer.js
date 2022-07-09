const { WebSocket } = require("ws");
global.WebSocket = WebSocket;

const KlustQClient = require("../libs/klustQ-client");
const QConsumer = require("../libs/consumer");
const QProducer = require("../libs/producer");

const client = new KlustQClient(
  {
    host: "localhost",
    port: 7000
  }
)

const consumer = new QConsumer(
  client,
  {
    topic: "default", group: "group_0"
  }
);

consumer.on("message", (message) => {
  console.log("Consumer Got:");
  console.log(message);

  console.log("\n\n");
});

setTimeout(() => {
  consumer.disconnect();
}, 10 * 60 * 1000); //10 minutes
consumer.connect();
