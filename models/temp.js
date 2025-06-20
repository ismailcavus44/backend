const mongoose = require('mongoose');

const ExpiredTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  expiredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExpiredToken', ExpiredTokenSchema);
