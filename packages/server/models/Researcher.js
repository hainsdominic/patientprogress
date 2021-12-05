const mongoose = require('mongoose');

const ResearcherSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  key: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
    required: false,
  },
  requestsCount: {
    type: Number,
    default: 0,
    required: false,
  },
  authorizedIps: [{ type: String, required: true }],
});

module.exports = User = mongoose.model('Researcher', ResearcherSchema);
