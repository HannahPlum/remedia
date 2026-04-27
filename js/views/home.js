// ── views/home.js ─────────────────────────────────────────────
// Dashboard — renders the grid of collection cards.

import { getCollections, deleteCollection, itemCountByCollection } from '../store.js';
import { navigate }                    from '../router.js';
import { CATEGORY_ICONS, getAccentColor, confirmModal, escapeHtml, showToast } from '../ui.js';

export function mountHome(container) {
  render(container);
}

function render(container) {
  const collections = getCollections();
  const counts      = itemCountByCollection();

  if (collections.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
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
    <div class="view-title-row">
      <h2 class="view-heading">Your Collections</h2>
      <div class="toolbar-right"><button class="btn btn-primary" id="new-collection-btn">+ New Collection</button></div>
    </div>
    <div class="card-grid" id="collection-grid"></div>
  `;

  container.querySelector('#new-collection-btn').addEventListener('click', () => {
    import('../modals/newCollection.js').then(m => m.openNewCollectionModal(() => render(container)));
  });

  const grid = container.querySelector('#collection-grid');

  collections.forEach((col, index) => {
    const icon   = CATEGORY_ICONS[col.category] ?? 'MISC';
    const count  = counts[col.id] ?? 0;
    const accent = getAccentColor(index);
    const card   = document.createElement('div');
    card.className = 'collection-card';
    card.style.setProperty('--card-accent', accent);
    card.innerHTML = `
      <button class="collection-card__delete" aria-label="Delete ${escapeHtml(col.name)}">&times;</button>
      <div class="collection-card__icon">${icon}</div>
      <div class="collection-card__name">${escapeHtml(col.name)}</div>
      <div class="collection-card__meta">${count} item${count !== 1 ? 's' : ''}</div>
    `;
    card.addEventListener('click', () => navigate('collection', { collectionId: col.id }));

    card.querySelector('.collection-card__delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await confirmModal({
        title:        'Delete Collection',
        message:      `Remove "${col.name}" and all its items? This cannot be undone.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
      deleteCollection(col.id);
      showToast(`"${col.name}" deleted`);
      render(container);
    });

    grid.appendChild(card);
  });
}
