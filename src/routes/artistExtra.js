const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const Playlist = require('../models/Playlist');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Listen = require('../models/Listen');
const Like = require('../models/Like');
const Earning = require('../models/Earning');
const Promotion = require('../models/Promotion');
const SupportTicket = require('../models/SupportTicket');
const Song = require('../models/Song');
const Album = require('../models/Album');

const router = express.Router();
const asObjectIdArray = (docs) => docs.map((d) => d._id);

// Playlists
router.post('/artists/playlists', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const { title, description, coverUrl, songs = [], visibility = 'public' } = req.body || {};
    if (!title) return res.status(400).json({ message: 'Thiếu tiêu đề playlist.' });
    const playlist = await Playlist.create({
      title,
      description,
      coverUrl,
      songs,
      visibility,
      owner: req.user._id,
    });
    res.status(201).json({ playlist });
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ message: 'Không thể tạo playlist.' });
  }
});

router.get('/artists/playlists/me', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ playlists });
  } catch (err) {
    console.error('List playlist error:', err);
    res.status(500).json({ message: 'Không thể tải playlist.' });
  }
});

router.patch('/artists/playlists/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const update = req.body || {};
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update,
      { new: true }
    );
    if (!playlist) return res.status(404).json({ message: 'Không tìm thấy playlist.' });
    res.json({ playlist });
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ message: 'Không thể cập nhật playlist.' });
  }
});

router.delete('/artists/playlists/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Không tìm thấy playlist.' });
    res.json({ message: 'Đã xoá playlist.' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ message: 'Không thể xoá playlist.' });
  }
});

// Comments on artist content
router.get('/artists/comments', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const [songIds, albumIds] = await Promise.all([
      Song.find({ uploadedBy: req.user._id }).select('_id'),
      Album.find({ uploadedBy: req.user._id }).select('_id'),
    ]);
    const comments = await Comment.find({
      $or: [{ song: { $in: asObjectIdArray(songIds) } }, { album: { $in: asObjectIdArray(albumIds) } }],
    })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ comments });
  } catch (err) {
    console.error('List comments error:', err);
    res.status(500).json({ message: 'Không thể tải bình luận.' });
  }
});

router.patch('/artists/comments/:id/hide', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { status: 'hidden' }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
    res.json({ comment });
  } catch (err) {
    console.error('Hide comment error:', err);
    res.status(500).json({ message: 'Không thể cập nhật bình luận.' });
  }
});

// Notifications
router.get('/notifications/me', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ notifications });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ message: 'Không thể tải thông báo.' });
  }
});

router.post('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Không tìm thấy thông báo.' });
    res.json({ notification: notif });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ message: 'Không thể cập nhật thông báo.' });
  }
});

// Earnings
router.get('/artists/earnings', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const { period } = req.query;
    const filter = { artist: req.user._id };
    if (period) filter.period = period;
    const earnings = await Earning.find(filter).sort({ period: -1 }).limit(12);
    res.json({ earnings });
  } catch (err) {
    console.error('Earnings error:', err);
    res.status(500).json({ message: 'Không thể tải báo cáo thu nhập.' });
  }
});

// Promotions
router.post('/artists/promotions', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const { title, description, appliesToSongs = [], appliesToAlbums = [], startDate, endDate, status = 'active' } =
      req.body || {};
    if (!title || !startDate) return res.status(400).json({ message: 'Thiếu tiêu đề hoặc ngày bắt đầu.' });
    const promo = await Promotion.create({
      artist: req.user._id,
      title,
      description,
      appliesToSongs,
      appliesToAlbums,
      startDate,
      endDate,
      status,
    });
    res.status(201).json({ promotion: promo });
  } catch (err) {
    console.error('Create promotion error:', err);
    res.status(500).json({ message: 'Không thể tạo khuyến mãi.' });
  }
});

router.get('/artists/promotions', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const promotions = await Promotion.find({ artist: req.user._id }).sort({ createdAt: -1 });
    res.json({ promotions });
  } catch (err) {
    console.error('List promotion error:', err);
    res.status(500).json({ message: 'Không thể tải khuyến mãi.' });
  }
});

router.patch('/artists/promotions/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const update = req.body || {};
    const promo = await Promotion.findOneAndUpdate(
      { _id: req.params.id, artist: req.user._id },
      update,
      { new: true }
    );
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi.' });
    res.json({ promotion: promo });
  } catch (err) {
    console.error('Update promotion error:', err);
    res.status(500).json({ message: 'Không thể cập nhật khuyến mãi.' });
  }
});

router.delete('/artists/promotions/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const promo = await Promotion.findOneAndDelete({ _id: req.params.id, artist: req.user._id });
    if (!promo) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi.' });
    res.json({ message: 'Đã xoá khuyến mãi.' });
  } catch (err) {
    console.error('Delete promotion error:', err);
    res.status(500).json({ message: 'Không thể xoá khuyến mãi.' });
  }
});

// Support tickets
router.post('/artists/support', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const { title, message } = req.body || {};
    if (!title || !message) return res.status(400).json({ message: 'Thiếu tiêu đề hoặc nội dung hỗ trợ.' });
    const ticket = await SupportTicket.create({ title, message, createdBy: req.user._id });
    res.status(201).json({ ticket });
  } catch (err) {
    console.error('Create support error:', err);
    res.status(500).json({ message: 'Không thể gửi yêu cầu hỗ trợ.' });
  }
});

router.get('/artists/support/me', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    console.error('List support error:', err);
    res.status(500).json({ message: 'Không thể tải yêu cầu hỗ trợ.' });
  }
});

// Stats listens/likes detail
router.get('/artists/stats/listens-likes', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const songIds = await Song.find({ uploadedBy: req.user._id }).select('_id');
    const ids = asObjectIdArray(songIds);
    const [listens, likes] = await Promise.all([
      Listen.countDocuments({ song: { $in: ids } }),
      Like.countDocuments({ song: { $in: ids } }),
    ]);
    res.json({ listens, likes });
  } catch (err) {
    console.error('Stats detail error:', err);
    res.status(500).json({ message: 'Không thể tải thống kê.' });
  }
});

module.exports = router;
