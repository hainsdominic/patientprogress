const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');

const Researcher = require('../../models/Researcher');
const Patient = require('../../models/Patient');
const admin = require('../../middleware/admin');
const researcher = require('../../middleware/researcher');

const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000 * 24, // 1 day
  max: 1, // 1 request per day
  handler: function (req, res) {
    return res.status(429).json({ errors: [{ msg: 'Try again later.' }] });
  },
});

// @route POST api/research/new
// @desc Create a new API key
// @access Admin
router.post(
  '/new',
  [
    admin,
    [
      check('email', 'Please include a valid email').isEmail(),
      check('authorizedIps', 'Please provide an authorized IP').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, authorizedIps } = req.body;

    try {
      const key = crypto.randomBytes(32).toString('hex');

      let researcher = new Researcher({ email, key, authorizedIps });
      await researcher.save();

      res.send(key);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route GET api/research
// @desc Get all anonymized patients
// @access Research API Token
router.get('/', [researcher, rateLimiter], async (req, res) => {
  try {
    const patients = await Patient.find({})
      .populate('professional')
      .select(['-user', '-_id']);

    const anonPatients = patients.map((patient) => {
      patient.name = crypto
        .createHash('sha256')
        .update(patient.name + patient._id)
        .digest('hex');

      patient.professional.patients = undefined;

      return patient;
    });

    res.send(anonPatients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
