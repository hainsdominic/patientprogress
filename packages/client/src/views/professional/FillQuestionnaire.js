import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Form from '@rjsf/material-ui';
import { InputLabel, NativeSelect } from '@material-ui/core';
import ImageMapper from 'react-img-mapper';
import { useTranslation } from 'react-i18next';

import URL from '../../assets/img/bodyMap.jpg';
import areasJSON from '../../assets/bodyMap.json';

import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem.js';
import Card from '../../components/Card/Card.js';
import CardBody from '../../components/Card/CardBody.js';
import Button from '../../components/CustomButtons/Button.js';

import {
  getQuestionnaire,
  addQuestionnaireFilledByProfessional,
} from '../../actions/questionnaire';

import { getPatient } from '../../actions/professional';

import Spinner from '../../components/Spinner/Spinner';

const BodyMap = (props) => {
  // eslint-disable-next-line
  const [regions, setRegions] = useState([]);
  const [disabled, setDisabled] = useState(true);

  const handleClick = (id) => {
    const newId = id.toString();
    setRegions((regions) => {
      let newArray;
      if (!regions.includes(newId)) {
        newArray = [...regions, newId];
      } else {
        newArray = regions.filter((region) => region !== newId);
      }
      props.onChange(newArray);
      return newArray;
    });
  };

  const handleLoaded = () => {
    setDisabled(false);
  };

  return (
    <>
      <strong>{props.schema.description}</strong>
      <ImageMapper
        src={URL}
        map={{
          name: `${props.schema.description}`,
          areas: areasJSON,
        }}
        responsive
        parentWidth={400}
        stayHighlighted
        stayMultiHighlighted
        toggleHighlighted
        onClick={(area) => handleClick(area.id)}
        onLoad={handleLoaded}
        disabled={disabled}
      />
    </>
  );
};

const Title = function (props) {
  return (
    <h4>
      <strong>{props.schema.title}</strong>{' '}
    </h4>
  );
};

const NativeSelectWidget = function (props) {
  const handleChange = (event) => {
    const value = event.target.value;
    props.onChange(value);
  };

  return (
    <>
      <InputLabel shrink htmlFor={props.label}>
        {props.label}
      </InputLabel>
      <NativeSelect
        value={props.value}
        onChange={handleChange}
        inputProps={{
          name: props.id,
          id: props.label,
        }}
      >
        {!props.default && <option aria-label="None" value="" />}

        {props.options.enumOptions.map(({ label, value }) => (
          <option key={`${label}`} value={value}>
            {label}
          </option>
        ))}
      </NativeSelect>
    </>
  );
};

function FillQuestionnaire({
  getQuestionnaire,
  addQuestionnaireFilledByProfessional,
  getPatient,
  match,
  history,
}) {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const questionnaire = await getQuestionnaire(
        match.params.questionnaire_id
      );
      setQuestionnaire(questionnaire);
      setStartTime(parseInt((new Date().getTime() / 1000).toFixed(0)));
    })();
  }, [getQuestionnaire, match.params.questionnaire_id]);

  const onSubmit = async (e) => {
    const timeNow = parseInt((new Date().getTime() / 1000).toFixed(0));
    console.log('questionnaire filled');
    await addQuestionnaireFilledByProfessional(
      history,
      match.params.id,
      questionnaire.title,
      formData,
      timeNow - startTime,
      match.params.questionnaire_id
    );
    await getPatient(match.params.id);
  };

  const [formData, setFormData] = useState(null);

  const widgets = {
    nativeSelect: NativeSelectWidget,
    title: Title,
  };

  const fields = {
    bodyMap: BodyMap,
  };

  return (
    <Fragment>
      {questionnaire === null ? (
        <Spinner />
      ) : (
        <GridContainer justifyContent="center">
          <GridItem xs={12}>
            <Card>
              <CardBody>
                <Form
                  widgets={widgets}
                  fields={fields}
                  schema={questionnaire.schema}
                  uiSchema={questionnaire.uischema}
                  formData={formData}
                  onChange={(e) => setFormData(e.formData)}
                  onSubmit={(e) => onSubmit(e)}
                >
                  <div>
                    <Button color="success" type="submit">
                      {t('register.submit')}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      )}
    </Fragment>
  );
}

FillQuestionnaire.propTypes = {
  getQuestionnaire: PropTypes.func.isRequired,
  addQuestionnaireFilledByProfessional: PropTypes.func.isRequired,
  getPatient: PropTypes.func.isRequired,
};

export default connect(null, {
  getQuestionnaire,
  addQuestionnaireFilledByProfessional,
  getPatient,
})(withRouter(FillQuestionnaire));
