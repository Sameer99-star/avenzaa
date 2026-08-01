const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null on the connection —
// without this, BullMQ throws an error on startup. This is a BullMQ-specific
// requirement, not an Upstash quirk.
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

module.exports = connection;
