const net = require("net");
const port = 7070;
const host = "127.0.0.1";
const server = net.createServer();
server.listen(port, host, () => {
  console.log("TCP Server is running on port " + port + ".");
});

const messages = [
  "Hello, client!",
  "How are you?",
  "I am fine, thank you.",
  "Bye!",
  "See you later!",
  "Goodbye!",
  "Have a nice day!",
]

server.on("connection", (socket) => {
  console.log("Client connected.");
  console.log(socket.address().address, socket.address().port);
  setInterval(() => {
  const random = Math.floor(Math.random() * messages.length);
  socket.write(messages[random]);
}, 3000);
});



