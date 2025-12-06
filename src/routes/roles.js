const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Role mapping reference:
// ADMIN: quản trị toàn bộ hệ thống (user & nội dung)
// ARTIST: quản lý bài hát/album của chính mình
// LISTENER: tìm kiếm/nghe nhạc, playlist cá nhân

router.get('/me', requireAuth, (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  return res.json({ user });
});

router.get('/admin/ping', requireAuth, requireRole(['ADMIN']), (req, res) =>
  res.json({ ok: true, message: 'Hello Admin' })
);

router.get('/artist/ping', requireAuth, requireRole(['ARTIST', 'ADMIN']), (req, res) =>
  res.json({ ok: true, message: 'Hello Artist' })
);

router.get('/listener/ping', requireAuth, requireRole(['LISTENER', 'ARTIST', 'ADMIN']), (req, res) =>
  res.json({ ok: true, message: 'Hello Listener' })
);

module.exports = router;
