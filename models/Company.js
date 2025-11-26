import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contactPerson: {
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
    allowNull: false
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  categories: {
 type: DataTypes.STRING,
  allowNull: false
  },
  candidateQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  experience: {
    type: DataTypes.JSON,
    allowNull: false
  },
  jobLocation: {
    type: DataTypes.JSON,
    allowNull: false
  },
  businessDocument: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  registrationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
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
  tableName: 'companies',
  timestamps: true,
  createdAt: 'registrationDate',
  updatedAt: 'updatedAt'
});

export default Company;