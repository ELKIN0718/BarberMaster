// ========================================
// BarberMaster - Main Application
// ========================================

// ---- Global Helpers ----

function toast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(100px)';
    toastEl.style.transition = 'all 0.3s ease';
    setTimeout(() => toastEl.remove(), 300);
  }, duration);
}

function render(html) {
  const main = document.getElementById('main-content');
  if (main) main.innerHTML = html;
}

function formatCOP(amount) {
  return '$' + Number(amount).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Si ya viene con timezone (ISO string como 2026-06-09T05:00:00.000Z),
  // se parsea directamente. Si solo es fecha (2026-06-09), se añade T12 para evitar desfase por zona horaria.
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showModal(htmlContent) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  body.innerHTML = htmlContent;
  overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

function showSkeleton(count = 3, type = 'card') {
  let html = '';
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      html += `<div class="skeleton skeleton-card"></div>`;
    } else if (type === 'list') {
      html += `
        <div style="padding: 1rem; background: var(--bg-card); border-radius: var(--radius); margin-bottom: 0.75rem;">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text" style="width: 40%;"></div>
        </div>
      `;
    }
  }
  return html;
}

function setLoading(button, loading = true) {
  if (!button) return;
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function getStatusBadge(status) {
  const labels = {
    reserved: 'Reservado',
    waiting: 'En espera',
    lost: 'Perdido',
    completed: 'Completado',
  };
  return `<span class="status-badge ${status}">${labels[status] || status}</span>`;
}

function getPaymentStatusBadge(status) {
  const labels = {
    pending: 'Pendiente',
    simulated: 'Pagado',
    failed: 'Fallido',
  };
  const classes = {
    pending: 'waiting',
    simulated: 'completed',
    failed: 'lost',
  };
  return `<span class="status-badge ${classes[status] || ''}">${labels[status] || status}</span>`;
}

function formatCardNumber(value) {
  const v = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
  return v.replace(/(.{4})/g, '$1 ').trim();
}

// ---- Loading Screen ----
function initLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.getElementById('loading-bar');
  if (!loadingScreen || !loadingBar) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 300);
    }
    loadingBar.style.width = progress + '%';
  }, 120);
}

// ---- Theme Toggle ----
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const sunIcon = toggle?.querySelector('.sun-icon');
  const moonIcon = toggle?.querySelector('.moon-icon');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);

  toggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcons(next);
  });

  function updateThemeIcons(theme) {
    if (!sunIcon || !moonIcon) return;
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

// ---- Hamburger Menu ----
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks?.classList.toggle('open');
  });

  // Close on link click
  navLinks?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('open');
    });
  });
}

// ---- Modal Close ----
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

// ---- Logout ----
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    Auth.clearAuth();
    toast('Sesión cerrada correctamente', 'success');
    window.location.hash = '#home';
  });
}

// ---- Init App ----
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initThemeToggle();
  initHamburger();
  initModal();
  initLogout();

  // Update navbar auth state
  Auth.updateNavbar();

  // Register routes (bind context so 'this' works inside handlers)
  Router.register('home', HomePage.init.bind(HomePage));
  Router.register('barbershops', BarbershopsPage.init.bind(BarbershopsPage));
  Router.register('booking', BookingPage.init.bind(BookingPage));
  Router.register('track', TrackPage.init.bind(TrackPage));
  Router.register('login', LoginPage.init.bind(LoginPage));
  Router.register('barbershop-dashboard', BarbershopDashboard.init.bind(BarbershopDashboard));
  Router.register('admin-dashboard', AdminDashboard.init.bind(AdminDashboard));

  // Start router
  Router.init();
});
