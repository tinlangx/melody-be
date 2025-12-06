const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String },
    bytes: { type: Number },
    duration: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    thumbnail: { type: String },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    genres: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    language: { type: String, trim: true },
    mood: { type: String, trim: true },
    trackNumber: { type: Number },
    releaseDate: { type: Date },
    visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'public' },
    status: { type: String, enum: ['draft', 'published', 'blocked', 'pending_review'], default: 'published' },
    storageProvider: { type: String, enum: ['cloudinary', 's3', 'local', 'other'], default: 'cloudinary' },
    bitrate: { type: Number }, // kbps
    sampleRate: { type: Number }, // Hz
    channels: { type: Number }, // 1=mono,2=stereo
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    playlistCount: { type: Number, default: 0 },
    lastPlayedAt: { type: Date },
    reports: { type: Number, default: 0 },
    moderationNote: { type: String, trim: true },
    publishedAt: { type: Date },
    blockedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);
