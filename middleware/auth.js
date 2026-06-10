const jwt = require('jsonwebtoken');

// ══════════════════════════════════════════════
// JWT TOKEN VERIFY MIDDLEWARE
// Protected routes ma use garus
// ══════════════════════════════════════════════
function authMiddleware(req, res, next) {
  try {
    // Token header vaa cookie bata linchhau
    const authHeader = req.headers['authorization'];
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Login garera aaunus' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'restaurant_secret_key');
    req.user = decoded;   // { id, username, role }
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expire bhayo, pheri login garus' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// ══════════════════════════════════════════════
// ROLE CHECK MIDDLEWARE
// Usage: roleMiddleware('admin')
// ══════════════════════════════════════════════
function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}

// ══════════════════════════════════════════════
// GENERATE TOKEN
// ══════════════════════════════════════════════
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'restaurant_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// Export the middleware function itself as the default so that
// `const auth = require('./auth')` works directly as Express middleware.
// Named exports are attached so destructured imports also work:
//   const { verifyToken } = require('./auth')
//   const { authMiddleware, roleMiddleware } = require('./auth')
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.verifyToken    = authMiddleware;   // alias used by many routes
module.exports.roleMiddleware = roleMiddleware;
module.exports.generateToken  = generateToken;
