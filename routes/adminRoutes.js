import express from 'express';

const router = express.Router();

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  email: 'babludangi2000@gmail.com',
  password: 'bablu@9788'
};

// Admin login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        admin: {
          email: ADMIN_CREDENTIALS.email,
          name: 'Admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

export default router;