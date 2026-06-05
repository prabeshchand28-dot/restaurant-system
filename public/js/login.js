/* ═══════════════════════════
   LOGIN JS
   ═══════════════════════════ */

async function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('errMsg');

  if (!username || !password) { showError('Please enter both username and password.'); return; }

  btn.disabled = true; btn.textContent = 'Logging in…';
  err.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('loggedIn', 'true');
      window.location.href = '/dashboard';
    } else {
      showError(data.message || 'Invalid credentials.');
    }
  } catch {
    showError('Cannot connect to server.');
  } finally {
    btn.disabled = false; btn.textContent = 'Login to Dashboard';
  }
}

function showError(msg) {
  const err = document.getElementById('errMsg');
  err.textContent = msg; err.style.display = 'block';
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });