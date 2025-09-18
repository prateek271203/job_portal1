const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true, 
    trim: true
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true
  },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
