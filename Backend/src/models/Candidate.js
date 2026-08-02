const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    // Optional link if the candidate has a login (User doc). Guest applicants
    // may not have one, so this stays optional.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    currentCompany: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String, // Cloudflare R2 / Cloudinary link to the raw PDF
      required: true,
    },
    resumeText: {
      type: String, // extracted raw text, used for embedding + LLM parsing
      default: '',
    },
    // Structured data extracted by the LLM from resumeText (Stage 1)
    structuredProfile: {
      skills: { type: [String], default: [] },
      yearsExperience: { type: Number, default: 0 },
      education: { type: String, default: '' },
      noticePeriodDays: { type: Number, default: null },
    },
    // Redacted view used ONLY when sending data to the LLM for scoring,
    // and shown in the UI when the recruiter toggles "view redacted profile".
    // Name, photo, and gender-coded terms are stripped/replaced here.
    redactedProfile: {
      anonymizedId: { type: String }, // e.g. "Candidate #204"
      skills: { type: [String], default: [] },
      yearsExperience: { type: Number, default: 0 },
    },
    embeddingId: {
      type: String, // pointer to this candidate's vector in Chroma
      default: null,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ companyId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);
