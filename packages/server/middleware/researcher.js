const Researcher = require('../models/Researcher');

module.exports = async function (req, res, next) {
  // Get key from header
  const key = req.header('x-auth-key');

  // Check if no key
  if (!key) {
    return res.status(401).json({ msg: 'No key, auth denied' });
  }

  // Verify key and ip
  try {
    const researcher = await Researcher.findOne({ key: key });
    const ip = req.header('x-forwarded-for') || req.socket.remoteAddress;

    console.log(ip);

    if (researcher && researcher.authorizedIps.includes(ip)) {
      next();
    } else {
      res.status(401).json({ msg: 'Permission denied' });
    }
  } catch (err) {
    res.status(401).json({ msg: 'Key is not valid' });
  }
};
