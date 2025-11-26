import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  razorpaySignature: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('candidate_registration', 'company_registration', 'other'),
    defaultValue: 'candidate_registration'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true
});

export default Payment;