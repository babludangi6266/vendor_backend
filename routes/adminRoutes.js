

import express from 'express';
import { body, validationResult } from 'express-validator';
import Admin from '../models/Admin.js';

const router = express.Router();

// Simple authentication middleware
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

// Super admin only middleware
const requireSuperAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (!req.admin.isSuperAdmin()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const createAdminValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }).trim()
];

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({ 
      where: { email, isActive: true } 
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all admins (Super admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new admin (Super admin only)
router.post('/create', requireSuperAdmin, createAdminValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const newAdmin = await Admin.create({
      email,
      password,
      name,
      role: 'admin',
      isActive: true,
      createdBy: req.admin.id
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update admin (Super admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, isActive } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent super admin from modifying their own role/status
    if (admin.isSuperAdmin() && admin.id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin account'
      });
    }

    // Update fields
    if (email) admin.email = email;
    if (name) admin.name = name;
    if (password) admin.password = password;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete admin (Super admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (parseInt(id) === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting super admin
    if (admin.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    await admin.destroy();

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

