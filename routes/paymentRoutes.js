import express from 'express';
import crypto from 'crypto';
import Payment from '../models/Payment.js';

const router = express.Router();

// Razorpay Webhook Handler
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (expectedSignature === signature) {
      const webhookBody = JSON.parse(req.body);
      
      // Handle different webhook events
      switch (webhookBody.event) {
        case 'payment.captured':
          handlePaymentCaptured(webhookBody.payload);
          break;
        case 'payment.failed':
          handlePaymentFailed(webhookBody.payload);
          break;
        default:
          console.log('Unhandled webhook event:', webhookBody.event);
      }
      
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

const handlePaymentCaptured = async (payload) => {
  try {
    const payment = payload.payment.entity;
    
    await Payment.create({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      razorpaySignature: '', // Not available in webhook
      amount: payment.amount,
      currency: payment.currency,
      status: 'completed',
      type: 'candidate_registration',
      metadata: payload
    });
    
    console.log('Payment captured and saved:', payment.id);
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
};

const handlePaymentFailed = async (payload) => {
  try {
    const payment = payload.payment.entity;
    
    await Payment.create({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      razorpaySignature: '',
      amount: payment.amount,
      currency: payment.currency,
      status: 'failed',
      type: 'candidate_registration',
      metadata: payload
    });
    
    console.log('Payment failed:', payment.id);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

export default router;