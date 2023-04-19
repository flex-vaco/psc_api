const jwt = require('jsonwebtoken');

function verifyJWToken(req, res, next) {
  const token = req.headers?.authorization?.split(' ')[1];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }

    // if everything is good, save user to the request for use in other routes
    req.user = decoded.user;
    next();
  });

}

module.exports = verifyJWToken;