const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    songs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
      default: [],
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Album', albumSchema);
