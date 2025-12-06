const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const User = require('../models/User');

const router = express.Router();
router.use(express.json());

// Create playlist
router.post('/listeners/playlists', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const { title, description, coverUrl } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Thiếu tiêu đề playlist.' });
    }
    const playlist = await Playlist.create({
      title: String(title).trim(),
      description,
      coverUrl,
      owner: req.user._id,
      visibility: 'private',
    });
    return res.status(201).json({ playlist });
  } catch (err) {
    console.error('Create playlist error:', err);
    return res.status(500).json({ message: 'Không thể tạo playlist.' });
  }
});

// List playlists (own)
router.get('/listeners/playlists', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'songs', select: 'title coverUrl thumbnail uploadedBy' });
    return res.json({ playlists });
  } catch (err) {
    console.error('List playlists error:', err);
    return res.status(500).json({ message: 'Không thể tải playlist.' });
  }
});

// Delete playlist
router.delete('/listeners/playlists/:id', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const removed = await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!removed) return res.status(404).json({ message: 'Không tìm thấy playlist.' });
    return res.json({ message: 'Đã xoá playlist.' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    return res.status(500).json({ message: 'Không thể xoá playlist.' });
  }
});

// Add song to playlist
router.post('/listeners/playlists/:id/add-song', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const songId = req.body?.songId || req.query.songId;
    if (!songId) return res.status(400).json({ message: 'Thiếu songId.' });
    const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Không tìm thấy playlist.' });
    const song = await Song.findById(songId).select('_id');
    if (!song) return res.status(404).json({ message: 'Bài hát không tồn tại.' });
    playlist.songs = playlist.songs || [];
    if (!playlist.songs.map((s) => s.toString()).includes(songId.toString())) {
      playlist.songs.push(songId);
      await playlist.save();
    }
    return res.json({ playlist });
  } catch (err) {
    console.error('Add song playlist error:', err);
    return res.status(500).json({ message: 'Không thể thêm bài hát.' });
  }
});

// Remove song from playlist
router.post('/listeners/playlists/:id/remove-song', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const songId = req.body?.songId || req.query.songId;
    if (!songId) return res.status(400).json({ message: 'Thiếu songId.' });
    const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Không tìm thấy playlist.' });
    playlist.songs = (playlist.songs || []).filter((s) => s.toString() !== songId.toString());
    await playlist.save();
    return res.json({ playlist });
  } catch (err) {
    console.error('Remove song playlist error:', err);
    return res.status(500).json({ message: 'Không thể xoá bài hát khỏi playlist.' });
  }
});

// Favorites
router.get('/listeners/favorites', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'title coverUrl thumbnail uploadedBy url',
      options: { sort: { createdAt: -1 } },
    });
    return res.json({ favorites: user?.favorites || [] });
  } catch (err) {
    console.error('List favorites error:', err);
    return res.status(500).json({ message: 'Không thể tải favorites.' });
  }
});

router.post('/listeners/favorites', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const songId = req.body?.songId;
    if (!songId) return res.status(400).json({ message: 'Thiếu songId.' });
    const song = await Song.findById(songId).select('_id');
    if (!song) return res.status(404).json({ message: 'Bài hát không tồn tại.' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: songId } },
      { new: true }
    ).populate({ path: 'favorites', select: 'title coverUrl thumbnail uploadedBy url' });
    return res.json({ favorites: user.favorites });
  } catch (err) {
    console.error('Add favorite error:', err);
    return res.status(500).json({ message: 'Không thể thêm favorite.' });
  }
});

router.delete('/listeners/favorites/:songId', requireAuth, requireRole(['LISTENER', 'ADMIN']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: req.params.songId } },
      { new: true }
    ).populate({ path: 'favorites', select: 'title coverUrl thumbnail uploadedBy url' });
    return res.json({ favorites: user.favorites });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return res.status(500).json({ message: 'Không thể xoá favorite.' });
  }
});

module.exports = router;
