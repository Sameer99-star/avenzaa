const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      companyId: user.companyId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Called on every GraphQL request to build the context object.
// Returns null if there's no/invalid token — resolvers decide what
// to do with an unauthenticated request (public queries vs protected ones).
function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Simple guard resolvers can call at the top of protected mutations/queries.
function requireAuth(contextUser) {
  if (!contextUser) {
    const error = new Error('Not authenticated');
    error.code = 'UNAUTHENTICATED';
    throw error;
  }
  return contextUser;
}

function requireRole(contextUser, allowedRoles) {
  requireAuth(contextUser);
  if (!allowedRoles.includes(contextUser.role)) {
    const error = new Error('Not authorized for this action');
    error.code = 'FORBIDDEN';
    throw error;
  }
  return contextUser;
}

module.exports = { signToken, getUserFromRequest, requireAuth, requireRole };
