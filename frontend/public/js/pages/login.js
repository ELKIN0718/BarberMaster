// Login Page
const LoginPage = {
  init() {
    // If already logged in, redirect
    if (Auth.isAuthenticated()) {
      Auth.redirectToDashboard();
      return;
    }
    this.render();
  },

  render() {
    render(`
      <div class="page">
        <div class="login-container">
          <div class="login-card">
            <h2>Iniciar sesión</h2>
            <p class="subtitle">Accede a tu panel de administración</p>
            <form id="login-form" onsubmit="LoginPage.handleSubmit(event)">
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input type="email" class="form-input" id="login-email" 
                       placeholder="admin@barbermaster.com" required>
                <div class="form-error" id="email-error">Ingresa un email válido</div>
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input type="password" class="form-input" id="login-password" 
                       placeholder="••••••" required>
                <div class="form-error" id="password-error">Ingresa tu contraseña</div>
              </div>
              <div id="login-error" style="display:none;color:var(--danger);font-size:0.9rem;margin-bottom:1rem;text-align:center"></div>
              <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="login-submit">
                <span class="btn-text">Iniciar sesión</span>
                <span class="btn-spinner"></span>
              </button>
            </form>
            <p style="text-align:center;margin-top:1.5rem;font-size:0.85rem;color:var(--text-muted)">
              ¿No tienes cuenta? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    `);
  },

  async handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const errorDiv = document.getElementById('login-error');

    // Validate
    let valid = true;
    if (!email || !email.includes('@')) {
      document.getElementById('email-error')?.classList.add('visible');
      document.getElementById('login-email')?.classList.add('error');
      valid = false;
    }
    if (!password) {
      document.getElementById('password-error')?.classList.add('visible');
      document.getElementById('login-password')?.classList.add('error');
      valid = false;
    }

    if (!valid) return;

    if (errorDiv) errorDiv.style.display = 'none';

    const btn = document.getElementById('login-submit');
    setLoading(btn, true);

    try {
      const result = await API.login(email, password);
      Auth.saveAuth(result.token, result.user);
      toast('Inicio de sesión exitoso', 'success');
      Auth.redirectToDashboard();
    } catch (err) {
      setLoading(btn, false);
      if (errorDiv) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      } else {
        toast(err.message, 'error');
      }
    }
  },
};
