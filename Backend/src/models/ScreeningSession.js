const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['ai', 'candidate'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Stage 4 — bias-awareness layer. Only ever set on 'ai' messages: the
    // AI's own generated question gets reviewed before being saved, and if
    // it looks like it touches a protected characteristic or could be
    // discriminatory, it's flagged here for recruiter visibility rather
    // than silently sent to the candidate.
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const screeningSessionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true, // one screening session per application
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    transcript: {
      type: [messageSchema],
      default: [],
    },
    // How many screening questions have been asked so far — drives the
    // "Question 3 of ~8" progress indicator on the frontend.
    questionsAsked: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScreeningSession', screeningSessionSchema);
