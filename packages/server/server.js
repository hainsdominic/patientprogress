const express = require('express');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
var noBots = require('express-nobots');

const connectDB = require('./config/db');
const logger = require('./logger');
const { startBot } = require('./telegramBot');
const { startSender } = require('./questionnaireSender');
const { startDeleter } = require('./trustedIpsDeleter');

const app = express();

// Load env variables
dotenv.config({ path: './config/config.env' });

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';

// Connect database
if (!process.env.TEST_MODE) connectDB();

// Forbid bots and crawlers
app.use(noBots());

// Rate-limit the API
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply to all requests
app.use(limiter);

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

let corsOptions;
if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = [
    `https://${process.env.INSTANCE}.patientprogress.ca`,
    `https://prosante.patientprogress.ca`,
  ];
  corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not ' +
          'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
}

// Enable CORS
app.use(cors(corsOptions));

// Prevent http param pollution
app.use(hpp());

// Logging

if (!process.env.TEST_MODE) {
  app.use(
    morgan(morganFormat, {
      skip: function (req, res) {
        return res.statusCode < 400;
      },
      stream: process.stderr,
    })
  );

  app.use(
    morgan(morganFormat, {
      skip: function (req, res) {
        return res.statusCode >= 400;
      },
      stream: process.stdout,
    })
  );
}

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/patients', require('./routes/api/patients'));
app.use('/api/professionals', require('./routes/api/professionals'));
app.use('/api/questionnaires', require('./routes/api/questionnaires'));
app.use('/api/research', require('./routes/api/research'));
app.use('/api/seeding', require('./routes/api/seeding'));

// All errors are sent back as JSON
app.use((err, req, res, next) => {
  // Fallback to default node handler
  if (res.headersSent) {
    next(err);
    return;
  }

  logger.error(err.message, { url: req.originalUrl });

  res.status(500);
  res.json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  if (!process.env.TEST_MODE) {
    logger.info(
      `PatientProgress API listening in ${process.env.NODE_ENV} on port ${PORT}`
    );
  }
});

startSender();

if (process.env.NODE_ENV === 'production') {
  startBot();
  startDeleter();
}

module.exports = app;
