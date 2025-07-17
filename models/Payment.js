const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'withdrawal', 'bonus'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true
  },
  mpesaReceiptNumber: {
    type: String
  },
  checkoutRequestId: {
    type: String
  },
  merchantRequestId: {
    type: String
  },
  resultCode: {
    type: String
  },
  resultDesc: {
    type: String
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);