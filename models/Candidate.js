import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  photo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'office_work',
      'accounts',
      'telecalling',
      'marketing_work',
      'cook_staff',
      'plumber',
      'electrician',
      'painter',
      'driver',
      'event_work',
      'security_service',
      'labour_work',
      'construction_work',
      'pandit_ji_poojan',
      'other_work'
    ),
    allowNull: false
  },
  jobLocationCity: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  customCity: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  upiTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  uidNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  registrationFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00 // CHANGED: Default fee is now 0
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'completed' // CHANGED: Default status is completed
  },
  registrationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved' // CHANGED: Auto-approve since there is no payment check
  },
  isMobileVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'candidates',
  timestamps: true,
  createdAt: 'registrationDate',
  updatedAt: 'updatedAt'
});

export default Candidate;