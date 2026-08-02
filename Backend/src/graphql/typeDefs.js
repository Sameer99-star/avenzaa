const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar JSON

  enum Role {
    ADMIN
    RECRUITER
    CANDIDATE
  }

  enum ApplicationStage {
    APPLIED
    SCREENING
    SCREENED
    SHORTLISTED
    HIRED
    REJECTED
  }

  type Company {
    id: ID!
    name: String!
    slug: String!
    industry: String
    plan: String!
    createdAt: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    company: Company
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Job {
    id: ID!
    title: String!
    department: String
    description: String!
    requiredSkills: [String!]!
    niceToHaveSkills: [String!]!
    status: String!
    applicantCount: Int!
    createdAt: String!
  }

  type StructuredProfile {
    skills: [String!]!
    yearsExperience: Int!
    education: String
    noticePeriodDays: Int
  }

  type RedactedProfile {
    anonymizedId: String!
    skills: [String!]!
    yearsExperience: Int!
  }

  type Candidate {
    id: ID!
    name: String!
    email: String!
    resumeUrl: String!
    location: String
    currentCompany: String
    structuredProfile: StructuredProfile
    redactedProfile: RedactedProfile
  }

  type MatchExplanation {
    matchedRequirements: [String!]!
    gaps: [String!]!
    summary: String!
  }

  type Application {
    id: ID!
    candidate: Candidate!
    job: Job!
    stage: ApplicationStage!
    matchScore: Float
    matchExplanation: MatchExplanation
    createdAt: String!
  }

  type ScreeningMessage {
    sender: String!
    content: String!
    timestamp: String!
    flagged: Boolean!
    flagReason: String
  }

  type ScreeningSession {
    id: ID!
    status: String!
    transcript: [ScreeningMessage!]!
    questionsAsked: Int!
  }

  type CandidateSearchHit {
    candidate: Candidate!
    application: Application
    score: Float!
    aiSummary: String!
  }

  type Query {
    me: User
    jobs(status: String): [Job!]!
    job(id: ID!): Job
    applications(jobId: ID, stage: ApplicationStage): [Application!]!
    application(id: ID!): Application
    screeningSession(applicationId: ID!): ScreeningSession
    # Stage 3 — recruiter co-pilot: semantic search across the whole candidate pool
    searchCandidates(query: String!, topK: Int): [CandidateSearchHit!]!
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!, role: Role!, companyName: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createJob(
      title: String!
      department: String
      description: String!
      requiredSkills: [String!]!
      niceToHaveSkills: [String!]
    ): Job!

    updateJobStatus(jobId: ID!, status: String!): Job!

    # Stage 1 — resume upload kicks off async parsing via the job queue
    applyToJob(jobId: ID!, name: String!, email: String!, resumeFile: String!): Application!

    # Stage 2 — screening chat, one turn at a time
    sendScreeningMessage(applicationId: ID!, content: String!): ScreeningSession!

    updateApplicationStage(applicationId: ID!, stage: ApplicationStage!): Application!

    # Stage 3 — explainable, bias-aware match scoring (uses redacted profile)
    scoreApplication(applicationId: ID!): Application!
  }
`;

module.exports = typeDefs;
