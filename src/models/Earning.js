const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema(
  {
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, required: true }, // e.g. '2025-12' (YYYY-MM)
    streamsRevenue: { type: Number, default: 0 },
    adsRevenue: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

earningSchema.index({ artist: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Earning', earningSchema);
