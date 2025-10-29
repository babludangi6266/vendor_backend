import express from 'express';
import Vendor from '../models/Vendor.js';

const router = express.Router();

// Register new vendor
router.post('/register', async (req, res) => {
  try {
    const { name, contact, email, address, serviceCategory, rate, rateType } = req.body;

    // Create new vendor
    const newVendor = await Vendor.create({
      name,
      contact,
      email,
      address,
      serviceCategory,
      rate,
      rateType
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully!',
      vendor: {
        id: newVendor.id,
        name: newVendor.name,
        contact: newVendor.contact,
        serviceCategory: newVendor.serviceCategory
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MySQL errors
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

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      order: [['registrationDate', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      vendors: vendors
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      vendor: vendor
    });

  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.destroy();

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

export default router;

