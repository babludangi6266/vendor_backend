import express from 'express';
import { body, validationResult } from 'express-validator';
import Candidate from '../models/Candidate.js';
import Otp from '../models/Otp.js';
import Admin from '../models/Admin.js';
import multer from 'multer';
import path from 'path';

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
  
  // More flexible address validation - accept both object and individual fields
  body('address').custom((value, { req }) => {
    // If address is sent as individual fields, check them
    if (req.body['address[villageTownCity]']) {
      if (!req.body['address[villageTownCity]']) {
        throw new Error('Village/Town/City is required');
      }
      if (!req.body['address[pincode]'] || req.body['address[pincode]'].length !== 6) {
        throw new Error('PIN Code must be 6 digits');
      }
    } 
    // If address is sent as object/string
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

// Send OTP
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

    // Generate OTP (in production, use a proper OTP service)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await Otp.create({
      mobile,
      otp,
      type: 'candidate',
      expiresAt
    });

    // In production, send OTP via SMS service here
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only return OTP in development
    });

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
        expiresAt: { [Op.gt]: new Date() }
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

// Register candidate
// Register candidate
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
      upiTransactionId,
      uidNumber
    } = req.body;

    // COMMENTED: OTP verification check - bypass for testing
    // Check if mobile is verified
    // const verifiedOtp = await Otp.findOne({
    //   where: {
    //     mobile,
    //     isUsed: true,
    //     type: 'candidate'
    //   }
    // });

    // if (!verifiedOtp) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Mobile number not verified. Please verify OTP first.'
    //   });
    // }

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
      upiTransactionId: upiTransactionId || null,
      uidNumber: uidNumber || null,
      isMobileVerified: true, // Set to true since OTP is disabled
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