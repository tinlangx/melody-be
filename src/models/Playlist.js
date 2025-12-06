const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'public' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playlist', playlistSchema);
