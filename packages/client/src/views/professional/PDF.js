import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const styles = StyleSheet.create({
  credits: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
  },
  titleSection: {
    margin: 10,
    flexGrow: 1,
  },
  answersContainer: {
    margin: 10,
  },
  answer: {
    fontSize: 12,
    marginBottom: 4,
  },
});

// Create Document Component
const PDF = ({ questionnaire, patient, answers }) => {
  return (
    <Document>
      <Page size='A4'>
        <View style={styles.credits}>
          <Text>Generated by/Généré par PatientProgress</Text>
        </View>
        <View style={styles.title}>
          <Text style={styles.titleSection}>{`${
            questionnaire && questionnaire.title
          } (${questionnaire && questionnaire.questionnaire.language})`}</Text>
          <Text style={styles.titleSection}>{`${patient.name} - ${dayjs(
            questionnaire.time
          ).format('YYYY/MM/DD')}`}</Text>
        </View>
        <View style={styles.answersContainer}>
          {answers.map(({ title, value }, i) => (
            <Text key={i} style={styles.answer}>{`${title}: ${value}`}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default PDF;
