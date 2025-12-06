const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    appliesToSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    appliesToAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

promotionSchema.index({ artist: 1, status: 1, startDate: -1 });

module.exports = mongoose.model('Promotion', promotionSchema);
