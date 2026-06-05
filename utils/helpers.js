// utils/helpers.js
function calcOrderTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function formatCurrency(amount) {
  return `Rs. ${amount.toLocaleString()}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

function generateReceiptNo() {
  return `RCP-${Date.now()}`;
}

module.exports = { calcOrderTotal, formatCurrency, formatTime, formatDate, generateReceiptNo };