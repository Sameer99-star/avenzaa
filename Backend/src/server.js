require('dotenv').config();
const express = require('express');
const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');

const connectDB = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUserFromRequest } = require('./middleware/auth');
const applicationRoutes = require('./routes/applicationRoutes');
require('./workers/resumeWorker'); // starts listening for queued jobs on import

async function startServer() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // File uploads (resume PDFs) go through REST, not GraphQL —
  // GraphQL doesn't handle multipart/form-data well without extra plumbing.
  app.use('/api/applications', applicationRoutes);

  const httpServer = http.createServer(app);

  // Socket.io attaches to this same httpServer in Stage 2 —
  // const { Server } = require('socket.io');
  // const io = new Server(httpServer, { cors: { origin: '*' } });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      user: getUserFromRequest(req), // { id, role, companyId } or null
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer();
