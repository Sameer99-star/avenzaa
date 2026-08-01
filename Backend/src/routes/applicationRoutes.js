const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const streamifier = require('streamifier');

const cloudinary = require('../config/cloudinary');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Job = require('../models/Job');
const resumeQueue = require('../queues/resumeQueue');

const router = express.Router();

// Keep the file in memory — we need the buffer for both pdf-parse
// and the Cloudinary upload, no need to write to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are accepted'));
    }
    cb(null, true);
  },
});

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'avenza/resumes' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/applications/apply
// multipart/form-data fields: resume (file), jobId, name, email
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    console.log('[apply] 1. request received');
    const { jobId, name, email } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Resume PDF is required' });
    if (!jobId || !name || !email) {
      return res.status(400).json({ error: 'jobId, name and email are required' });
    }
    console.log('[apply] 2. file + fields present, file size:', req.file.buffer.length);

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    console.log('[apply] 3. job found:', job.title);

    const parsed = await pdfParse(req.file.buffer);
    const resumeText = parsed.text;
    console.log('[apply] 4. pdf parsed, text length:', resumeText.length);

    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer);
    console.log('[apply] 5. cloudinary upload done:', cloudinaryResult.secure_url);

    let candidate = await Candidate.findOne({ companyId: job.companyId, email });
    if (!candidate) {
      candidate = await Candidate.create({
        companyId: job.companyId,
        name,
        email,
        resumeUrl: cloudinaryResult.secure_url,
        resumeText,
      });
    } else {
      candidate.resumeUrl = cloudinaryResult.secure_url;
      candidate.resumeText = resumeText;
      await candidate.save();
    }
    console.log('[apply] 6. candidate saved:', candidate._id.toString());

    const application = await Application.findOneAndUpdate(
      { candidateId: candidate._id, jobId: job._id },
      { companyId: job.companyId, candidateId: candidate._id, jobId: job._id, stage: 'applied' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('[apply] 7. application saved:', application._id.toString());

    await resumeQueue.add('structure-resume', { candidateId: candidate._id.toString() });
    console.log('[apply] 8. queued for LLM processing — DONE');

    res.status(201).json({
      applicationId: application._id,
      candidateId: candidate._id,
      message: 'Application received, resume is being processed',
    });
  } catch (err) {
    console.error('[apply route] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
