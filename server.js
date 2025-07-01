// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// app.use(express.static(path.join(__dirname, 'public')));

// io.on('connection', (socket) => {
//   console.log('New client connected:', socket.id);

//   socket.on('join', (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit('user-joined', socket.id);
//   });

//   socket.on('offer', (data) => {
//     socket.to(data.room).emit('offer', data);
//   });

//   socket.on('answer', (data) => {
//     socket.to(data.room).emit('answer', data);
//   });

//   socket.on('ice-candidate', (data) => {
//     socket.to(data.room).emit('ice-candidate', data.candidate);
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// server.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    const otherUsers = rooms[roomId].filter(id => id !== socket.id);
    socket.emit('all-users', otherUsers);

    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('sending-signal', payload => {
      io.to(payload.userToSignal).emit('user-signal', {
        signal: payload.signal,
        callerId: payload.callerId,
      });
    });

    socket.on('returning-signal', payload => {
      io.to(payload.callerId).emit('receiving-returned-signal', {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on('disconnect', () => {
      rooms[roomId] = rooms[roomId]?.filter(id => id !== socket.id);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
