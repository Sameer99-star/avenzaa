const { Worker } = require('bullmq');
const connection = require('../config/redis');
const Candidate = require('../models/Candidate');
const { extractStructuredProfile } = require('../utils/groq');
const vectorIndex = require('../config/vectorDb');

const worker = new Worker(
  'resume-processing',
  async (job) => {
    const { candidateId } = job.data;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
    if (!candidate.resumeText) throw new Error(`Candidate ${candidateId} has no resumeText to process`);

    console.log(`[resume-worker] extracting structured profile for candidate ${candidateId}`);

    const structured = await extractStructuredProfile(candidate.resumeText);

    candidate.structuredProfile = {
      skills: structured.skills || [],
      yearsExperience: structured.yearsExperience || 0,
      education: structured.education || '',
      noticePeriodDays: structured.noticePeriodDays ?? null,
    };

    candidate.redactedProfile = {
      anonymizedId: `Candidate #${candidate._id.toString().slice(-4)}`,
      skills: candidate.structuredProfile.skills,
      yearsExperience: candidate.structuredProfile.yearsExperience,
    };

    // Embed the resume into the vector index so the recruiter co-pilot
    // can semantically search across the whole candidate pool later (Stage 3).
    const embeddingId = `candidate:${candidate._id.toString()}`;
    try {
      await vectorIndex.upsert({
        id: embeddingId,
        data: `Skills: ${candidate.structuredProfile.skills.join(', ')}. Experience: ${candidate.structuredProfile.yearsExperience} years. Education: ${candidate.structuredProfile.education}.`,
        metadata: {
          type: 'candidate',
          candidateId: candidate._id.toString(),
          companyId: candidate.companyId.toString(),
        },
      });
      candidate.embeddingId = embeddingId;
    } catch (err) {
      console.error(`[resume-worker] embedding failed for candidate ${candidateId}:`, err.message);
    }

    await candidate.save();
    console.log(`[resume-worker] done with candidate ${candidateId}`);
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error(`[resume-worker] job ${job.id} failed:`, err.message);
});

module.exports = worker;
