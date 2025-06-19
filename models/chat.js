const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isTemporary: { type: Boolean, default: false }, // 🔐 Geçici mod eklendi
});

module.exports = mongoose.model('Chat', ChatSchema);
