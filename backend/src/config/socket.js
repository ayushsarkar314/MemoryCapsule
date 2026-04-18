const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(userId);
      console.log(`[Socket] User ${userId} connected and joined room.`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected (id: ${userId || 'unknown'})`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    console.warn('Socket.io not initialized or called before init');
  }
  return io;
};

module.exports = { initSocket, getIo };
