var CronJob = require('cron').CronJob;
const Patient = require('./models/Patient');

module.exports = {
  startSender: async function () {
    try {
      var job = new CronJob(
        '00 00 04 * * *',
        async function () {
          const patients = await Patient.find({});
          patients.forEach((patient) => {
            patient.questionnairesToFill.forEach((questionnaire) => {
              if (
                !questionnaire.sent &&
                new Date(questionnaire.date) < Date.now()
              ) {
                // Send a email notification
                const transporter = nodemailer.createTransport({
                  host: '***REMOVED***',
                  port: 465,
                  secure: true,
                  auth: {
                    user: 'dominic@hainstech.com',
                    pass: '***REMOVED***',
                  },
                });

                let message = '';
                let subject = '';
                switch (patient.language) {
                  case 'en':
                    message = `<h3>You have a new questionnaire to fill!</h3><p>Please <a href="https://app.patientprogress.ca/login">sign into the application</a> as soon as possible to fill it.</p><br><p>Thank you,</p><p>The PatientProgress Team</p>`;
                    subject = 'New questionnaire';
                    break;
                  case 'fr':
                    message = `<h3>Vous avez un nouveau questionnaire à remplir!</h3><p>Veuillez <a href="https://app.patientprogress.ca/login"> vous connecter</a> dès que possible afin de le remplir.</p><br><p>Merci,</p><p>L'équipe PatientProgress</p>`;
                    subject = 'Nouveau questionnaire';
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

                patient.questionnairesToFill.find(
                  (q) => q._id === questionnaire._id
                ).sent = true;
              }
            });
            await patient.save();
          });
        },
        null,
        true,
        'Canada/Eastern'
      );
      job.start();
    } catch (error) {
      console.error(error);
    }
  },
};
