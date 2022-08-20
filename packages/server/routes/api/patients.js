const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const config = require('config');

const Professional = require('../../models/Professional');
const Patient = require('../../models/Patient');
const User = require('../../models/User');

const admin = require('../../middleware/admin');
const auth = require('../../middleware/auth');
const professional = require('../../middleware/professional');
const patient = require('../../middleware/patient');

// @route GET api/patients
// @desc Get all patients
// @access Admin
router.get('/', admin, async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/patients/me
// @desc Get logged in patient's profile
// @access Patient
router.get('/me', patient, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).populate(
      'user professional questionnairesToFill.questionnaire'
    );
    patient.professional.patients = undefined;
    patient.professional.user = undefined;
    patient.professional.profile = undefined;
    patient.professional.yearOfBirth = undefined;
    patient.user = undefined;
    patient.questionnaires = undefined;
    patient.reports = undefined;
    patient.reEvaluationReports = undefined;
    patient.questionnairesToFill = patient.questionnairesToFill.filter(
      (questionnaire) => questionnaire.sent
    );

    res.json(patient);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/patients/all
// @desc Get all patients of a professional
// @access professional
router.get('/all', professional, async (req, res) => {
  try {
    const currentProfessional = await Professional.findOne({
      user: req.user.id,
    }).populate('patients patients.questionnaires');

    // map or filter through
    res.json(currentProfessional.patients);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/patients/short
// @desc Get all patients of a professional but only name, dob and id for optimisation
// @access professional
router.get('/short', professional, async (req, res) => {
  try {
    const currentProfessional = await Professional.findOne({
      user: req.user.id,
    }).populate('patients');
    let liste = currentProfessional.patients.map(({ id, name, dob }) => ({
      id,
      name,
      dob,
    }));
    res.json(liste);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/patients/:id
// @desc Get patient by ID
// @access professional
router.get('/:id', professional, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate({
      path: 'questionnaires.questionnaire',
    });

    const currentUser = await User.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    if (
      patient.professional.toString() != currentUser.professionalId.toString()
    ) {
      return res.status(400).json({ msg: 'Permission denied' });
    }

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Patient not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route PUT api/patients/
// @desc Update logged in patient's profile
// @access patient
router.put(
  '/',
  [
    patient,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('dob', 'Enter a valid date following the YYYY-MM-DD format')
        .isISO8601()
        .toDate(),
      check('language', 'Language is required').not().isEmpty(),
      check('dataConsent', 'Data consent is required').isBoolean(),
      check(
        'participantConsent',
        'Participant consent is required'
      ).isBoolean(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dob, language, dataConsent, participantConsent } = req.body;

    try {
      const patient = await Patient.findOne({ user: req.user.id });

      patient.name = name;
      patient.dob = dob;
      patient.language = language;
      patient.dataConsent = dataConsent;
      patient.participantConsent = participantConsent;
      patient.research = dataConsent && participantConsent;

      await patient.save();

      res.json(patient);
    } catch (err) {
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

// @route POST api/patients/:id/questionnaireToFill
// @desc Add a questionnaire to fill to a patient by ID
// @access professional
router.post('/:id/questionnaireToFill', professional, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const patient = await Patient.findById(req.params.id).populate({
      path: 'questionnaires.questionnaire',
    });
    const patientUser = await User.findById(patient.user);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    if (
      patient.professional.toString() != currentUser.professionalId.toString()
    ) {
      return res.status(403).json({ msg: 'Permission denied' });
    }

    const { questionnairesToFill } = req.body;

    patient.questionnairesToFill.push(...questionnairesToFill);

    if (questionnairesToFill.find((questionnaire) => questionnaire.sent)) {
      // Send a email notification
      const transporter = nodemailer.createTransport({
        host: config.get('nodemailerHost'),
        port: config.get('nodemailerPort'),
        secure: true,
        auth: {
          user: config.get('nodemailerUser'),
          pass: config.get('nodemailerPass'),
        },
      });

      let message = '';
      let subject = '';
      switch (patient.language) {
        case 'en':
          message = `<p>Dear Patient,</p><p>Your chiropractor needs you to fill out a few questionnaires prior to your next consultation.</p><p>Please <a href="https://${process.env.INSTANCE}.patientprogress.ca/login">sign into the PatientProgress web application</a> as soon as possible to fill them out.</p><br><p>Thank you,</p><br><p>The PatientProgress Team</p>`;
          subject = 'New questionnaire to fill out';
          break;
        case 'fr':
          message = `<p>Cher.ère patient.e,</p><p>Votre chiropraticien.ne vous demande de remplir quelques questionnaires avant votre prochaine consultation.</p><p>Veuillez <a href="https://${process.env.INSTANCE}.patientprogress.ca/login"> vous connecter</a> dès que possible afin de les remplir.</p><br><p>Merci beaucoup,</p><br><p>L'équipe PatientProgress</p>`;
          subject = 'Nouveau Questionnaire à remplir';
          break;

        default:
          break;
      }

      const emailContent = {
        from: '"PatientProgress" <no-reply@hainstech.com>',
        to: patientUser.email,
        subject: subject,
        html: message,
      };

      transporter.sendMail(emailContent);
    }

    await patient.save();

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Object error' });
    }
    console.log(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route POST api/patients/:id/report
// @desc Add a report to a patient by ID
// @access professional
router.post('/:id/report', professional, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const patient = await Patient.findById(req.params.id).populate({
      path: 'questionnaires.questionnaire',
    });

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    if (
      patient.professional.toString() != currentUser.professionalId.toString()
    ) {
      return res.status(403).json({ msg: 'Permission denied' });
    }

    patient.reports.push(req.body.report);

    // send a BPI to fill in 2 weeks
    let currentTime = new Date();
    currentTime.setDate(currentTime.getDate() + 14);
    let questionnaire = {
      questionnaire: null,
      date: currentTime,
      sent: false,
    };

    if (patient.language == 'fr') {
      questionnaire.questionnaire = '609da91b6c1c1266606a69e8';
    } else {
      // falls back to english
      questionnaire.questionnaire = '609da83d6c1c1266606a69e7';
    }

    patient.questionnairesToFill.push(questionnaire);

    await patient.save();

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Object error' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route POST api/patients/:id/reevaluationreport
// @desc Add a re-evaluation report to a patient by ID
// @access professional
router.post('/:id/reevaluationreport', professional, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const patient = await Patient.findById(req.params.id).populate({
      path: 'questionnaires.questionnaire',
    });

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    if (
      patient.professional.toString() != currentUser.professionalId.toString()
    ) {
      return res.status(403).json({ msg: 'Permission denied' });
    }

    patient.reEvaluationReports.push(req.body.report);

    await patient.save();

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Object error' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route delete api/patients/questionnairesToFill/:id
// @desc Remove a questionnaire to fill
// @access professional
router.delete(
  '/questionnairesToFill/:patient/:id',
  professional,
  async (req, res) => {
    try {
      const currentUser = await User.findById(req.user.id);
      const patient = await Patient.findById(req.params.patient).populate({
        path: 'questionnaires.questionnaire',
      });

      if (!patient) {
        return res.status(404).json({ msg: 'Patient not found' });
      }

      if (
        patient.professional.toString() != currentUser.professionalId.toString()
      ) {
        return res.status(403).json({ msg: 'Permission denied' });
      }

      patient.questionnairesToFill.splice(
        patient.questionnairesToFill.map((q) => q._id).indexOf(req.params.id),
        1
      );

      await patient.save();

      res.json(patient);
    } catch (err) {
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

module.exports = router;
