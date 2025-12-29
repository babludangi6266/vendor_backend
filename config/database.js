import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 60000,
      ssl: process.env.DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

export const connectDB = async () => {
  try {
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('MySQL Connected Successfully');
    
    // Use safer sync options
    await sequelize.sync({ force: false }); // Remove alter: true to be safer
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};