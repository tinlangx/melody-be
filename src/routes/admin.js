const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const allowedRoles = ['ADMIN', 'ARTIST', 'LISTENER'];

const buildUserResponse = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  return user;
};

// Chỉ gọi một lần để khởi tạo Admin đầu tiên (khi chưa có Admin trong DB).
router.post('/admin/seed-first-admin', async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'ADMIN' });
    if (exists) {
      return res.status(403).json({ message: 'Đã có tài khoản Admin. Không thể seed thêm.' });
    }

    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'ADMIN',
    });

    return res.status(201).json({ user: buildUserResponse(user) });
  } catch (err) {
    console.error('Seed admin error:', err);
    return res.status(500).json({ message: 'Không thể tạo Admin đầu tiên.' });
  }
});

// Admin đổi role người dùng (LISTENER <-> ARTIST <-> ADMIN).
router.patch('/admin/users/:id/role', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    return res.json({ user: buildUserResponse(user) });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật role.' });
  }
});

router.post(
  '/admin/users/:id/promote-to-artist',
  requireAuth,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

      if (user.role === 'ADMIN') {
        return res.status(400).json({ message: 'Không thể hạ quyền Admin.' });
      }

      if (user.role === 'ARTIST') {
        return res.status(200).json({ message: 'Người dùng đã là nghệ sĩ.', user: buildUserResponse(user) });
      }

      user.role = 'ARTIST';
      await user.save();
      return res.json({ message: 'Đã nâng Listener thành Artist.', user: buildUserResponse(user) });
    } catch (err) {
      console.error('Promote to artist error:', err);
      return res.status(500).json({ message: 'Không thể nâng quyền.' });
    }
  }
);

router.post(
  '/admin/users/:id/demote-to-listener',
  requireAuth,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

      if (user.role === 'ADMIN') {
        return res.status(400).json({ message: 'Không thể hạ quyền Admin.' });
      }

      if (user.role === 'LISTENER') {
        return res.status(200).json({ message: 'Người dùng đã là Listener.', user: buildUserResponse(user) });
      }

      user.role = 'LISTENER';
      await user.save();
      return res.json({ message: 'Đã chuyển Artist thành Listener.', user: buildUserResponse(user) });
    } catch (err) {
      console.error('Demote to listener error:', err);
      return res.status(500).json({ message: 'Không thể cập nhật quyền.' });
    }
  }
);

module.exports = router;
