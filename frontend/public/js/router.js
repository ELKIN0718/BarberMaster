// SPA Router Module
const Router = (() => {
  const routes = {};
  let currentRoute = null;

  function register(name, handler) {
    routes[name] = handler;
  }

  function navigate(hash) {
    const route = hash.replace(/^#/, '') || 'home';

    // Extract params from route like booking/SOME_ID
    let handler = routes[route];
    let params = null;

    if (!handler) {
      // Check for parameterized routes
      const parts = route.split('/');
      if (parts.length > 1) {
        const baseRoute = parts[0];
        params = parts.slice(1);
        handler = routes[baseRoute];
      }
    }

    if (!handler) {
      handler = routes['home'];
    }

    currentRoute = route;
    handler(params);
  }

  function init() {
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash);
    });

    // Initial navigation
    if (window.location.hash) {
      navigate(window.location.hash);
    } else {
      navigate('#home');
    }
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  return {
    register,
    navigate,
    init,
    getCurrentRoute,
  };
})();
