// Auth Module
const Auth = (() => {
  const TOKEN_KEY = 'token';
  const USER_KEY = 'user';

  function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    updateNavbar();
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    updateNavbar();
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    return !!getToken() && !!getUser();
  }

  function hasRole(...roles) {
    const user = getUser();
    return user && roles.includes(user.role);
  }

  function updateNavbar() {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const dashboardLink = document.getElementById('dashboard-link');

    if (!loginBtn || !userMenu) return;

    if (isAuthenticated()) {
      loginBtn.style.display = 'none';
      userMenu.style.display = 'flex';
      const user = getUser();
      if (dashboardLink) {
        if (user.role === 'admin') {
          dashboardLink.href = '#admin-dashboard';
          dashboardLink.textContent = 'Panel Admin';
        } else {
          dashboardLink.href = '#barbershop-dashboard';
          dashboardLink.textContent = 'Panel';
        }
      }
    } else {
      loginBtn.style.display = 'inline-flex';
      userMenu.style.display = 'none';
    }
  }

  function redirectToDashboard() {
    const user = getUser();
    if (!user) {
      window.location.hash = '#home';
      return;
    }
    if (user.role === 'admin') {
      window.location.hash = '#admin-dashboard';
    } else {
      window.location.hash = '#barbershop-dashboard';
    }
  }

  return {
    saveAuth,
    clearAuth,
    getToken,
    getUser,
    isAuthenticated,
    hasRole,
    updateNavbar,
    redirectToDashboard,
  };
})();
