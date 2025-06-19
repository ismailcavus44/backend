const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, password: hash });
    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (err) {
    res.status(400).json({ error: 'Kayıt başarısız' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Kullanıcı bulunamadı' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Hatalı şifre' });

  res.json({ message: 'Giriş başarılı', userId: user._id });
});

module.exports = router;
