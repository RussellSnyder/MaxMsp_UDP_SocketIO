const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const osc = require("osc");

const UDP_PORT = 9000;
const SOCKET_PORT = 8000;

const udpPort = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: UDP_PORT
});
server.listen(SOCKET_PORT);

let valueBuffer = {};

udpPort.on("ready", function() {
  console.log(`Listening for OSC over UDP on port ${UDP_PORT}.`);
  console.log(`Awaiting socket connection on port ${SOCKET_PORT}.`);

  io.on("connection", socket => {
    console.log("Socket connected!");

    udpPort.on("message", ({ address, args }) => {
      if (address === '/instrument') {
        args.forEach((argOrValue, i) => {      
          if (i % 2 === 0) {
            valueBuffer[argOrValue] = null
          } else {
            valueBuffer[args[i - 1]] = argOrValue
          }
        })  

        console.log(valueBuffer)
        io.emit("message", valueBuffer);
        valueBuffer = {};
      }


    });    
  });
});

udpPort.on("error", function(err) {
  console.log(err);
});

udpPort.open();