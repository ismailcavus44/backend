const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const ExpiredToken = require('../models/expiredtoken');
const Chat = require('../models/chat');

// ✅ Mesajları getir (token geçerliyse)
router.get('/messages/:roomId', async (req, res) => {
  const { roomId } = req.params;

  try {
    const expired = await ExpiredToken.findOne({ token: roomId });
    if (expired) {
      return res.status(403).json({ error: 'Token devre dışı bırakılmış.' });
    }

    const messages = await Message.find({ roomId });
    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// ✅ Token geçerli mi + geçici mi?
router.get('/validate/:token/:userId', async (req, res) => {
  const { token } = req.params;

  try {
    const expired = await ExpiredToken.findOne({ token });
    if (expired) return res.status(200).json({ valid: false });

    const chat = await Chat.findOne({ token });
    if (!chat) return res.status(200).json({ valid: false });

    return res.status(200).json({
      valid: true,
      isTemporary: chat.isTemporary || false,
    });
  } catch (err) {
    return res.status(500).json({ valid: false, error: 'Sunucu hatası.' });
  }
});

// ✅ Yeni sohbet oluştur (geçici olabilir)
router.post('/create', async (req, res) => {
  const { token, userId, isTemporary } = req.body;

  try {
    await Chat.create({
      token,
      createdBy: userId,
      isTemporary: isTemporary || false,
    });
    res.status(201).json({ message: 'Sohbet oluşturuldu.' });
  } catch (err) {
    res.status(400).json({ error: 'Sohbet oluşturulamadı.' });
  }
});

// ✅ Token devre dışı bırak
router.post('/expire', async (req, res) => {
  const { token } = req.body;

  try {
    await ExpiredToken.create({ token });
    await Chat.deleteOne({ token }); // erişimden tamamen kaldır
    res.json({ message: 'Token devre dışı bırakıldı.' });
  } catch (err) {
    res.status(400).json({ error: 'Zaten devre dışı veya işlem hatası.' });
  }
});

// ✅ Bu kullanıcıya ait sohbetleri getir
router.get('/list/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({ createdBy: userId });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Liste alınamadı.' });
  }
});

module.exports = router;
