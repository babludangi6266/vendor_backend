// import express from 'express';
// import { body, validationResult } from 'express-validator';
// import Candidate from '../models/Candidate.js';
// import Otp from '../models/Otp.js';
// import Admin from '../models/Admin.js';
// import multer from 'multer';
// import twilio from 'twilio';
// import path from 'path';

// console.log('Twilio Config:', {
//   accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing',
//   authToken: process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing',
//   phoneNumber: process.env.TWILIO_PHONE_NUMBER
// });

// const twilioClient = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// const router = express.Router();

// // Multer configuration for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/candidates/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 2 * 1024 * 1024 // 2MB limit
//   },
//   fileFilter: fileFilter
// });

// // Auth middleware
// const requireAuth = async (req, res, next) => {
//   try {
//     const adminId = req.headers['admin-id'];
    
//     if (!adminId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }

//     const admin = await Admin.findByPk(adminId);
    
//     if (!admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Admin not found'
//       });
//     }

//     if (!admin.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin account is deactivated'
//       });
//     }

//     req.admin = admin;
//     next();
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication error'
//     });
//   }
// };

// // Validation rules
// const sendOtpValidation = [
//   body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits')
// ];

// const verifyOtpValidation = [
//   body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
//   body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
// ];

// const registerValidation = [
//   body('fullName').notEmpty().withMessage('Full name is required'),
//   body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
//   body('email').optional().isEmail().withMessage('Valid email is required'),
  
//   // More flexible address validation - accept both object and individual fields
//   body('address').custom((value, { req }) => {
//     // If address is sent as individual fields, check them
//     if (req.body['address[villageTownCity]']) {
//       if (!req.body['address[villageTownCity]']) {
//         throw new Error('Village/Town/City is required');
//       }
//       if (!req.body['address[pincode]'] || req.body['address[pincode]'].length !== 6) {
//         throw new Error('PIN Code must be 6 digits');
//       }
//     } 
//     // If address is sent as object/string
//     else if (value) {
//       try {
//         const addressObj = typeof value === 'string' ? JSON.parse(value) : value;
//         if (!addressObj.villageTownCity) {
//           throw new Error('Village/Town/City is required');
//         }
//         if (!addressObj.pincode || addressObj.pincode.length !== 6) {
//           throw new Error('PIN Code must be 6 digits');
//         }
//       } catch (e) {
//         throw new Error('Invalid address format');
//       }
//     } else {
//       throw new Error('Address information is required');
//     }
//     return true;
//   }),
  
//   body('category').notEmpty().withMessage('Category is required'),
//   body('jobLocationCity').notEmpty().withMessage('Job location city is required')
// ];

// // Send OTP
// // router.post('/send-otp', sendOtpValidation, async (req, res) => {
// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Validation failed',
// //         errors: errors.array()
// //       });
// //     }

// //     const { mobile } = req.body;

// //     // Check if candidate already exists with this mobile
// //     const existingCandidate = await Candidate.findOne({ where: { mobile } });
// //     if (existingCandidate) {
// //       return res.status(409).json({
// //         success: false,
// //         message: 'Candidate with this mobile number already exists'
// //       });
// //     }

// //     // Generate OTP (in production, use a proper OTP service)
// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

// //     // Save OTP to database
// //     await Otp.create({
// //       mobile,
// //       otp,
// //       type: 'candidate',
// //       expiresAt
// //     });

// //     // In production, send OTP via SMS service here
// //     console.log(`OTP for ${mobile}: ${otp}`);

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only return OTP in development
// //     });

// //   } catch (error) {
// //     console.error('Send OTP error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to send OTP'
// //     });
// //   }
// // });
// router.post('/send-otp', sendOtpValidation, async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { mobile } = req.body;

//     // Check if candidate already exists with this mobile
//     const existingCandidate = await Candidate.findOne({ where: { mobile } });
//     if (existingCandidate) {
//       return res.status(409).json({
//         success: false,
//         message: 'Candidate with this mobile number already exists'
//       });
//     }

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     // Save OTP to database
//     await Otp.create({
//       mobile,
//       otp,
//       type: 'candidate',
//       expiresAt
//     });

//     // Send OTP via Twilio
//     try {
//       await twilioClient.messages.create({
//         body: `Your verification code for Workforce Connect is: ${otp}. This code will expire in 10 minutes.`,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: `+91${mobile}` // Assuming Indian numbers
//       });

//       res.status(200).json({
//         success: true,
//         message: 'OTP sent successfully'
//       });

//     } catch (twilioError) {
//       console.error('Twilio error:', twilioError);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send OTP via SMS. Please try again.'
//       });
//     }

//   } catch (error) {
//     console.error('Send OTP error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send OTP'
//     });
//   }
// });

// // Verify OTP
// router.post('/verify-otp', verifyOtpValidation, async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const { mobile, otp } = req.body;

//     // Find valid OTP
//     const otpRecord = await Otp.findOne({
//       where: {
//         mobile,
//         otp,
//         isUsed: false,
//         expiresAt: { [Op.gt]: new Date() }
//       }
//     });

//     if (!otpRecord) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired OTP'
//       });
//     }

//     // Mark OTP as used
//     otpRecord.isUsed = true;
//     await otpRecord.save();

//     res.status(200).json({
//       success: true,
//       message: 'OTP verified successfully'
//     });

//   } catch (error) {
//     console.error('Verify OTP error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to verify OTP'
//     });
//   }
// });

// // Register candidate
// // Register candidate
// router.post('/register', upload.single('photo'), registerValidation, async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const {
//       fullName,
//       mobile,
//       email,
//       address,
//       category,
//       jobLocationCity,
//       customCity,
//       upiTransactionId,
//       uidNumber
//     } = req.body;

//     // COMMENTED: OTP verification check - bypass for testing
//     // Check if mobile is verified
//     const verifiedOtp = await Otp.findOne({
//       where: {
//         mobile,
//         isUsed: true,
//         type: 'candidate'
//       }
//     });

//     if (!verifiedOtp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Mobile number not verified. Please verify OTP first.'
//       });
//     }

//     // Parse JSON fields if they come as strings
//     const addressData = typeof address === 'string' ? JSON.parse(address) : address;

//     // Create candidate
//     const candidateData = {
//       fullName,
//       mobile,
//       email: email || null,
//       address: addressData,
//       category,
//       jobLocationCity,
//       customCity: customCity || null,
//       upiTransactionId: upiTransactionId || null,
//       uidNumber: uidNumber || null,
//       isMobileVerified: true, // Set to true since OTP is disabled
//       photo: req.file ? req.file.filename : null
//     };

//     const newCandidate = await Candidate.create(candidateData);

//     res.status(201).json({
//       success: true,
//       message: 'Candidate registered successfully!',
//       candidate: {
//         id: newCandidate.id,
//         fullName: newCandidate.fullName,
//         mobile: newCandidate.mobile,
//         category: newCandidate.category,
//         registrationDate: newCandidate.registrationDate
//       }
//     });

//   } catch (error) {
//     console.error('Candidate registration error:', error);
    
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(409).json({
//         success: false,
//         message: 'Candidate with this mobile number already exists'
//       });
//     }
    
//     if (error.name === 'SequelizeValidationError') {
//       const errors = error.errors.map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.'
//     });
//   }
// });

// // Get all candidates (Admin only)
// router.get('/', requireAuth, async (req, res) => {
//   try {
//     const candidates = await Candidate.findAll({
//       order: [['registrationDate', 'DESC']]
//     });
    
//     res.status(200).json({
//       success: true,
//       candidates
//     });

//   } catch (error) {
//     console.error('Get candidates error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.'
//     });
//   }
// });

// // Get candidate by ID (Admin only)
// router.get('/:id', requireAuth, async (req, res) => {
//   try {
//     const candidate = await Candidate.findByPk(req.params.id);
    
//     if (!candidate) {
//       return res.status(404).json({
//         success: false,
//         message: 'Candidate not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       candidate
//     });

//   } catch (error) {
//     console.error('Get candidate error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.'
//     });
//   }
// });

// // Update candidate status (Admin only)
// router.put('/:id/status', requireAuth, async (req, res) => {
//   try {
//     const { registrationStatus } = req.body;
    
//     if (!['pending', 'approved', 'rejected'].includes(registrationStatus)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status'
//       });
//     }

//     const candidate = await Candidate.findByPk(req.params.id);
    
//     if (!candidate) {
//       return res.status(404).json({
//         success: false,
//         message: 'Candidate not found'
//       });
//     }

//     candidate.registrationStatus = registrationStatus;
//     await candidate.save();

//     res.status(200).json({
//       success: true,
//       message: 'Candidate status updated successfully',
//       candidate: {
//         id: candidate.id,
//         fullName: candidate.fullName,
//         registrationStatus: candidate.registrationStatus
//       }
//     });

//   } catch (error) {
//     console.error('Update candidate status error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.'
//     });
//   }
// });

// // Delete candidate (Super admin only)
// router.delete('/:id', requireAuth, async (req, res) => {
//   try {
//     if (!req.admin.isSuperAdmin()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Super admin privileges required.'
//       });
//     }

//     const candidate = await Candidate.findByPk(req.params.id);
    
//     if (!candidate) {
//       return res.status(404).json({
//         success: false,
//         message: 'Candidate not found'
//       });
//     }

//     await candidate.destroy();

//     res.status(200).json({
//       success: true,
//       message: 'Candidate deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete candidate error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again.'
//     });
//   }
// });

// export default router;

import express from 'express';
import { body, validationResult } from 'express-validator';
import Candidate from '../models/Candidate.js';
import Otp from '../models/Otp.js';
import Admin from '../models/Admin.js';
import Payment from '../models/Payment.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import https from 'https'; // ADD THIS IMPORT
import { Sequelize } from 'sequelize'; // ADD THIS IMPORT

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/candidates/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: fileFilter
});

// Auth middleware
const requireAuth = async (req, res, next) => {
  try {
    const adminId = req.headers['admin-id'];
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const admin = await Admin.findByPk(adminId);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Validation rules
const sendOtpValidation = [
  body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits')
];

const verifyOtpValidation = [
  body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const registerValidation = [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  
  body('address').custom((value, { req }) => {
    if (req.body['address[villageTownCity]']) {
      if (!req.body['address[villageTownCity]']) {
        throw new Error('Village/Town/City is required');
      }
      if (!req.body['address[pincode]'] || req.body['address[pincode]'].length !== 6) {
        throw new Error('PIN Code must be 6 digits');
      }
    } 
    else if (value) {
      try {
        const addressObj = typeof value === 'string' ? JSON.parse(value) : value;
        if (!addressObj.villageTownCity) {
          throw new Error('Village/Town/City is required');
        }
        if (!addressObj.pincode || addressObj.pincode.length !== 6) {
          throw new Error('PIN Code must be 6 digits');
        }
      } catch (e) {
        throw new Error('Invalid address format');
      }
    } else {
      throw new Error('Address information is required');
    }
    return true;
  }),
  
  body('category').notEmpty().withMessage('Category is required'),
  body('jobLocationCity').notEmpty().withMessage('Job location city is required')
];

// Send OTP using dvhosting.in API
router.post('/send-otp', sendOtpValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { mobile } = req.body;

    // Check if candidate already exists with this mobile
    const existingCandidate = await Candidate.findOne({ where: { mobile } });
    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: 'Candidate with this mobile number already exists'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await Otp.create({
      mobile,
      otp,
      type: 'candidate',
      expiresAt
    });

    // Send OTP via dvhosting.in API
    try {
      const dv_key = process.env.DVHOSTING_API_KEY;
      const num = mobile;
      
      const otp_url = `https://dvhosting.in/api-sms-v3.php?api_key=${dv_key}&number=${num}&otp=${otp}`;
      
      const response = await axios.get(otp_url, {
        timeout: 10000,
        httpsAgent: new https.Agent({ // FIXED: Use imported https module
          rejectUnauthorized: false
        })
      });

      console.log('SMS API Response:', response.data);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully'
      });

    } catch (smsError) {
      console.error('SMS API error:', smsError);
      
      // Even if SMS fails, we'll still return success in development
      // and allow manual OTP entry for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development OTP for ${mobile}: ${otp}`);
        return res.status(200).json({
          success: true,
          message: 'OTP generated (SMS may have failed)',
          otp: otp // Return OTP for development
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via SMS. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/verify-otp', verifyOtpValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { mobile, otp } = req.body;

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      where: {
        mobile,
        otp,
        isUsed: false,
        expiresAt: { [Sequelize.Op.gt]: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Razorpay Payment Routes

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        message: 'Amount and receipt are required'
      });
    }

    console.log('Creating Razorpay order with:', { amount, currency, receipt });

    // FIXED: Use dynamic import for ES modules
    const { default: Razorpay } = await import('razorpay');
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt,
      notes: notes
    };

    console.log('Razorpay options:', options);

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created:', order);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order: ' + error.message
    });
  }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    console.log('Signature verification:', { isAuthentic, expectedSignature, receivedSignature: razorpay_signature });

    if (isAuthentic) {
      // Save payment record to database
      await Payment.create({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: 19900, // ₹199 in paise
        currency: 'INR',
        status: 'completed',
        type: 'candidate_registration'
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification error: ' + error.message
    });
  }
});

// Register candidate with payment verification
router.post('/register', upload.single('photo'), registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      fullName,
      mobile,
      email,
      address,
      category,
      jobLocationCity,
      customCity,
      uidNumber,
      paymentVerified
    } = req.body;

    // Check if mobile is verified
    const verifiedOtp = await Otp.findOne({
      where: {
        mobile,
        isUsed: true,
        type: 'candidate'
      }
    });

    if (!verifiedOtp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number not verified. Please verify OTP first.'
      });
    }

    // Check if payment is verified
    if (!paymentVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment not verified. Please complete payment process.'
      });
    }

    // Parse JSON fields if they come as strings
    const addressData = typeof address === 'string' ? JSON.parse(address) : address;

    // Create candidate
    const candidateData = {
      fullName,
      mobile,
      email: email || null,
      address: addressData,
      category,
      jobLocationCity,
      customCity: customCity || null,
      uidNumber: uidNumber || null,
      isMobileVerified: true,
      paymentVerified: true,
      registrationStatus: 'approved', // Auto-approve after payment
      photo: req.file ? req.file.filename : null
    };

    const newCandidate = await Candidate.create(candidateData);

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully!',
      candidate: {
        id: newCandidate.id,
        fullName: newCandidate.fullName,
        mobile: newCandidate.mobile,
        category: newCandidate.category,
        registrationDate: newCandidate.registrationDate
      }
    });

  } catch (error) {
    console.error('Candidate registration error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Candidate with this mobile number already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get all candidates (Admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const candidates = await Candidate.findAll({
      order: [['registrationDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      candidates
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get candidate by ID (Admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      candidate
    });

  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Update candidate status (Admin only)
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { registrationStatus } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(registrationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const candidate = await Candidate.findByPk(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.registrationStatus = registrationStatus;
    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Candidate status updated successfully',
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        registrationStatus: candidate.registrationStatus
      }
    });

  } catch (error) {
    console.error('Update candidate status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Delete candidate (Super admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.admin.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const candidate = await Candidate.findByPk(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    await candidate.destroy();

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

export default router;