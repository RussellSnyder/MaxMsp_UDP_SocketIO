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

const DEBUG = true;
let DEBUG_CONNECTED = false;

let valueBuffer = {};

const properties = [
  "attack",
  "amplitude",
  "pan",
  "pitch"
]

const getValueOfPropertyInArray = (args, property) => {
  if (!args || !property) { return false; }

  const index = args.indexOf(property);

  if (index === -1) {
    return false
  }

  return args[index + 1]
}

udpPort.on("ready", function() {
  console.log(`Listening for OSC over UDP on port ${UDP_PORT}.`);
  console.log(`Awaiting socket connection on port ${SOCKET_PORT}.`);

  if (DEBUG) {
    udpPort.on("message", ({ address, args }) => {
      console.log(address, args)
    })
  }

  io.on("connection", socket => {
    if (DEBUG && DEBUG_CONNECTED) { return; }
    if (DEBUG) {
      console.log("Socket connected!");
      DEBUG_CONNECTED = true;
    }

    udpPort.on("message", ({ address, args }) => {
      if (address === '/instrument') {
        valueBuffer.type = 'instrument';
        valueBuffer.id = args[0];
        
        properties.forEach(property => {
          const value = getValueOfPropertyInArray(args, property) 
          if (value !== false) {
            valueBuffer[property] = value
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