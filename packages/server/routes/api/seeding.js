const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const faker = require('faker');

const User = require('../../models/User');
const Professional = require('../../models/Professional');
const Patient = require('../../models/Patient');

const admin = require('../../middleware/admin');

// @route POST api/seeding/:professional_id
// @desc Register patient: creates user and patient file
// @access Admin
router.post('/:professional_id', admin, async (req, res) => {
  try {
    const createPatient = async () => {
      const email = faker.internet.email().toLowerCase();
      const password = faker.internet.password();
      const name = faker.name.findName();
      const dob = faker.date.between('1930-01-01', '2021-07-01');
      const gender =
        Math.random() > 0.9
          ? faker.name.gender()
          : Math.random() > 0.5
          ? 'Male'
          : 'Female';
      const language = 'en';
      const research = true;
      const professional = req.params.professional_id;

      let professionalFound = await Professional.findById(professional);

      if (!professionalFound) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid professional ID' }] });
      }

      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        type: 'patient',
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      let patient = new Patient({
        name,
        dob,
        gender,
        language,
        research,
        user: user.id,
        professional,
        questionnairesToFill: [],
      });

      user.patientId = patient.id;

      await patient.save();
      await user.save();

      //add patientId to professionals patients
      professionalFound.patients.push(patient.id);

      await professionalFound.save();
    };

    for (let index = 0; index < 50; index++) {
      await createPatient();
    }

    res.send('Done');
  } catch (err) {
    res.status(500).send('Server error');
    console.log(err.message);
  }
});

router.put('/:professional_id', admin, async (req, res) => {
  try {
    const BPI = {
      _id: '60dd3d78e893141600b7e846',
      questionnaire: '609da83d6c1c1266606a69e7',

      time: '2021-07-01T03:58:48.231Z',

      answers: {
        BPIPainWorst: Math.floor(Math.random() * 10) + 1,
        BPIPainLeast: Math.floor(Math.random() * 10) + 1,
        BPIPainAverage: Math.floor(Math.random() * 10) + 1,
        BPIPainNow: Math.floor(Math.random() * 10) + 1,
        BPIGeneralActivity: Math.floor(Math.random() * 10) + 1,
        BPIMood: Math.floor(Math.random() * 10) + 1,
        BPIWalking: Math.floor(Math.random() * 10) + 1,
        BPIWork: Math.floor(Math.random() * 10) + 1,
        BPIRelations: Math.floor(Math.random() * 10) + 1,
        BPISleep: Math.floor(Math.random() * 10) + 1,
        BPIEnjoyment: Math.floor(Math.random() * 10) + 1,
      },
      title: 'Brief Pain Inventory',
      score: [
        {
          _id: '60dd3d78e893141600b7e847',

          title: 'pain',
          value: `${Math.floor(Math.random() * 40) + 1}/40`,
        },
        {
          _id: '60dd3d78e893141600b7e848',

          title: 'interference',
          value: `${Math.floor(Math.random() * 70) + 1}/70`,
        },
        {
          _id: '60dd3d78e893141600b7e849',

          title: 'activityInterference',
          value: `${Math.floor(Math.random() * 40) + 1}/40`,
        },
        {
          _id: '60dd3d78e893141600b7e84a',

          title: 'affectiveInterference',
          value: `${Math.floor(Math.random() * 30) + 1}/30`,
        },
      ],
    };

    const editPatient = async (id) => {
      let patient = await Patient.findById(id);
      patient.questionnaires = [BPI];
      await patient.save();
    };

    let professionalFound = await Professional.findById(
      req.params.professional_id
    );

    for (let index = 0; index < professionalFound.patients.length; index++) {
      await editPatient(professionalFound.patients[index]);
    }

    res.send('Done');
  } catch (err) {
    res.status(500).send('Server error');
    console.log(err.message);
  }
});

router.put('/:professional_id/gender', admin, async (req, res) => {
  try {
    const editPatient = async (id) => {
      let patient = await Patient.findById(id);
      patient.gender =
        Math.random() > 0.9
          ? faker.name.gender()
          : Math.random() > 0.5
          ? 'Male'
          : 'Female';
      await patient.save();
    };

    let professionalFound = await Professional.findById(
      req.params.professional_id
    );

    for (let index = 0; index < professionalFound.patients.length; index++) {
      await editPatient(professionalFound.patients[index]);
    }

    res.send('Done');
  } catch (err) {
    res.status(500).send('Server error');
    console.log(err.message);
  }
});

router.put('/:professional_id/dob', admin, async (req, res) => {
  try {
    const editPatient = async (id) => {
      let patient = await Patient.findById(id);
      patient.dob = faker.date.between('1930-01-01', '2021-07-01');
      await patient.save();
    };

    let professionalFound = await Professional.findById(
      req.params.professional_id
    );

    for (let index = 0; index < professionalFound.patients.length; index++) {
      await editPatient(professionalFound.patients[index]);
    }

    res.send('Done');
  } catch (err) {
    res.status(500).send('Server error');
    console.log(err.message);
  }
});

router.delete('/patients', admin, async (req, res) => {
  try {
    const patients = await Patient.find({
      professional: '60ddfcaa836d609d45d25783',
    });

    patients.forEach((patient) => {
      (async () => {
        await Patient.deleteOne({ _id: patient._id });
        await User.deleteOne({ _id: patient.user });
      })();
    });

    res.send('Done');
  } catch (err) {
    res.status(500).send('Server error');
    console.log(err.message);
  }
});

module.exports = router;
