const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
