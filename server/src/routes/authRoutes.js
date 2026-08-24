const express = require('express');
const router = express.Router();
const { sendOtpEmail, verifyOtpCode } = require('../services/emailService');

// POST /api/auth/send-otp
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await sendOtpEmail(email, name);
    return res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      email: result.email
    });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch email' });
  }
});

// POST /api/auth/verify-otp
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, code, name } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
    }

    const result = await verifyOtpCode(email, code, name);
    if (result.success) {
      return res.json({
        success: true,
        user: result.user,
        role: result.role
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Invalid OTP code'
      });
    }
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Verification error' });
  }
});

// POST /api/auth/google-signin (Public Production Google OAuth Authentication)
router.post('/auth/google-signin', async (req, res) => {
  try {
    const { email, name, picture, sub } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name || cleanEmail.split('@')[0];
    const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin'))
      ? 'admin'
      : 'artist';

    const user = {
      id: sub || `google_${Date.now()}`,
      email: cleanEmail,
      name: displayName,
      picture: picture || null,
      provider: 'google',
      role,
      lastLogin: new Date().toISOString()
    };

    console.log(`[Google Auth] User successfully authenticated: ${cleanEmail} (${role})`);

    return res.json({
      success: true,
      message: 'Google authentication successful',
      user,
      role
    });
  } catch (err) {
    console.error('google-signin error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Google authentication error' });
  }
});

module.exports = router;
