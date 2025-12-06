const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'melody_dev_secret';

const parseToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.replace('Bearer ', '').trim();
  return null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = parseToken(req);
    if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Người dùng không tồn tại.' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
  }
};

const requireRole =
  (roles = []) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Bạn cần đăng nhập.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
    }
    next();
  };

module.exports = {
  requireAuth,
  requireRole,
};
