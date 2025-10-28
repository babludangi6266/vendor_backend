import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  contact: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  // Service Information
  serviceCategory: {
    type: String,
    required: true,
    enum: [
      'electrician',
      'plumber', 
      'carpenter',
      'cleaner',
      'painter',
      'technician',
      'gardener',
      'mason'
    ]
  },
  
  rate: {
    type: Number,
    min: 0
  },
  
  rateType: {
    type: String,
    enum: ['hourly', 'per-job'],
    default: 'hourly'
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  }
});

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;