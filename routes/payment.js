const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate M-Pesa access token
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
};

// Generate timestamp
const generateTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Generate password
const generatePassword = (timestamp) => {
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
  return password;
};

// Initiate STK Push
router.post('/stk-push', [
  body('phone').matches(/^254[0-9]{9}$/).withMessage('Please provide a valid Kenyan phone number (254XXXXXXXXX)'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, amount } = req.body;
    const user = req.user;

    // Generate access token
    const accessToken = await generateAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Create payment record
    const payment = new Payment({
      user: user._id,
      amount,
      phone,
      type: 'registration',
      transactionId: `TXN${Date.now()}`
    });

    await payment.save();

    // STK Push request
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/callback`,
      AccountReference: `PAPKASH-${user._id}`,
      TransactionDesc: 'PAPKASH Registration Fee'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPushData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update payment with M-Pesa response
    payment.checkoutRequestId = response.data.CheckoutRequestID;
    payment.merchantRequestId = response.data.MerchantRequestID;
    await payment.save();

    res.json({
      message: 'STK Push initiated successfully',
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to initiate payment',
      error: error.response?.data?.errorMessage || error.message 
    });
  }
});

// M-Pesa callback
router.post('/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const payment = await Payment.findOne({
      checkoutRequestId: stkCallback.CheckoutRequestID
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.resultCode = stkCallback.ResultCode;
    payment.resultDesc = stkCallback.ResultDesc;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      
      // Extract M-Pesa receipt number
      const callbackMetadata = stkCallback.CallbackMetadata;
      if (callbackMetadata && callbackMetadata.Item) {
        const receiptItem = callbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
        if (receiptItem) {
          payment.mpesaReceiptNumber = receiptItem.Value;
        }
      }

      // Update user payment status
      const user = await User.findById(payment.user);
      if (user) {
        user.paymentStatus = 'completed';
        user.isActive = true;
        await user.save();

        // Give referral bonus if applicable
        if (user.referredBy) {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            referrer.earnings.total += 50; // Ksh 50 referral bonus
            referrer.earnings.available += 50;
            await referrer.save();
          }
        }
      }
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = stkCallback.ResultDesc;
    }

    await payment.save();

    res.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// Check payment status
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      user: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;