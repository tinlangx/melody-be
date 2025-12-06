const mongoose = require('mongoose');

const listenSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// compound index to query by song+date
listenSchema.index({ song: 1, createdAt: -1 });
listenSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Listen', listenSchema);
