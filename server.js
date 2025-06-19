const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const axios = require('axios');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Kullanıcı socket eşleşmeleri
let users = {};
let activeRooms = {}; // roomId -> { isTemporary }

io.on('connection', socket => {
  console.log('🔌 Yeni bağlantı:', socket.id);

  socket.on('join-room', async ({ roomId, userId }) => {
    socket.join(roomId);
    users[socket.id] = { roomId, userId };

    // Oda geçici mi kontrol et (ilk kez geliyorsa)
    if (!(roomId in activeRooms)) {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/validate/${roomId}/${userId}`);
        activeRooms[roomId] = { isTemporary: res.data.isTemporary || false };
        console.log(`ℹ️ Oda "${roomId}" geçici mi? =>`, activeRooms[roomId].isTemporary);
      } catch (err) {
        console.error('Oda doğrulama hatası:', err.message);
        activeRooms[roomId] = { isTemporary: false }; // varsayılan
      }
    }
  });

  socket.on('send-message', async ({ roomId, encryptedMessage, sender, type, audioBlob }) => {
    const isTemporary = activeRooms[roomId]?.isTemporary;

    if (type === 'audio' && audioBlob) {
      io.to(roomId).emit('receive-message', {
        sender,
        type: 'audio',
        audioBlob
      });
    } else {
      io.to(roomId).emit('receive-message', {
        sender,
        encryptedMessage,
        type: 'text'
      });

      if (!isTemporary) {
        // Geçici değilse buraya ileride Message.create(...) eklenebilir
        // await Message.create({ roomId, sender, encryptedMessage, type: 'text' });
      }
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`));
