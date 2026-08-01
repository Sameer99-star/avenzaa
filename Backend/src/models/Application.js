const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'screened', 'shortlisted', 'hired', 'rejected'],
      default: 'applied',
    },
    matchScore: {
      type: Number, // 0-100, produced by the ML service
      default: null,
    },
    // Explainability output from the LLM: which resume points support
    // which JD requirements, plus flagged gaps. Stored as flexible JSON
    // since the shape can evolve without a schema migration.
    matchExplanation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ companyId: 1, jobId: 1, stage: 1 });
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
