// utils/receiptGenerator.js
const { calcOrderTotal, formatCurrency, formatTime, generateReceiptNo } = require('./helpers');

function generateReceiptText(order, payment) {
  const total   = calcOrderTotal(order.items);
  const lines   = order.items.map(i => `  ${i.name} x${i.qty}  ${formatCurrency(i.price * i.qty)}`);
  const receipt = [
    '================================',
    '       RESTAURANT RECEIPT       ',
    '================================',
    `Receipt: ${generateReceiptNo()}`,
    `Date:    ${new Date().toLocaleString()}`,
    `Table:   ${order.table}`,
    '--------------------------------',
    ...lines,
    '--------------------------------',
    `TOTAL:   ${formatCurrency(total)}`,
    `Payment: ${payment.method}`,
    '================================',
    '     Thank you! Come again!     ',
    '================================',
  ];
  return receipt.join('\n');
}

function generateReceiptHTML(order, payment) {
  const total = calcOrderTotal(order.items);
  const rows  = order.items.map(i =>
    `<tr><td>${i.name}</td><td>×${i.qty}</td><td>Rs. ${i.price * i.qty}</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:monospace;max-width:300px;margin:0 auto;padding:20px}
    h2{text-align:center} table{width:100%;border-collapse:collapse}
    td{padding:4px 8px} .total{font-weight:bold;font-size:18px;text-align:right}
    .footer{text-align:center;margin-top:16px;color:#666}
    hr{border:none;border-top:1px dashed #ccc}
  </style></head><body>
  <h2>🍽️ Receipt</h2>
  <p>Table: ${order.table} | ${new Date().toLocaleString()}</p>
  <hr>
  <table>${rows}</table>
  <hr>
  <div class="total">Total: Rs. ${total}</div>
  <p>Payment: ${payment.method}</p>
  <div class="footer">Thank you! Come again! 🙏</div>
  </body></html>`;
}

module.exports = { generateReceiptText, generateReceiptHTML };