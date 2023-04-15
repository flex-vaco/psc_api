const jwt = require('jsonwebtoken');
const secret_key = process.env.JWT_SECRET || 'fract-api-jwt-secrect';

function verifyJWToken(req, res, next) {
  const token = req.headers?.authorization?.split(' ')[1];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, secret_key, function (err, decoded) {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }

    // if everything is good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });

}

module.exports = verifyJWToken;