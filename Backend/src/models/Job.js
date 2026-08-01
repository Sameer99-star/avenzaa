const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true, // every query on jobs is scoped by company first
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true, // this is what gets embedded for RAG retrieval
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    niceToHaveSkills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'draft'],
      default: 'draft',
    },
    // Pointer to the vector DB record for this job's description embedding.
    // We don't store the embedding itself in Mongo — it lives in Chroma,
    // this is just the reference id so we can re-embed or delete it later.
    embeddingId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

jobSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
