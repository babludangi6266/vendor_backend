import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { createInitialSuperAdmin } from './config/initialSetup.js';

// Import routes
import adminRoutes from './routes/adminRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
//import paymentRoutes from './routes/paymentRoutes.js'; // ADD THIS LINE

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://vendor-admin-snowy.vercel.app',
    'https://vendor-public.vercel.app',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173' // Vite default port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'admin-id'
  ],
  exposedHeaders: ['admin-id'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// IMPORTANT: For Razorpay webhooks, we need raw body parsing
//app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directories if they don't exist
import fs from 'fs';
const uploadDirs = ['uploads/candidates', 'uploads/companies'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/companies', companyRoutes);
//app.use('/api/payments', paymentRoutes); 

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Multer file size error
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 2MB.'
    });
  }
  
  // Multer file type error
  if (error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Razorpay errors
  if (error.message.includes('razorpay') || error.message.includes('Razorpay')) {
    return res.status(400).json({
      success: false,
      message: 'Payment processing error. Please try again.'
    });
  }
  
  // SMS service errors
  if (error.message.includes('SMS') || error.message.includes('OTP')) {
    return res.status(500).json({
      success: false,
      message: 'SMS service temporarily unavailable. Please try again.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    await createInitialSuperAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Upload directories created: ${uploadDirs.join(', ')}`);
      console.log(`💰 Payment system: ${process.env.RAZORPAY_KEY_ID ? 'Enabled' : 'Disabled'}`);
      console.log(`📱 SMS service: ${process.env.DVHOSTING_API_KEY ? 'Enabled' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();