const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['basic_wash', 'premium_wash', 'detailing_services', 'additional_services', 'package_deals'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
