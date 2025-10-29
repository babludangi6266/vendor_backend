
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js'; 

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  serviceCategory: {
    type: DataTypes.ENUM(
      'electrician',
      'plumber', 
      'carpenter',
      'cleaner',
      'painter',
      'technician',
      'gardener',
      'mason'
    ),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  rateType: {
    type: DataTypes.ENUM('hourly', 'per-job'),
    defaultValue: 'hourly'
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'vendors',
  timestamps: false
});

export default Vendor;
