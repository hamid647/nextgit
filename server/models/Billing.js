const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const billingSchema = new Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  carDetails: { // Could be an object with make, model, licensePlate
    type: String,
    trim: true
  },
  services: [{
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  staffMember: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  requestChange: {
    requested: { type: Boolean, default: false },
    newAmount: { type: Number, min: 0 },
    reason: { type: String, trim: true },
    requestedAt: { type: Date },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    approved: { type: Boolean } // true if approved, false if rejected
  }
}, { timestamps: true });

module.exports = mongoose.model('Billing', billingSchema);
