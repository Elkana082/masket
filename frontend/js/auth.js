// =============================
//  MASKET — Auth Page JS
// =============================

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect home
  if (Auth.isLoggedIn()) {
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = next || '/index.html';
    return;
  }

  // ---- Login Form ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Signing in...';

      try {
        const data = await API.post('/auth/login', { email, password });
        Auth.setSession(data.token, data.user);
        showToast('Welcome back, ' + data.user.name + '!', 'success');
        setTimeout(() => {
          const next = new URLSearchParams(window.location.search).get('next');
          window.location.href = next || '/index.html';
        }, 700);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-login-box-line"></i> Sign In';
      }
    });
  }

  // ---- Signup Form ----
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('[type="submit"]');

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const phone = document.getElementById('signup-phone')?.value.trim() || '';
      const residence = document.getElementById('signup-residence')?.value.trim() || '';
      const gender = document.getElementById('signup-gender')?.value || '';

      if (!name || !email || !password) { showToast('Name, email and password are required', 'error'); return; }
      if (password !== confirm) { showToast('Passwords do not match', 'error'); return; }
      if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Creating account...';

      try {
        const data = await API.post('/auth/signup', { name, email, password, phone, residence, gender });
        Auth.setSession(data.token, data.user);
        showToast('Account created! Welcome to Masket 🎉', 'success');
        setTimeout(() => { window.location.href = '/index.html'; }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-user-add-line"></i> Create Account';
      }
    });
  }

  // Password toggle
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') { input.type = 'text'; btn.querySelector('i').className = 'ri-eye-off-line'; }
      else { input.type = 'password'; btn.querySelector('i').className = 'ri-eye-line'; }
    });
  });
});