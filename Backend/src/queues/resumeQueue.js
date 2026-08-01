const { Queue } = require('bullmq');
const connection = require('../config/redis');

const resumeQueue = new Queue('resume-processing', { connection });

module.exports = resumeQueue;
