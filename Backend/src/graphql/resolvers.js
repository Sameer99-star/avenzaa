const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const ScreeningSession = require('../models/ScreeningSession');
const { signToken, requireAuth, requireRole } = require('../middleware/auth');
const vectorIndex = require('../config/vectorDb');
const { generateNextScreeningMessage, checkQuestionForBias, TARGET_QUESTIONS } = require('../utils/screening');
const { generateMatchExplanation, generateSearchSummary } = require('../utils/matching');

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const resolvers = {
  // GraphQL enums require the internal value to exactly match the enum
  // name unless we map it explicitly. Our Mongoose models store roles
  // and stages in lowercase, so we map lowercase <-> UPPERCASE here —
  // this handles both parsing input (ADMIN -> 'admin') and serializing
  // output ('admin' -> ADMIN) automatically.
  Role: {
    ADMIN: 'admin',
    RECRUITER: 'recruiter',
    CANDIDATE: 'candidate',
  },

  ApplicationStage: {
    APPLIED: 'applied',
    SCREENING: 'screening',
    SCREENED: 'screened',
    SHORTLISTED: 'shortlisted',
    HIRED: 'hired',
    REJECTED: 'rejected',
  },

  Query: {
    me: async (_parent, _args, { user }) => {
      if (!user) return null;
      return User.findById(user.id).populate('companyId');
    },

    jobs: async (_parent, { status }, { user }) => {
      requireAuth(user);
      const filter = { companyId: user.companyId };
      if (status) filter.status = status;
      const jobs = await Job.find(filter).sort({ createdAt: -1 });
      // applicantCount resolved per-job below via field resolver
      return jobs;
    },

    job: async (_parent, { id }, { user }) => {
      requireAuth(user);
      return Job.findOne({ _id: id, companyId: user.companyId });
    },

    applications: async (_parent, { jobId, stage }, { user }) => {
      requireAuth(user);
      const filter = { companyId: user.companyId };
      if (jobId) filter.jobId = jobId;
      if (stage) filter.stage = stage.toLowerCase();
      return Application.find(filter).populate('candidateId').populate('jobId');
    },

    application: async (_parent, { id }, { user }) => {
      requireAuth(user);
      return Application.findOne({ _id: id, companyId: user.companyId })
        .populate('candidateId')
        .populate('jobId');
    },

    // Fetches (or creates + kicks off) the screening session for an application.
    // No auth required here since candidates use this without a recruiter login —
    // in a production app this would use a signed link/token instead. For this
    // project, we scope by applicationId which is unguessable enough for a demo.
    screeningSession: async (_parent, { applicationId }) => {
      const application = await Application.findById(applicationId)
        .populate('candidateId')
        .populate('jobId');
      if (!application) throw new Error('Application not found');

      let session = await ScreeningSession.findOne({ applicationId });

      if (!session) {
        session = await ScreeningSession.create({ applicationId, transcript: [], questionsAsked: 0 });
      }

      // If this is a brand new session with no messages yet, generate the
      // opening AI question so the candidate isn't staring at a blank chat.
      if (session.transcript.length === 0) {
        const openingMessage = await generateNextScreeningMessage({
          job: application.jobId,
          candidate: application.candidateId,
          transcript: [],
          questionsAsked: 0,
        });

        // Stage 4 — bias review pass before this question is stored/shown
        const biasCheck = await checkQuestionForBias(openingMessage);

        session.transcript.push({
          sender: 'ai',
          content: openingMessage,
          flagged: biasCheck.flagged,
          flagReason: biasCheck.reason || null,
        });
        session.questionsAsked = 1;
        await session.save();
      }

      return session;
    },

    // Stage 3 — recruiter co-pilot: semantic search across the whole
    // candidate pool for this company, using Upstash Vector's built-in
    // embedding to match the recruiter's natural-language query against
    // each candidate's embedded skills/experience profile.
    searchCandidates: async (_parent, { query, topK }, { user }) => {
      requireAuth(user);

      const results = await vectorIndex.query({
        data: query,
        topK: topK || 5,
        includeMetadata: true,
        filter: `type = 'candidate' AND companyId = '${user.companyId}'`,
      });

      const hits = [];
      for (const result of results) {
        const candidateId = result.metadata?.candidateId;
        if (!candidateId) continue;

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) continue;

        // Generate the "why this matched" summary using ONLY the redacted
        // profile — keeps the co-pilot's explanations bias-aware too.
        let aiSummary = '';
        try {
          aiSummary = await generateSearchSummary({
            searchQuery: query,
            redactedProfile: candidate.redactedProfile,
          });
        } catch (err) {
          console.error('[searchCandidates] summary generation failed:', err.message);
          aiSummary = 'Matched based on profile similarity to your search.';
        }

        const application = await Application.findOne({ candidateId: candidate._id })
          .populate('candidateId')
          .populate('jobId');

        hits.push({
          candidate,
          application,
          score: result.score,
          aiSummary,
        });
      }

      return hits;
    },

    // Real pipeline funnel + recent activity, replacing the frontend's
    // previously-hardcoded demo numbers.
    dashboardStats: async (_parent, _args, { user }) => {
      requireAuth(user);

      const stageCounts = await Application.aggregate([
        { $match: { companyId: user.companyId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(stageCounts.map((s) => [s._id, s.count]));

      // Funnel is cumulative by design (a "shortlisted" candidate was also
      // "applied" and "screened" at some point), so each stage counts
      // everyone who has reached at least that point in the pipeline.
      const applied =
        (countMap.applied || 0) +
        (countMap.screening || 0) +
        (countMap.screened || 0) +
        (countMap.shortlisted || 0) +
        (countMap.hired || 0);
      const screened = (countMap.screened || 0) + (countMap.shortlisted || 0) + (countMap.hired || 0);
      const shortlisted = (countMap.shortlisted || 0) + (countMap.hired || 0);
      const hired = countMap.hired || 0;

      const funnel = [
        { stage: 'Applied', value: applied },
        { stage: 'Screened', value: screened },
        { stage: 'Shortlisted', value: shortlisted },
        { stage: 'Hired', value: hired },
      ];

      const recent = await Application.find({ companyId: user.companyId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('candidateId')
        .populate('jobId');

      const stageVerb = {
        applied: 'applied to',
        screening: 'started screening for',
        screened: 'completed screening for',
        shortlisted: 'was shortlisted for',
        hired: 'was hired for',
        rejected: 'was rejected for',
      };

      const recentActivity = recent.map((app) => ({
        id: app._id.toString(),
        text: `${app.candidateId?.name || 'A candidate'} ${stageVerb[app.stage] || 'updated status for'} ${app.jobId?.title || 'a role'}`,
        time: timeAgo(app.updatedAt),
        kind: app.stage,
      }));

      return { funnel, recentActivity };
    },
  },

  Mutation: {
    signup: async (_parent, { name, email, password, role, companyName }) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error('An account with this email already exists');

      // NOTE: because of the Role enum mapping above, `role` here already
      // arrives as lowercase ('recruiter'/'admin'/'candidate'), not
      // 'RECRUITER'/'ADMIN'. Compare against the lowercase form.
      let companyId = null;
      if (role === 'recruiter' || role === 'admin') {
        if (!companyName) throw new Error('companyName is required for recruiter/admin signup');
        const company = await Company.create({
          name: companyName,
          slug: slugify(companyName),
        });
        companyId = company._id;
      }

      const user = await User.create({
        name,
        email,
        password,
        role, // already lowercase, matches the User model enum directly
        companyId,
      });

      const token = signToken(user);
      return { token, user };
    },

    login: async (_parent, { email, password }) => {
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw new Error('Invalid email or password');

      const valid = await user.comparePassword(password);
      if (!valid) throw new Error('Invalid email or password');

      const token = signToken(user);
      return { token, user };
    },

    createJob: async (_parent, args, { user }) => {
      requireRole(user, ['recruiter', 'admin']);
      const job = await Job.create({
        companyId: user.companyId,
        title: args.title,
        department: args.department || '',
        description: args.description,
        requiredSkills: args.requiredSkills,
        niceToHaveSkills: args.niceToHaveSkills || [],
        status: 'draft',
      });

      // Embed the job description into the vector index so the screening
      // chat and recruiter co-pilot can retrieve relevant context later.
      // We don't await this in a blocking way that fails job creation —
      // if embedding fails, the job still exists, just not searchable yet.
      const embeddingId = `job:${job._id.toString()}`;
      try {
        await vectorIndex.upsert({
          id: embeddingId,
          data: `${job.title}. ${job.description}. Required skills: ${job.requiredSkills.join(', ')}.`,
          metadata: { type: 'job', jobId: job._id.toString(), companyId: user.companyId },
        });
        job.embeddingId = embeddingId;
        await job.save();
      } catch (err) {
        console.error('[createJob] embedding failed (job still created):', err.message);
      }

      return job;
    },

    updateJobStatus: async (_parent, { jobId, status }, { user }) => {
      requireRole(user, ['recruiter', 'admin']);
      return Job.findOneAndUpdate(
        { _id: jobId, companyId: user.companyId },
        { status },
        { new: true }
      );
    },

    // Stage 1 — file upload + BullMQ resume parsing job goes here
    applyToJob: async () => {
      throw new Error('Not implemented until Stage 1');
    },

    // Stage 2 — RAG-driven screening conversation. Each call: saves the
    // candidate's reply, re-grounds in job + resume context, generates
    // the next AI question (or wraps up if we've hit the target count).
    sendScreeningMessage: async (_parent, { applicationId, content }) => {
      const session = await ScreeningSession.findOne({ applicationId });
      if (!session) throw new Error('Screening session not found — fetch it first to initialize');
      if (session.status !== 'in_progress') throw new Error('This screening session has already ended');

      const application = await Application.findById(applicationId)
        .populate('candidateId')
        .populate('jobId');
      if (!application) throw new Error('Application not found');

      // 1. Save the candidate's message
      session.transcript.push({ sender: 'candidate', content });

      // 2. Generate the next AI turn, grounded in job + resume context every time
      const aiReply = await generateNextScreeningMessage({
        job: application.jobId,
        candidate: application.candidateId,
        transcript: session.transcript,
        questionsAsked: session.questionsAsked,
      });

      // Stage 4 — bias review pass on every generated question, not just the opener
      const biasCheck = await checkQuestionForBias(aiReply);

      session.transcript.push({
        sender: 'ai',
        content: aiReply,
        flagged: biasCheck.flagged,
        flagReason: biasCheck.reason || null,
      });
      session.questionsAsked += 1;

      // 3. Wrap up once we've hit the target — mark completed and advance the pipeline
      if (session.questionsAsked >= TARGET_QUESTIONS) {
        session.status = 'completed';
        await Application.findByIdAndUpdate(applicationId, { stage: 'screened' });
      }

      await session.save();
      return session;
    },

    updateApplicationStage: async (_parent, { applicationId, stage }, { user }) => {
      requireRole(user, ['recruiter', 'admin']);
      return Application.findOneAndUpdate(
        { _id: applicationId, companyId: user.companyId },
        { stage: stage.toLowerCase() },
        { new: true }
      );
    },

    // Stage 3 — explainable match scoring. Deliberately scores against the
    // REDACTED candidate profile (skills + years only, no name/education/etc)
    // so the score can't be influenced by identity-linked signals.
    scoreApplication: async (_parent, { applicationId }, { user }) => {
      requireRole(user, ['recruiter', 'admin']);

      const application = await Application.findOne({ _id: applicationId, companyId: user.companyId })
        .populate('candidateId')
        .populate('jobId');
      if (!application) throw new Error('Application not found');

      const candidate = application.candidateId;
      if (!candidate.redactedProfile || !candidate.redactedProfile.skills?.length) {
        throw new Error('Candidate profile not yet processed — resume structuring may still be in progress');
      }

      const result = await generateMatchExplanation({
        job: application.jobId,
        redactedProfile: candidate.redactedProfile,
      });

      application.matchScore = result.score;
      application.matchExplanation = {
        matchedRequirements: result.matchedRequirements || [],
        gaps: result.gaps || [],
        summary: result.summary || '',
      };
      await application.save();

      return application;
    },
  },

  Job: {
    applicantCount: async (job) => {
      return Application.countDocuments({ jobId: job._id });
    },
  },

  Application: {
    candidate: (application) => application.candidateId,
    job: (application) => application.jobId,
  },

  User: {
    company: (user) => user.companyId,
  },
};

module.exports = resolvers;
