import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import { format, parseISO } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import i18next from 'i18next';

import {
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  IconButton,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import DatePicker from 'react-multi-date-picker';
import DatePanel from 'react-multi-date-picker/plugins/date_panel';

import Spinner from '../../components/Spinner/Spinner';

import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem.js';
import Card from '../../components/Card/Card.js';
import CardHeader from '../../components/Card/CardHeader.js';
import CardBody from '../../components/Card/CardBody.js';
import Button from '../../components/CustomButtons/Button.js';
import Alert from '../layout/Alert';

import {
  getPatient,
  getQuestionnaireList,
  sendQuestionnaires,
  removeQuestionnaire,
} from '../../actions/professional';

import { makeStyles } from '@material-ui/core/styles';
import styles from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
const useStyles = makeStyles(styles);

const BUNDLES = ['NECK_BUNDLE', 'BACK_BUNDLE', 'MS_BUNDLE', 'MI_BUNDLE'];

const PatientOverview = ({
  professional: { patient, loading },
  match,
  history,
  getPatient,
  getQuestionnaireList,
  sendQuestionnaires,
  removeQuestionnaire,
}) => {
  const classes = useStyles();
  const [displayList, setDisplayList] = useState([]);
  const [questionnaireList, setQuestionnaireList] = useState([]);
  const [scheduled, setScheduled] = useState(false);
  const [dates, setDates] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);

  const parseDisplayList = useCallback(({ data: list }) => {
    setQuestionnaireList(list);
    let newList = [];
    list.forEach((questionnaire) => {
      if (i18next.language === questionnaire.language) {
        newList.push(questionnaire);
      } else if (
        list.find(
          (q) =>
            q.language !== i18next.language &&
            q.title === questionnaire.title &&
            q.language === 'en' &&
            newList.includes(q)
        )
      ) {
        newList.push(questionnaire);
      }
    });

    // add questionnaire bundles to the displayed list
    newList = [
      ...BUNDLES.map((title) => ({
        title,
      })),
      ...newList,
    ];
    setDisplayList(newList);
  }, []);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (!patient || patient._id !== match.params.id)
        await getPatient(match.params.id);
      parseDisplayList(await getQuestionnaireList());
    };
    fetchQuestionnaire();
  }, [
    getPatient,
    patient,
    getQuestionnaireList,
    match.params.id,
    parseDisplayList,
  ]);

  const handleSubmit = (e) => {
    // For each questionnaire
    // si il y a des dates => envoie aux dates
    // sinon envoie maintenant

    const toFill = [];
    let debundledQuestionnaires = [];

    questionnaires.forEach((questionnaire) => {
      if (BUNDLES.includes(questionnaire.title)) {
        switch (questionnaire.title) {
          case 'NECK_BUNDLE':
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Brief Pain Inventory')
            );
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Neck Disability Index')
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Modified MSK STarT Back Screening Tool'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Follow-up questionnaire'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'mHealth App Usability Questionnaire'
              )
            );
            break;
          case 'BACK_BUNDLE':
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Brief Pain Inventory')
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Oswestry Disability Index'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'The Keele STarT Back Screening Tool'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Follow-up questionnaire'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'mHealth App Usability Questionnaire'
              )
            );
            break;
          case 'MS_BUNDLE':
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Brief Pain Inventory')
            );
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Brief Pain Inventory')
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Modified MSK STarT Back Screening Tool'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Follow-up questionnaire'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'mHealth App Usability Questionnaire'
              )
            );
            break;
          case 'MI_BUNDLE':
            debundledQuestionnaires.push(
              questionnaireList.find((q) => q.title === 'Brief Pain Inventory')
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Lower Extremity Functional Scale (LEFS)'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Modified MSK STarT Back Screening Tool'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'Follow-up questionnaire'
              )
            );
            debundledQuestionnaires.push(
              questionnaireList.find(
                (q) => q.title === 'mHealth App Usability Questionnaire'
              )
            );
            break;
          default:
        }
      } else {
        debundledQuestionnaires.push(questionnaire);
      }
    });

    debundledQuestionnaires.forEach((questionnaire) => {
      // @v trouver le ID a envoyer
      // on regarde si il existe dans la langue du patient
      // si oui on l'envoie sinon on l'envoie en anglais

      let id;
      const { title } = questionnaire;
      const foundQ = questionnaireList.find(
        (q) => q.title === title && q.language === patient.language
      );
      if (foundQ) {
        id = foundQ.id;
      } else {
        id = questionnaireList.find(
          (q) => q.title === title && q.language === 'en'
        ).id;
      }

      if (dates.length === 0) {
        toFill.push({
          questionnaire: id,
          date: Date.now(),
          sent: true,
        });
      } else {
        dates.forEach((date) => {
          toFill.push({
            questionnaire: id,
            date: date.toString(),
            sent: false,
          });
        });
      }
    });
    if (toFill.length > 0) {
      sendQuestionnaires(patient._id, toFill);
      setQuestionnaires([]);
      setDates([]);
    }
  };

  const { t } = useTranslation();

  const renderQuestionnaireViewButton = (params) => {
    return (
      <Link
        to={`/professional/patients/${match.params.id}/questionnaires/${params.row.id}`}
      >
        <Button color="success">{t('professional.patient.view')}</Button>
      </Link>
    );
  };

  const renderReportViewButton = (params) => {
    return (
      <Link
        to={
          params.row.type === t('professional.patient.initial')
            ? `/professional/patients/${match.params.id}/reports/${params.row.id}`
            : `/professional/patients/${match.params.id}/reevaluationreports/${params.row.id}`
        }
      >
        <Button color="success">{t('professional.patient.view')}</Button>
      </Link>
    );
  };

  const renderDeleteButton = (params) => {
    return (
      <IconButton
        color="default"
        onClick={() => {
          removeQuestionnaire(match.params.id, params.row.questionnaire);
        }}
      >
        <DeleteIcon />
      </IconButton>
    );
  };

  const renderFillButton = (params) => {
    return (
      <IconButton
        color="default"
        onClick={() => {
          history.push(
            `/professional/patients/${match.params.id}/questionnaires/${params.row.questionnaireId}/fill`
          );
        }}
      >
        <EditIcon />
      </IconButton>
    );
  };

  const renderSent = (params) => {
    return params.row.sent ? <CheckIcon /> : <ClearIcon />;
  };

  const toggleScheduled = (e) => {
    setScheduled(e.target.checked);
    setDates([]);
  };

  function handleDateChange(dates) {
    setDates(dates);
  }

  return (
    <>
      {patient === null || questionnaireList.length === 0 || loading ? (
        <Spinner />
      ) : (
        <GridContainer justifyContent="center">
          <Alert />
          <GridItem xs={12} xl={6}>
            <Card>
              <CardHeader color="danger">
                <h4 className={classes.cardTitleWhite}>
                  {t('professional.patient.detailsTitle')}
                </h4>
              </CardHeader>
              <CardBody>
                <GridContainer justifyContent="center">
                  <GridItem xs={12} xl={4}>
                    {t('professional.patient.name')}: {patient.name}
                  </GridItem>

                  <GridItem xs={12} xl={4}>
                    {t('professional.patient.dob')}:{' '}
                    {format(
                      zonedTimeToUtc(
                        parseISO(patient.dob),
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      ),
                      'yyyy/MM/dd'
                    )}
                  </GridItem>

                  <GridItem xs={12} xl={4}>
                    {t('professional.patient.gender')}:{' '}
                    {patient.gender === 'Male' || patient.gender === 'Female'
                      ? t(`professional.patient.${patient.gender}`)
                      : patient.gender}
                  </GridItem>

                  <GridItem
                    xs={12}
                    xl={4}
                    style={!patient.research ? { color: 'red' } : null}
                  >
                    {t('professional.patient.research')}:{' '}
                    {patient.research ? t('report.yes') : t('report.no')}
                  </GridItem>
                </GridContainer>
              </CardBody>
            </Card>
            <Card>
              <CardHeader color="danger">
                <h4 className={classes.cardTitleWhite}>
                  {t('professional.patient.reports')}
                </h4>
              </CardHeader>
              <CardBody>
                {patient.questionnaires.filter(
                  ({ title }) => title === 'Initial Intake Form'
                ).length > 0 ? (
                  <Link to={`/professional/patients/${match.params.id}/report`}>
                    <Button color="success" style={{ marginBottom: 15 }}>
                      {t('professional.patient.newReport')}
                    </Button>
                  </Link>
                ) : (
                  t('professional.patient.noIntake')
                )}
                {patient.reports.length > 0 &&
                  patient.questionnaires.some(
                    (questionnaire) =>
                      questionnaire.title === 'Follow-up questionnaire'
                  ) && (
                    <Link
                      to={`/professional/patients/${match.params.id}/reevaluationreport`}
                      disabled
                    >
                      <Button
                        color="success"
                        style={{ marginBottom: 15, marginLeft: 10 }}
                      >
                        {t('professional.patient.newReEvaluationReport')}
                      </Button>
                    </Link>
                  )}

                {patient.reports.length > 0 && (
                  <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                      disableSelectionOnClick
                      rows={patient.reports
                        .map(({ date, _id }) => {
                          return {
                            id: _id,
                            time: format(
                              zonedTimeToUtc(
                                parseISO(date),
                                Intl.DateTimeFormat().resolvedOptions().timeZone
                              ),
                              'yyyy/MM/dd'
                            ),
                            date,
                            type: t('professional.patient.initial'),
                          };
                        })
                        .concat(
                          patient.reEvaluationReports.map(({ date, _id }) => {
                            return {
                              id: _id,
                              time: format(
                                zonedTimeToUtc(
                                  parseISO(date),
                                  Intl.DateTimeFormat().resolvedOptions()
                                    .timeZone
                                ),
                                'yyyy/MM/dd'
                              ),
                              date,
                              type: t('professional.patient.reEvaluation'),
                            };
                          })
                        )
                        .sort((a, b) => new Date(b.date) - new Date(a.date))}
                      columns={[
                        {
                          field: 'id',
                          headerName: t('professional.patient.view'),
                          sortable: false,
                          width: 115,
                          disableClickEventBubbling: true,
                          renderCell: renderReportViewButton,
                        },
                        {
                          field: 'type',
                          headerName: t('professional.patient.type'),
                          width: 110,
                        },
                        {
                          field: 'time',
                          headerName: t('professional.patient.date'),
                          width: 110,
                        },
                      ]}
                      pageSize={5}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader color="danger">
                <h4 className={classes.cardTitleWhite}>
                  {t('professional.patient.sendQuestionnaire')}
                </h4>
              </CardHeader>
              <CardBody>
                <GridContainer>
                  <GridItem xs={12} sm={9}>
                    <FormControl fullWidth>
                      <Autocomplete
                        multiple
                        id="questionnaireToSend"
                        name="questionnaire"
                        options={displayList}
                        getOptionLabel={(option) => {
                          if (BUNDLES.includes(option.title)) {
                            return t(
                              `professional.patient.bundles.${option.title}`
                            );
                          } else {
                            return option.displayTitle;
                          }
                        }}
                        getOptionSelected={(option) => {
                          let val = false;
                          questionnaires.forEach((q) => {
                            if (q.title === option.title) val = true;
                          });
                          return val;
                        }}
                        value={questionnaires}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('professional.patient.questionnaire')}
                          />
                        )}
                        onChange={(e, value) => setQuestionnaires(value)}
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem xs={12} sm={3}>
                    <Button color="success" onClick={handleSubmit}>
                      {t('professional.invite.submit')}
                    </Button>
                  </GridItem>

                  <GridItem xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={scheduled}
                          onChange={toggleScheduled}
                          name="scheduled"
                          color="primary"
                        />
                      }
                      label={t('professional.patient.scheduled')}
                    />
                  </GridItem>
                </GridContainer>
                {scheduled && (
                  <GridContainer wrap="nowrap">
                    <GridItem>
                      <p>{t('professional.patient.selectDates')}:</p>
                    </GridItem>
                    <GridItem xs={5}>
                      <DatePicker
                        style={{ margin: '14px 0px' }}
                        value={dates}
                        onChange={handleDateChange}
                        multiple
                        plugins={[<DatePanel />]}
                      />
                    </GridItem>
                  </GridContainer>
                )}
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} xl={6}>
            <Card>
              <CardHeader color="danger">
                <h4 className={classes.cardTitleWhite}>
                  {t('professional.patient.pendingQuestionnaires')}
                </h4>
              </CardHeader>
              <CardBody>
                {patient.questionnairesToFill.length > 0 ? (
                  <div style={{ height: 250, width: '100%' }}>
                    <DataGrid
                      disableSelectionOnClick
                      rows={patient.questionnairesToFill.map(
                        ({ _id, questionnaire, date, sent }, i) => {
                          const title = questionnaireList.find(
                            (q) => q.id === questionnaire
                          ).displayTitle;
                          return {
                            id: `${i}-${questionnaire}`,
                            questionnaireId: questionnaire,
                            questionnaire: _id,
                            sent,
                            title,
                            time: format(
                              zonedTimeToUtc(
                                parseISO(date),
                                Intl.DateTimeFormat().resolvedOptions().timeZone
                              ),
                              'yyyy/MM/dd'
                            ),
                          };
                        }
                      )}
                      columns={[
                        {
                          field: 'title',
                          headerName: `${t(
                            'professional.patient.questionnaire'
                          )}`,
                          width: 200,
                        },
                        {
                          field: 'sent',
                          headerName: `${t('professional.patient.sent')}`,
                          sortable: false,
                          width: 81,
                          disableClickEventBubbling: true,
                          renderCell: renderSent,
                        },
                        {
                          field: 'time',
                          headerName: `${t('professional.patient.date')}`,
                          width: 105,
                        },
                        {
                          field: 'fill',
                          headerName: `${t('professional.patient.fill')}`,
                          sortable: false,
                          width: 105,
                          disableClickEventBubbling: true,
                          renderCell: renderFillButton,
                        },
                        {
                          field: 'delete',
                          headerName: `${t('professional.patient.remove')}`,
                          sortable: false,
                          width: 105,
                          disableClickEventBubbling: true,
                          renderCell: renderDeleteButton,
                        },
                      ]}
                      pageSize={2}
                    />
                  </div>
                ) : (
                  <p style={{ textAlign: 'center' }}>
                    {t('professional.patient.none')}
                  </p>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader color="danger">
                <h4 className={classes.cardTitleWhite}>
                  {t('professional.patient.filledQuestionnaires')}
                </h4>
              </CardHeader>
              <CardBody>
                {patient.questionnaires.length > 0 ? (
                  <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                      disableSelectionOnClick
                      rows={patient.questionnaires
                        .map(({ title, time, _id, questionnaire }) => {
                          return {
                            id: _id,
                            title: questionnaire.schema.title,
                            time: format(
                              zonedTimeToUtc(
                                parseISO(time),
                                Intl.DateTimeFormat().resolvedOptions().timeZone
                              ),
                              'yyyy/MM/dd'
                            ),
                          };
                        })
                        .reverse()}
                      columns={[
                        {
                          field: 'id',
                          headerName: `${t('professional.patient.answers')}`,
                          sortable: false,
                          width: 115,
                          disableClickEventBubbling: true,
                          renderCell: renderQuestionnaireViewButton,
                        },
                        {
                          field: 'title',
                          headerName: `${t(
                            'professional.patient.questionnaire'
                          )}`,
                          width: 200,
                        },
                        {
                          field: 'time',
                          headerName: `${t('professional.patient.date')}`,
                          width: 110,
                        },
                      ]}
                      pageSize={5}
                    />
                  </div>
                ) : (
                  <p style={{ textAlign: 'center' }}>
                    {t('professional.patient.none')}
                  </p>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      )}
    </>
  );
};

PatientOverview.propTypes = {
  getPatient: PropTypes.func.isRequired,
  professional: PropTypes.object.isRequired,
  getQuestionnaireList: PropTypes.func.isRequired,
  sendQuestionnaires: PropTypes.func.isRequired,
  removeQuestionnaire: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  professional: state.professional,
});

export default connect(mapStateToProps, {
  getPatient,
  getQuestionnaireList,
  sendQuestionnaires,
  removeQuestionnaire,
})(PatientOverview);
