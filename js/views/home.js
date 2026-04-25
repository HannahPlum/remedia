// ── views/home.js ─────────────────────────────────────────────
// Dashboard — renders the grid of collection cards.

import { getCollections, deleteCollection, itemCountByCollection } from '../store.js';
import { navigate }                    from '../router.js';
import { CATEGORY_ICONS, getAccentColor, escapeHtml, showToast } from '../ui.js';

export function mountHome(container) {
  render(container);
}

function render(container) {
  const collections = getCollections();
  const counts      = itemCountByCollection();

  if (collections.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"></div>
        <p class="empty-state__title">No collections yet</p>
        <p class="empty-state__desc">Create your first collection to start tracking your physical media.</p>
        <button class="btn btn-gradient" id="empty-new-btn">+ New Collection</button>
      </div>
    `;
    container.querySelector('#empty-new-btn').addEventListener('click', () => {
      import('../modals/newCollection.js').then(m => m.openNewCollectionModal(() => render(container)));
    });
    return;
  }

  container.innerHTML = `
    <h2 class="view-heading">Your Collections</h2>
    <div class="card-grid" id="collection-grid"></div>
  `;

  const grid = container.querySelector('#collection-grid');

  collections.forEach((col, index) => {
    const icon   = CATEGORY_ICONS[col.category] ?? 'MISC';
    const count  = counts[col.id] ?? 0;
    const accent = getAccentColor(index);
    const card   = document.createElement('div');
    card.className = 'collection-card';
    card.style.setProperty('--card-accent', accent);
    card.innerHTML = `
      <div class="collection-card__icon">${icon}</div>
      <div class="collection-card__name">${escapeHtml(col.name)}</div>
      <div class="collection-card__meta">${count} item${count !== 1 ? 's' : ''}</div>
    `;
    card.addEventListener('click', () => navigate('collection', { collectionId: col.id }));

    // Right-click context menu stub (will become a delete option)
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm(`Delete "${col.name}" and all its items?`)) {
        deleteCollection(col.id);
        showToast(`"${col.name}" deleted`);
        render(container);
      }
    });

    grid.appendChild(card);
  });
}
