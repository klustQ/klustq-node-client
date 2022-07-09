const { WebSocket } = require("ws");
global.WebSocket = WebSocket;

const KlustQClient = require("../libs/klustQ-client");
const QConsumer = require("../libs/consumer");
const QProducer = require("../libs/producer");
const QSimpleProducer = require("../libs/producer/simple-producer");

const client = new KlustQClient(
  {
    host: "localhost",
    port: 7000
  }
);

const producer = new QSimpleProducer(
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
setInterval(() => {
  producer.send(null, {id: i, parent: "parent", current: "cur"});
  i += 1;
}, 100);
