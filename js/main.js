// ── main.js ───────────────────────────────────────────────────
// Entry point. Registers views, wires up the header action button,
// and navigates to the home view on load.

import { registerView, navigate } from './router.js';
import { mountHome }              from './views/home.js';
import { mountCollection }        from './views/collection.js';

// Register all views
registerView('home', {
  mount:   (container, params) => mountHome(container, params),
});
registerView('collection', {
  mount:   (container, params) => mountCollection(container, params),
});

// Header action button — its behaviour changes per view
document.getElementById('header-action-btn').addEventListener('click', (e) => {
  const action       = e.currentTarget.dataset.action;
  const collectionId = e.currentTarget.dataset.collectionId;

  if (action === 'new-collection') {
    import('./modals/newCollection.js').then(m => m.openNewCollectionModal());
  }
});

document.getElementById('site-logo-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('home');
});

// Boot
navigate('home');
