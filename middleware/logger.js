// middleware/logger.js
const morgan = require('morgan');
module.exports = morgan('[:date[clf]] :method :url :status :response-time ms');