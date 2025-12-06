const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const Song = require('../models/Song');
const Album = require('../models/Album');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();
router.use(express.json({ limit: '10mb', type: '*/*' }));
router.use(express.urlencoded({ extended: true }));
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const withoutQuery = url.split('?')[0];
    const parts = withoutQuery.split('/');
    const last = parts[parts.length - 1] || '';
    const noExt = last.includes('.') ? last.substring(0, last.lastIndexOf('.')) : last;
    // If cloudinary style .../upload/<folder>/<publicId>
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx !== -1 && uploadIdx < parts.length - 1) {
      const slice = parts.slice(uploadIdx + 1);
      const joined = slice.join('/');
      return joined.includes('.') ? joined.substring(0, joined.lastIndexOf('.')) : joined;
    }
    return noExt || null;
  } catch (err) {
    return null;
  }
};

// Tạo metadata bài hát sau khi upload Cloudinary
router.post('/artists/songs', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const body = req.body || {};
    const {
      title,
      description,
      url,
      publicId,
      public_id,
      secure_url,
      format,
      bytes,
      duration,
      thumbnail,
      album,
      genres,
      tags,
      language,
      mood,
      trackNumber,
      releaseDate,
      visibility,
      status,
      storageProvider,
      bitrate,
      sampleRate,
      channels,
    } = body;

    const resolvedUrl = url || secure_url || body?.data?.secure_url || '';
    let resolvedPublicId = publicId || public_id || body?.data?.public_id || '';
    if (!resolvedPublicId && resolvedUrl) {
      resolvedPublicId = extractPublicIdFromUrl(resolvedUrl) || '';
    }

    if (!title) {
      return res.status(400).json({ message: 'Thiếu tiêu đề.' });
    }
    if (!resolvedUrl && !resolvedPublicId) {
      console.warn('Create song missing fields', {
        title,
        hasUrl: !!resolvedUrl,
        hasPublicId: !!resolvedPublicId,
        body,
      });
      return res.status(400).json({ message: 'Thiếu url hoặc publicId.' });
    }

    const song = await Song.create({
      title,
      description,
      url: resolvedUrl || undefined,
      publicId: resolvedPublicId || undefined,
      format,
      bytes,
      duration,
      thumbnail,
      uploadedBy: req.user._id,
      album,
      genres,
      tags,
      language,
      mood,
      trackNumber,
      releaseDate,
      visibility,
      status,
      storageProvider,
      bitrate,
      sampleRate,
      channels,
    });

    return res.status(201).json({ song });
  } catch (err) {
    console.error('Create song error:', err);
    return res.status(500).json({ message: 'Không thể lưu bài hát.' });
  }
});

// Lấy danh sách bài hát của chính nghệ sĩ
router.get('/artists/songs/me', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const songs = await Song.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    return res.json({ songs });
  } catch (err) {
    console.error('List songs error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách bài hát.' });
  }
});

// Album CRUD
router.post('/artists/albums', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const body = req.body || {};
    const { title, description, coverUrl, songs = [], status = 'published' } = body;
    if (!title || !String(title).trim()) {
      console.warn('Create album missing title, body:', body, 'headers:', req.headers);
      return res.status(400).json({ message: 'Thiếu tiêu đề album.' });
    }

    const album = await Album.create({
      title: String(title).trim(),
      description,
      coverUrl,
      songs,
      status,
      uploadedBy: req.user._id,
    });
    return res.status(201).json({ album });
  } catch (err) {
    console.error('Create album error:', err);
    return res.status(500).json({ message: 'Không thể lưu album.' });
  }
});

router.get('/artists/albums/me', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const albums = await Album.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'songs', select: 'title format' });
    return res.json({ albums });
  } catch (err) {
    console.error('List albums error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách album.' });
  }
});

router.patch('/artists/albums/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const update = req.body || {};
    const album = await Album.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      update,
      { new: true }
    );
    if (!album) return res.status(404).json({ message: 'Không tìm thấy album.' });
    return res.json({ album });
  } catch (err) {
    console.error('Update album error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật album.' });
  }
});

// Add a song to album (ensure same owner)
router.post('/artists/albums/:id/add-song', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const body = req.body || {};
    const songId =
      body.songId ||
      body.id ||
      body.songIdString ||
      body.song ||
      req.query.songId ||
      (typeof body === 'object' && Object.keys(body).length === 1 ? body[Object.keys(body)[0]] : null);
    if (!songId) {
      console.warn('Add-song missing songId, body:', body);
    }
    if (!songId) return res.status(400).json({ message: 'Thiếu songId.' });

    // Verify song belongs to artist
    const song = await Song.findOne({ _id: songId, uploadedBy: req.user._id }).select('_id');
    if (!song) return res.status(404).json({ message: 'Bài hát không tồn tại hoặc không thuộc bạn.' });

    const album = await Album.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!album) return res.status(404).json({ message: 'Không tìm thấy album.' });

    if (!Array.isArray(album.songs)) {
      album.songs = [];
    }
    const current = album.songs.map((s) => s.toString());
    if (!current.includes(songId)) {
      album.songs.push(songId);
      await album.save();
    }

    return res.json({ album });
  } catch (err) {
    console.error('Add song to album error:', err);
    return res.status(500).json({ message: 'Không thể thêm bài hát vào album.' });
  }
});

// Remove a song from album
router.post('/artists/albums/:id/remove-song', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const body = req.body || {};
    const songId = body.songId || body.id || body.song || req.query.songId;
    if (!songId) {
      console.warn('Remove-song missing songId, body:', body);
      return res.status(400).json({ message: 'Thiếu songId.' });
    }

    // verify ownership
    const song = await Song.findOne({ _id: songId, uploadedBy: req.user._id }).select('_id');
    if (!song) return res.status(404).json({ message: 'Bài hát không tồn tại hoặc không thuộc bạn.' });

    const album = await Album.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!album) return res.status(404).json({ message: 'Không tìm thấy album.' });

    if (!Array.isArray(album.songs)) album.songs = [];
    album.songs = album.songs.filter((s) => s.toString() !== songId.toString());
    await album.save();

    return res.json({ album });
  } catch (err) {
    console.error('Remove song from album error:', err);
    return res.status(500).json({ message: 'Không thể xoá bài hát khỏi album.' });
  }
});

// Public: list all albums (all artists)
router.get('/public/albums', async (req, res) => {
  try {
    const albums = await Album.find({})
      .sort({ createdAt: -1 })
      .populate({ path: 'uploadedBy', select: 'name email' })
      .populate({ path: 'songs', select: 'title format url coverUrl thumbnail uploadedBy' });
    res.json({ albums });
  } catch (err) {
    console.error('Public albums error:', err);
    res.status(500).json({ message: 'Không thể tải danh sách album.' });
  }
});

// Public: list all songs (all artists)
router.get('/public/songs', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 0;
    const query = Song.find({}).sort({ createdAt: -1 }).populate({ path: 'uploadedBy', select: 'name email' });
    if (limit > 0) query.limit(limit);
    const songs = await query.exec();
    res.json({ songs });
  } catch (err) {
    console.error('Public songs error:', err);
    res.status(500).json({ message: 'Không thể tải danh sách bài hát.' });
  }
});

router.delete('/artists/albums/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const album = await Album.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!album) return res.status(404).json({ message: 'Không tìm thấy album.' });
    return res.json({ message: 'Đã xoá album.' });
  } catch (err) {
    console.error('Delete album error:', err);
    return res.status(500).json({ message: 'Không thể xoá album.' });
  }
});

// Song update/delete
router.patch('/artists/songs/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const update = req.body || {};
    const song = await Song.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      update,
      { new: true }
    );
    if (!song) return res.status(404).json({ message: 'Không tìm thấy bài hát.' });
    return res.json({ song });
  } catch (err) {
    console.error('Update song error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật bài hát.' });
  }
});

router.delete('/artists/songs/:id', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const song = await Song.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    if (!song) return res.status(404).json({ message: 'Không tìm thấy bài hát.' });
    return res.json({ message: 'Đã xoá bài hát.' });
  } catch (err) {
    console.error('Delete song error:', err);
    return res.status(500).json({ message: 'Không thể xoá bài hát.' });
  }
});

// Stats: basic counts (stub for listens/likes/comments)
router.get('/artists/stats', requireAuth, requireRole(['ARTIST', 'ADMIN']), async (req, res) => {
  try {
    const [songCount, albumCount] = await Promise.all([
      Song.countDocuments({ uploadedBy: req.user._id }),
      Album.countDocuments({ uploadedBy: req.user._id }),
    ]);
    // Stubbed metrics
    return res.json({
      songs: songCount,
      albums: albumCount,
      listens: songCount * 120,
      likes: songCount * 40,
      comments: songCount * 10,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ message: 'Không thể tải thống kê.' });
  }
});

module.exports = router;
