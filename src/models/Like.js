const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

likeSchema.index({ song: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
