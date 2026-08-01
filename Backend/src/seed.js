// Seed script for demo data. Run with: node src/seed.js
// Populates realistic jobs + candidates + applications directly into MongoDB
// and embeds them into Upstash Vector, without needing to manually upload
// PDFs one at a time through the API.

require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const Job = require('./models/Job');
const Candidate = require('./models/Candidate');
const Application = require('./models/Application');
const vectorIndex = require('./config/vectorDb');
const { generateMatchExplanation } = require('./utils/matching');

const JOBS = [
  {
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    description:
      'We are looking for a Senior Backend Engineer to design and scale our core APIs. You will work with Node.js, GraphQL, and MongoDB to build reliable, high-throughput systems, and mentor junior engineers on the team.',
    requiredSkills: ['Node.js', 'MongoDB', 'GraphQL', 'Docker', 'System Design'],
    niceToHaveSkills: ['Kubernetes', 'Redis', 'AWS'],
  },
  {
    title: 'Product Designer',
    department: 'Design',
    description:
      'We need a Product Designer to own end-to-end design for our web and mobile products, from user research through high-fidelity prototypes, working closely with engineering and product.',
    requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    niceToHaveSkills: ['Motion Design', 'Front-end basics'],
  },
  {
    title: 'Data Analyst',
    department: 'Analytics',
    description:
      'Looking for a Data Analyst to build dashboards, run SQL analyses, and partner with product teams to turn data into decisions. Strong SQL and visualization skills required.',
    requiredSkills: ['SQL', 'Python', 'Data Visualization', 'Excel'],
    niceToHaveSkills: ['dbt', 'Looker', 'A/B Testing'],
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    description:
      'We are hiring a DevOps Engineer to own our CI/CD pipelines, Kubernetes infrastructure, and observability stack, working closely with backend teams to keep deploys fast and safe.',
    requiredSkills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],
    niceToHaveSkills: ['Prometheus', 'Grafana', 'Go'],
  },
];

const CANDIDATES = [
  {
    name: 'Amelia Andersen', email: 'amelia.andersen@example.com',
    skills: ['Node.js', 'MongoDB', 'Express', 'React'], yearsExperience: 5,
    education: 'B.Tech Computer Science, IIT Delhi', noticePeriodDays: 30, jobIndex: 0, stage: 'applied',
  },
  {
    name: 'Diego Salim', email: 'diego.salim@example.com',
    skills: ['Node.js', 'MongoDB', 'GraphQL', 'Docker', 'Kubernetes'], yearsExperience: 6,
    education: 'M.S. Computer Science, Warsaw University', noticePeriodDays: 15, jobIndex: 0, stage: 'screened',
  },
  {
    name: 'Sana Chen', email: 'sana.chen@example.com',
    skills: ['Node.js', 'MongoDB', 'GraphQL', 'Docker', 'System Design', 'AWS'], yearsExperience: 7,
    education: 'B.Tech Computer Science, NTU Singapore', noticePeriodDays: 45, jobIndex: 0, stage: 'shortlisted',
  },
  {
    name: 'Noah Ahmed', email: 'noah.ahmed@example.com',
    skills: ['Figma', 'User Research', 'Prototyping'], yearsExperience: 4,
    education: 'B.Des, National Institute of Design', noticePeriodDays: 20, jobIndex: 1, stage: 'applied',
  },
  {
    name: 'Fatima Weber', email: 'fatima.weber@example.com',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Motion Design'], yearsExperience: 8,
    education: 'MFA Design, Rhode Island School of Design', noticePeriodDays: 60, jobIndex: 1, stage: 'shortlisted',
  },
  {
    name: 'Priya Tanaka', email: 'priya.tanaka@example.com',
    skills: ['SQL', 'Python', 'Excel'], yearsExperience: 2,
    education: 'B.Sc Statistics, University of Amsterdam', noticePeriodDays: 30, jobIndex: 2, stage: 'screened',
  },
  {
    name: 'Ines Silva', email: 'ines.silva@example.com',
    skills: ['SQL', 'Python', 'Data Visualization', 'dbt', 'Looker'], yearsExperience: 4,
    education: 'M.S. Data Science, Sorbonne University', noticePeriodDays: 30, jobIndex: 2, stage: 'shortlisted',
  },
  {
    name: 'Kenji Kapoor', email: 'kenji.kapoor@example.com',
    skills: ['Docker', 'CI/CD', 'AWS'], yearsExperience: 3,
    education: 'B.Tech Electronics, Berlin Institute of Technology', noticePeriodDays: 15, jobIndex: 3, stage: 'applied',
  },
  {
    name: 'Marcus Duarte', email: 'marcus.duarte@example.com',
    skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS', 'Prometheus'], yearsExperience: 6,
    education: 'B.Sc Computer Science, University College London', noticePeriodDays: 45, jobIndex: 3, stage: 'hired',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding');

  // 1. Company + recruiter (reuse if already exists)
  let company = await Company.findOne({ slug: 'avenza-demo-co' });
  if (!company) {
    company = await Company.create({ name: 'Avenza Demo Co', slug: 'avenza-demo-co', plan: 'pro' });
    console.log('Created demo company');
  }

  let recruiter = await User.findOne({ email: 'demo@avenza.com' });
  if (!recruiter) {
    recruiter = await User.create({
      name: 'Demo Recruiter',
      email: 'demo@avenza.com',
      password: 'demo1234',
      role: 'recruiter',
      companyId: company._id,
    });
    console.log('Created demo recruiter (login: demo@avenza.com / demo1234)');
  }

  // 2. Jobs — create + embed each
  const createdJobs = [];
  for (const jobData of JOBS) {
    let job = await Job.findOne({ companyId: company._id, title: jobData.title });
    if (!job) {
      job = await Job.create({
        companyId: company._id,
        title: jobData.title,
        department: jobData.department,
        description: jobData.description,
        requiredSkills: jobData.requiredSkills,
        niceToHaveSkills: jobData.niceToHaveSkills,
        status: 'open',
      });

      const embeddingId = `job:${job._id.toString()}`;
      await vectorIndex.upsert({
        id: embeddingId,
        data: `${job.title}. ${job.description}. Required skills: ${job.requiredSkills.join(', ')}.`,
        metadata: { type: 'job', jobId: job._id.toString(), companyId: company._id.toString() },
      });
      job.embeddingId = embeddingId;
      await job.save();
      console.log(`Created + embedded job: ${job.title}`);
    }
    createdJobs.push(job);
  }

  // 3. Candidates — create + embed + application, each linked to a job
  for (const c of CANDIDATES) {
    let candidate = await Candidate.findOne({ companyId: company._id, email: c.email });
    if (!candidate) {
      const structuredProfile = {
        skills: c.skills,
        yearsExperience: c.yearsExperience,
        education: c.education,
        noticePeriodDays: c.noticePeriodDays,
      };
      const redactedProfile = {
        anonymizedId: '', // set after we know the _id
        skills: c.skills,
        yearsExperience: c.yearsExperience,
      };

      candidate = await Candidate.create({
        companyId: company._id,
        name: c.name,
        email: c.email,
        resumeUrl: 'https://example.com/demo-resume.pdf', // placeholder — no real file for seeded data
        resumeText: `${c.name}. Skills: ${c.skills.join(', ')}. ${c.yearsExperience} years experience. ${c.education}.`,
        structuredProfile,
        redactedProfile,
      });

      candidate.redactedProfile.anonymizedId = `Candidate #${candidate._id.toString().slice(-4)}`;

      const embeddingId = `candidate:${candidate._id.toString()}`;
      await vectorIndex.upsert({
        id: embeddingId,
        data: `Skills: ${c.skills.join(', ')}. Experience: ${c.yearsExperience} years. Education: ${c.education}.`,
        metadata: { type: 'candidate', candidateId: candidate._id.toString(), companyId: company._id.toString() },
      });
      candidate.embeddingId = embeddingId;
      await candidate.save();

      const job = createdJobs[c.jobIndex];
      const application = await Application.create({
        companyId: company._id,
        candidateId: candidate._id,
        jobId: job._id,
        stage: c.stage,
      });

      // Score immediately so the demo doesn't show blank/zero match scores
      try {
        const result = await generateMatchExplanation({ job, redactedProfile: candidate.redactedProfile });
        application.matchScore = result.score;
        application.matchExplanation = {
          matchedRequirements: result.matchedRequirements || [],
          gaps: result.gaps || [],
          summary: result.summary || '',
        };
        await application.save();
      } catch (err) {
        console.error(`  (scoring failed for ${c.name}, will show 0 for now):`, err.message);
      }

      console.log(`Created + embedded + scored candidate: ${c.name} -> ${job.title} (${c.stage})`);
    }
  }

  console.log('\nSeeding complete.');

  // Catch-up pass: score any applications that exist but weren't scored yet
  // (e.g. from an earlier seed run before this scoring step was added).
  const unscored = await Application.find({ companyId: company._id, matchScore: null })
    .populate('candidateId')
    .populate('jobId');
  if (unscored.length > 0) {
    console.log(`\nScoring ${unscored.length} existing unscored application(s)...`);
    for (const app of unscored) {
      try {
        const result = await generateMatchExplanation({
          job: app.jobId,
          redactedProfile: app.candidateId.redactedProfile,
        });
        app.matchScore = result.score;
        app.matchExplanation = {
          matchedRequirements: result.matchedRequirements || [],
          gaps: result.gaps || [],
          summary: result.summary || '',
        };
        await app.save();
        console.log(`  Scored: ${app.candidateId.name} -> ${result.score}`);
      } catch (err) {
        console.error(`  Failed to score ${app.candidateId.name}:`, err.message);
      }
    }
  }

  console.log('Demo recruiter login: demo@avenza.com / demo1234');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
