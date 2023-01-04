const express = require('express');
const router = express.Router();

const scoreCalculator = require('../../scoreCalculator').scoreCalculator;

const Questionnaire = require('../../models/Questionnaire');
const Patient = require('../../models/Patient');

const admin = require('../../middleware/admin');
const auth = require('../../middleware/auth');
const patient = require('../../middleware/patient');
const professional = require('../../middleware/professional');

// @route GET api/questionnaires
// @desc Get all questionnaires
// @access Admin
router.get('/', admin, async (req, res) => {
  try {
    const questionnaires = await Questionnaire.find();
    res.json(questionnaires);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/questionnaires/list
// @desc Get all questionnaires in list format
// @access Professional
router.get('/list', professional, async (req, res) => {
  try {
    let questionnaires = await Questionnaire.find();
    questionnaires = questionnaires.map(({ _id, title, language, schema }) => {
      return { id: _id, title, displayTitle: schema.title, language };
    });
    res.json(questionnaires);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route POST api/questionnaires
// @desc Create new questionnaire
// @access Admin
router.post('/', admin, async (req, res) => {
  try {
    const { schema, uischema, title } = req.body;
    const newQuestionnaire = new Questionnaire({ schema, uischema, title });
    const questionnaire = await newQuestionnaire.save();
    res.status(201).json(questionnaire);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route GET api/questionnaires/:id
// @desc Get questionnaire by ID
// @access auth
router.get('/:id', auth, async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ msg: 'Questionnaire not found' });
    }

    res.json(questionnaire);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Questionnaire not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route POST api/questionnaires/:id
// @desc Post filled questionnaire
// @access patient
router.post('/:id', patient, async (req, res) => {
  try {
    const { title, data, time } = req.body;

    var completedQuestionnaire = {
      questionnaire: req.params.id,
      time: new Date(),
      answers: data,
      title,
      score: scoreCalculator(title, data),
      timeToComplete: time,
    };

    const patient = await Patient.findOne({ user: req.user.id });

    patient.questionnairesToFill.splice(
      patient.questionnairesToFill
        .map((q) => q.questionnaire)
        .indexOf(req.params.id),
      1
    );

    if (title === 'Initial Intake Form') {
      let questionnairesToSend = [];

      let questionnaires = await Questionnaire.find();

      let questionnaireList = questionnaires.map(({ _id, title, language }) => {
        return { id: _id, title, language };
      });

      const getQuestionnaireId = (title) => {
        const foundQ = questionnaireList.find(
          (q) => q.title === title && q.language === patient.language
        );

        if (foundQ) {
          return foundQ.id;
        } else {
          return questionnaireList.find(
            (q) => q.title === title && q.language === 'en'
          ).id;
        }
      };

      const lowerBack = ['57', '58', '59', '60', '61', '62', '63', '64'];
      const neck = ['5', '6', '39', '40', '41', '42', '43', '44', '55', '56'];
      const upperLimb = [
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '45',
        '46',
        '47',
        '48',
        '49',
        '50',
        '51',
        '52',
        '53',
        '54',
      ];
      const lowerLimb = [
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
        '65',
        '66',
        '67',
        '68',
        '69',
        '70',
        '71',
        '72',
        '73',
        '74',
      ];

      if (data.relatedPainAreas.some((item) => lowerBack.includes(item))) {
        questionnairesToSend.push(
          getQuestionnaireId('Oswestry Disability Index'),
          getQuestionnaireId('The Keele STarT Back Screening Tool')
        );
      } else if (data.relatedPainAreas.some((item) => neck.includes(item))) {
        questionnairesToSend.push(
          getQuestionnaireId('Neck Disability Index'),
          getQuestionnaireId('Modified MSK STarT Back Screening Tool')
        );
      } else if (
        data.relatedPainAreas.some((item) => upperLimb.includes(item))
      ) {
        questionnairesToSend.push(
          getQuestionnaireId('QuickDASH'),
          getQuestionnaireId('Modified MSK STarT Back Screening Tool')
        );
      } else if (
        data.relatedPainAreas.some((item) => lowerLimb.includes(item))
      ) {
        questionnairesToSend.push(
          getQuestionnaireId('Lower Extremity Functional Scale (LEFS)'),
          getQuestionnaireId('Modified MSK STarT Back Screening Tool')
        );
      } else {
        questionnairesToSend.push(
          getQuestionnaireId('Modified MSK STarT Back Screening Tool')
        );
      }

      const questionnairesToSend30DaysAfter = [
        getQuestionnaireId('Brief Pain Inventory'),
        getQuestionnaireId('Follow-up questionnaire'),
        ...questionnairesToSend,
      ];

      questionnairesToSend30DaysAfter.forEach((id) => {
        patient.questionnairesToFill.push({
          questionnaire: id,
          date: new Date(new Date().setDate(new Date().getDate() + 30)),
          sent: false,
        });
      });

      questionnairesToSend.forEach((id) => {
        patient.questionnairesToFill.push({
          questionnaire: id,
          date: new Date(),
          sent: true,
        });
      });
    }

    patient.questionnaires.push(completedQuestionnaire);

    await patient.save();

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Questionnaire not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
    console.error(err);
  }
});

// @route POST api/questionnaires/:id
// @desc Post filled questionnaire by professional
// @access professional
router.post('/:id/professional', professional, async (req, res) => {
  try {
    const { title, data, time, questionnaireId } = req.body;

    const completedQuestionnaire = {
      questionnaire: questionnaireId,
      time: new Date(),
      answers: data,
      title,
      score: scoreCalculator(title, data),
      timeToComplete: time,
    };

    const patient = await Patient.findById(req.params.id);

    patient.questionnairesToFill.splice(
      patient.questionnairesToFill
        .map((q) => q.questionnaire)
        .indexOf(req.params.id),
      1
    );

    patient.questionnaires.push(completedQuestionnaire);

    await patient.save();

    res.json(patient);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Questionnaire not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
    console.error(err);
  }
});

module.exports = router;
