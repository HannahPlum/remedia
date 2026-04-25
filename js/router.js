// ── router.js ─────────────────────────────────────────────────
// Manages which view is active. Views register themselves here;
// the router mounts/unmounts them into #app.

const app       = document.getElementById('app');
const headerBtn = document.getElementById('header-action-btn');

let currentView    = null;  // { name, cleanup? }
let registeredViews = {};

/**
 * Register a view by name.
 * @param {string} name
 * @param {{ mount(container, params): void, unmount?(): void }} view
 */
export function registerView(name, view) {
  registeredViews[name] = view;
}

/**
 * Navigate to a named view with optional params.
 * @param {string} name
 * @param {object} [params]
 */
export function navigate(name, params = {}) {
  if (currentView?.unmount) currentView.unmount();
  app.innerHTML = '';

  const view = registeredViews[name];
  if (!view) {
    app.innerHTML = `<p class="text-muted">View "${name}" not found.</p>`;
    return;
  }

  currentView = view;
  view.mount(app, params);
  updateChrome(name, params);
}

// Update the header action button per view
function updateChrome() {
  headerBtn.classList.add('hidden');
}
