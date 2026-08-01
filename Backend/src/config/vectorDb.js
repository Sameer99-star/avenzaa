const { Index } = require('@upstash/vector');

// Since our index was created with the openai/text-embedding-3-small
// built-in embedding model, we upsert and query raw text ("data" field)
// directly — Upstash handles the vectorization server-side. No need to
// call an embeddings API ourselves.
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

module.exports = vectorIndex;
