// services/squareService.js
// Square integration — env ma SQUARE_ACCESS_TOKEN set garnus
// npm install squareup

async function createOrder(lineItems, locationId) {
  if (!process.env.SQUARE_ACCESS_TOKEN) throw new Error('Square not configured. Set SQUARE_ACCESS_TOKEN in .env');
  // Square SDK integration here
  throw new Error('Square integration not yet active. Contact developer.');
}

module.exports = { createOrder };
