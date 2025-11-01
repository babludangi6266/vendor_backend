import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Otp = sequelize.define('Otp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('candidate', 'company'),
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'otps',
  timestamps: true
});

export default Otp;