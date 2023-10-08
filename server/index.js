var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var serverPort = 3000;
var crypto = require('crypto');
var serverName = crypto.randomBytes(3).toString('hex');


io.adapter(redis({ host: 'redis', port: 6379 }));

server.listen(serverPort, function () {
  console.log('Servidor levantado y corriendo en el puerto %s', serverPort);
  console.log('Worker %s', process.pid);
  console.log(`node heap limit = ${require('v8').getHeapStatistics().heap_size_limit / (1024 * 1024)} Mb`)
  console.log("you can use node --max-old-space-size=6144 index.js to add more memory")
  console.log('Hello, I\'m %s, how can I help?', serverName);
});

app.use(express.static(__dirname + '/public'));
// const { instrument } = require("@socket.io/admin-ui");
// var fs = require('fs');
// import fs from 'fs';
// var https = require('https');
// import https from 'https';

// import express from 'express';
var bodyParser = require('body-parser');

var options = {
  // key: fs.readFileSync(constants.PRIVATEKEY),
  // cert: fs.readFileSync(constants.CERTIFICATECRT)
}; // Clave y certificado para establecer una conexion HTTPS valida
 // Puerto de conexion del servidor socket.io

// var server = https.createServer(options, app); // Creacion de servidor HTTPS  
// var io = require('socket.io')(server, {
//   pingInterval: 600000,
//   pingTimeout: 600000,
//   // perMessageDeflate: false,
//   cors: {
//     origin: '*',
//     methods: ["GET", "POST"],
//     // credentials: true
//   }
// }); // Levantar socket.io sobre el servidor HTTPS, habilitando solamente los origenes CORS sobre los que corre el iframe y el portal web Magnolia que contiene al carrito
let users = [];
// instrument(io, {
//   auth: false,
//   mode: "development",
// });
// io.adapter(createAdapter());

// setupWorker(io);

io.on('connection', (socket) => {

  // Recuperar los datos de conexión enviados por el socket (cliente Node.js)  
  let userid = socket.handshake.query.userid;
  let feversion = socket.handshake.query.feversion;
  let dkversion = socket.handshake.query.dkversion;
  // let address = socket.handshake.address.address;
  let address = socket.request.connection.remoteAddress;

  // Crear y conectar a una room utilizando el userid
  users.push({ id: socket.id, userid, address, feversion, dkversion });

  socket.join('general');
  if (typeof feversion === 'undefined' || typeof dkversion === 'undefined') {
    socket.join('undefined');
  } else if (typeof feversion !== 'undefined' || typeof dkversion !== 'undefined') {
    socket.join(feversion + "" + dkversion);
  }
  // Notifico a los servers, las salas y los usuarios
  const rooms = io.sockets.adapter.rooms;
  const keys = rooms.keys();
  let result = [];
  for (let name of keys) {
    const list = Array.from(rooms.get(name));
    let userlist = [];
    list.forEach(element => {
      userlist.push(users.find((e, i) => {
        return e['id'] == element
      }));
    });
    userlist = userlist.filter(n => n);
    result.push({
      name,
      active: userlist.length,
      size: rooms.get(name).size,
      users: Object.values(userlist),
    });
  }

  io.to('server').emit('rooms', { size: result.length, data: result });
  io.to('server').emit('users', users);
  // Evento al desconectar del socket
  socket.on('disconnect', () => {
    socket.leave('general');
    socket.leave(socket.id);
    // io.to('status').emit('status', 'Disconnected: ' + userid + ' from ' + address);

    for (var i = 0; i < users.length; i++) {
      if (users[i]['userid'] === userid) {
        users.splice(i, 1);
      }
    }
    // Notifico a los servers, las salas y los usuarios
    const rooms = io.sockets.adapter.rooms;
    const keys = rooms.keys();
    let result = [];
    for (let name of keys) {
      const list = Array.from(rooms.get(name));
      let userlist = [];
      list.forEach(element => {
        userlist.push(users.find((e, i) => {
          return e['id'] == element
        }));
      });
      userlist = userlist.filter(n => n);
      result.push({
        name,
        active: userlist.length,
        size: rooms.get(name).size,
        users: Object.values(userlist),
      });
    }
    io.to('server').emit('rooms', { size: result.length, data: result });
    io.to('server').emit('users', users);

  });
  socket.on('subscribe', room => {
    socket.join(room);
    if (room == 'server') {
      // Notifico a los servers, las salas y los usuarios
      const rooms = io.sockets.adapter.rooms;
      const keys = rooms.keys();
      let result = [];
      for (let name of keys) {
        const list = Array.from(rooms.get(name));
        let userlist = [];
        list.forEach(element => {
          userlist.push(users.find((e, i) => {
            return e['id'] == element
          }));
        });
        userlist = userlist.filter(n => n);
        result.push({
          name,
          active: userlist.length,
          size: rooms.get(name).size,
          users: Object.values(userlist),
        });
      }
      io.to('server').emit('rooms', { size: result.length, data: result });
      io.to('server').emit('users', users);
    }

  });
  socket.on('room', room => {
    socket.join(room);
  });
  socket.on('unsubscribe', room => {
    socket.leave(room);
  });
  socket.on('unsubscribeAll', room => {
    socket.leave(room);
  });
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
  socket.onAny((event, args) => {
    // console.log(`got ${event}`);
    io.to('server').emit('unknow', event);
  });
  // console.log(users.length);
});



// app.use(express.json()) // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());



// app.post('/event-update/:id', function (req, res) {
//   var retrievedData = req.body;
//   // Send data to GET method
//   io.to(retrievedData.event_id).emit('updates', retrievedData.event_id);
//   io.to('server').emit('updates', `${retrievedData.action} ${retrievedData.event_id}`);
//   res.send(req.params)

// });

// app.get('/public.js', (req, res) => {
//   res.sendFile(__dirname + '/public.js');
// });
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });
