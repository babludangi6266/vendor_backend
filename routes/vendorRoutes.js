import express from 'express';
import Vendor from '../models/Vendor.js';

const router = express.Router();

// Register new vendor
router.post('/register', async (req, res) => {
  try {
    const { name, contact, email, address, serviceCategory, rate, rateType } = req.body;

    // Create new vendor
    const newVendor = new Vendor({
      name,
      contact,
      email,
      address,
      serviceCategory,
      rate,
      rateType
    });

    await newVendor.save();

    res.status(201).json({
      success: true,
      message: 'Profile created successfully!',
      vendor: {
        id: newVendor._id,
        name: newVendor.name,
        contact: newVendor.contact,
        serviceCategory: newVendor.serviceCategory
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ registrationDate: -1 });
    
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

export default router;