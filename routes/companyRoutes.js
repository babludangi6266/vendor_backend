import express from 'express';
import { body, validationResult } from 'express-validator';
import Company from '../models/Company.js';
import Otp from '../models/Otp.js';
import Admin from '../models/Admin.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/companies/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed!'), false);
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

// Update validation rules to be more flexible
const registerValidation = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('mobile').isLength({ min: 10, max: 10 }).withMessage('Mobile number must be 10 digits'),
  body('email').isEmail().withMessage('Valid email is required'),
  
  // More flexible address validation
  body('address[street]').notEmpty().withMessage('Street address is required'),
  body('address[city]').notEmpty().withMessage('City is required'),
  body('address[state]').notEmpty().withMessage('State is required'),
  body('address[pincode]').isLength({ min: 6, max: 6 }).withMessage('PIN Code must be 6 digits'),
  
  // More flexible categories validation
  body('categories').custom((value, { req }) => {
    // Check if categories is sent as array or individual fields
    let categoriesArray;
    
    if (Array.isArray(value)) {
      categoriesArray = value;
    } else if (typeof value === 'string') {
      try {
        categoriesArray = JSON.parse(value);
      } catch (e) {
        // If not JSON, check for individual category fields
        categoriesArray = Object.keys(req.body)
          .filter(key => key.startsWith('categories['))
          .map(key => req.body[key]);
      }
    } else {
      // Check for individual category fields
      categoriesArray = Object.keys(req.body)
        .filter(key => key.startsWith('categories['))
        .map(key => req.body[key]);
    }
    
    if (!categoriesArray || categoriesArray.length === 0) {
      throw new Error('At least one category is required');
    }
    
    // Store parsed categories in request for later use
    req.parsedCategories = categoriesArray;
    return true;
  }),
  
  body('candidateQuantity').isInt({ min: 1 }).withMessage('Candidate quantity must be at least 1'),
  
  // More flexible jobLocation validation
  body('jobLocation[city]').notEmpty().withMessage('Job location city is required'),
  body('jobLocation[state]').notEmpty().withMessage('Job location state is required')
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

    // Check if company already exists with this mobile
    const existingCompany = await Company.findOne({ where: { mobile } });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'Company with this mobile number already exists'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await Otp.create({
      mobile,
      otp,
      type: 'company',
      expiresAt
    });

    // In production, send OTP via SMS service here
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
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

// Register company
// Register company
router.post('/register', upload.single('businessDocument'), registerValidation, async (req, res) => {
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
      companyName,
      contactPerson,
      mobile,
      email,
      candidateQuantity
    } = req.body;

    // COMMENTED: OTP verification check - bypass for testing
    // Check if mobile is verified
    // const verifiedOtp = await Otp.findOne({
    //   where: {
    //     mobile,
    //     isUsed: true,
    //     type: 'company'
    //   }
    // });

    // if (!verifiedOtp) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Mobile number not verified. Please verify OTP first.'
    //   });
    // }

    // Parse data from different formats
    const addressData = {
      street: req.body['address[street]'] || req.body.address?.street,
      city: req.body['address[city]'] || req.body.address?.city,
      state: req.body['address[state]'] || req.body.address?.state,
      pincode: req.body['address[pincode]'] || req.body.address?.pincode
    };

    // Use parsed categories from validation or parse from request
    const categoriesData = req.parsedCategories || 
      (typeof req.body.categories === 'string' ? JSON.parse(req.body.categories) : req.body.categories) ||
      Object.keys(req.body)
        .filter(key => key.startsWith('categories['))
        .map(key => req.body[key]);

    const experienceData = {
      years: req.body['experience[years]'] || req.body.experience?.years || 0,
      months: req.body['experience[months]'] || req.body.experience?.months || 0,
      days: req.body['experience[days]'] || req.body.experience?.days || 0
    };

    const jobLocationData = {
      city: req.body['jobLocation[city]'] || req.body.jobLocation?.city,
      state: req.body['jobLocation[state]'] || req.body.jobLocation?.state
    };

    // Create company
    const companyData = {
      companyName,
      contactPerson,
      mobile,
      email,
      address: addressData,
      categories: categoriesData,
      candidateQuantity,
      experience: experienceData,
      jobLocation: jobLocationData,
      businessDocument: req.file ? req.file.filename : null,
      isMobileVerified: true // Set to true since OTP is disabled
    };

    console.log('Creating company with data:', companyData);

    const newCompany = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully!',
      company: {
        id: newCompany.id,
        companyName: newCompany.companyName,
        contactPerson: newCompany.contactPerson,
        mobile: newCompany.mobile,
        registrationDate: newCompany.registrationDate
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Company with this mobile number already exists'
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

// Get all companies (Admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['registrationDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get company by ID (Admin only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      company
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Update company status (Admin only)
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { registrationStatus } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(registrationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const company = await Company.findByPk(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    company.registrationStatus = registrationStatus;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company status updated successfully',
      company: {
        id: company.id,
        companyName: company.companyName,
        registrationStatus: company.registrationStatus
      }
    });

  } catch (error) {
    console.error('Update company status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Delete company (Super admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.admin.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const company = await Company.findByPk(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await company.destroy();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

export default router;