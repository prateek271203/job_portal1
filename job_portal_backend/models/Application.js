const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    minlength: [100, 'Cover letter must be at least 100 characters']
  },
  resume: {
    type: String,
    required: [true, 'Resume is required']
  },
  expectedSalary: {
    type: Number,
    required: [true, 'Expected salary is required']
  },
  availability: {
    type: String,
    enum: ['immediately', '2-weeks', '1-month', '3-months', 'negotiable'],
    default: 'immediately'
  },
  interviewDate: {
    type: Date
  },
  interviewLocation: {
    type: String
  },
  interviewNotes: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  isWithdrawn: {
    type: Boolean,
    default: false
  },
  withdrawnAt: {
    type: Date
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one application per job per applicant
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Virtual for application status color
applicationSchema.virtual('statusColor').get(function() {
  const statusColors = {
    pending: '#FFA500',
    reviewing: '#007BFF',
    shortlisted: '#28A745',
    interviewed: '#17A2B8',
    hired: '#28A745',
    rejected: '#DC3545'
  };
  return statusColors[this.status] || '#6C757D';
});

// Ensure virtuals are serialized
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Application', applicationSchema);
