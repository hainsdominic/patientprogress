import axios from 'axios';
import { setAlert } from './alert';
import i18n from '../i18n';

const prefix = process.env.REACT_APP_BETA ? 'beta.' : '';
const URI =
  process.env.NODE_ENV === 'production'
    ? `https://${prefix}api.patientprogress.ca`
    : '';

// Get questionnaire with the params id
export const getQuestionnaire = (id) => async (dispatch) => {
  try {
    const res = await axios.get(`${URI}/api/questionnaires/${id}`);
    return res.data;
  } catch (err) {
    console.log(err);
  }
};

export const createQuestionnaire = (schema, uischema) => async (dispatch) => {
  try {
    const config = {
      hearders: {
        'Content-Type': 'application/json',
      },
    };

    const questionnaire = {
      schema,
      uischema,
      title: schema.title,
    };

    await axios.post(`${URI}/api/questionnaires`, questionnaire, config);

    dispatch(setAlert('Questionnaire created', 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

export const addQuestionnaire =
  (history, id, title, data, time) => async (dispatch) => {
    try {
      const config = {
        hearders: {
          'Content-Type': 'application/json',
        },
      };

      const questionnaire = {
        title,
        data,
        time,
      };

      await axios.post(
        `${URI}/api/questionnaires/${id}`,
        questionnaire,
        config
      );

      dispatch(setAlert(i18n.t('alert.questionnaireFilled'), 'success'));

      history.push('/patient/questionnaires');
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

export const addQuestionnaireFilledByProfessional =
  (history, id, title, data, time, questionnaireId) => async (dispatch) => {
    try {
      const config = {
        hearders: {
          'Content-Type': 'application/json',
        },
      };

      const questionnaire = {
        title,
        data,
        time,
        questionnaireId,
      };

      await axios.post(
        `${URI}/api/questionnaires/${id}/professional`,
        questionnaire,
        config
      );

      dispatch(setAlert(i18n.t('alert.questionnaireFilled'), 'success'));

      history.push(`/professional/patients/${id}`);
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };
