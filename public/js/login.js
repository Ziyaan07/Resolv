(function () {
  const user = getUser();
  if (user && getToken()) {
    window.location.href = user.role === 'admin' ? '/admin.html' : '/report.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response from server');
      }

      setToken(data.token);
      setUser(data.user);
      window.location.href = data.user.role === 'admin' ? '/admin.html' : '/report.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginSection = document.getElementById('login-section');
  const signupSection = document.getElementById('signup-section');

  tabLogin.addEventListener('click', () => {
    tabLogin.className = 'text-white font-semibold flex-1 pb-2 border-b-2 border-electric transition-all';
    tabSignup.className = 'text-slate-400 hover:text-slate-200 font-medium flex-1 pb-2 border-b-2 border-transparent transition-all';
    loginSection.classList.remove('hidden');
    signupSection.classList.add('hidden');
    errorEl.classList.add('hidden');
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.className = 'text-white font-semibold flex-1 pb-2 border-b-2 border-electric transition-all';
    tabLogin.className = 'text-slate-400 hover:text-slate-200 font-medium flex-1 pb-2 border-b-2 border-transparent transition-all';
    signupSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    errorEl.classList.add('hidden');
  });

  const signupForm = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = 'employee'; // Force employee role for new signups

    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account…';

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!data?.token || !data?.user) {
        throw new Error('Invalid signup response from server');
      }

      setToken(data.token);
      setUser(data.user);
      window.location.href = data.user.role === 'admin' ? '/admin.html' : '/report.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = 'Create account';
    }
  });
})();
