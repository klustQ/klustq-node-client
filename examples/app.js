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


const producer = new QProducer(
  client,
  {
    topic: "default"
  }
);

producer.on("connection", () => {
  console.log("Producer connected");
});

producer.on("disconnect", () => {
  console.log("Producer is disonnect");
});

let i = 0;
producer.connect();
setInterval(() => {
  producer.send(null, {id: i, parent: "parent", current: "cur"});
  i += 1;
}, 3 * 1000);