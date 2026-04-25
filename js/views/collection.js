// ── views/collection.js ───────────────────────────────────────
// Collection view — item grid with sort and filter controls.

import { getCollection, getCollections, getItems } from '../store.js';
import { navigate }                 from '../router.js';
import {
  CATEGORY_ICONS, FORMAT_OPTIONS, getAccentColor,
  coverImgOrPlaceholder, escapeHtml,
} from '../ui.js';

let currentCollectionId = null;

export function mountCollection(container, { collectionId }) {
  currentCollectionId = collectionId;
  const collection = getCollection(collectionId);
  if (!collection) { navigate('home'); return; }
  render(container, collection);
}

// Called by modals after saving/deleting an item
export function refreshCollection() {
  const collection = getCollection(currentCollectionId);
  const container  = document.getElementById('app');
  if (collection && container) render(container, collection);
}

function render(container, collection) {
  const allItems    = getItems(collection.id);
  const icon        = CATEGORY_ICONS[collection.category] ?? 'MISC';
  const colIndex    = getCollections().findIndex(c => c.id === collection.id);
  const accent      = getAccentColor(colIndex);
  const formatOpts  = FORMAT_OPTIONS[collection.category] ?? [];
  const allFormats  = [...new Set(allItems.map(i => i.mediaFormat).filter(Boolean))];

  const SORT_OPTIONS = [
    { value: 'addedAt', label: 'Date Added' },
    { value: 'title',   label: 'Title A–Z'  },
    { value: 'year',    label: 'Year'        },
  ];

  // Read current filter/sort state from DOM if it exists (for re-renders)
  const prevSort    = container.querySelector('[data-sort-select]')?.dataset.sortValue ?? 'addedAt';
  const prevSearch  = container.querySelector('#toolbar-search')?.value ?? '';
  const prevFormats = [...(container.querySelectorAll('.filter-chip.active') ?? [])]
    .map(el => el.dataset.format);

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === prevSort)?.label ?? 'Date Added';

  container.innerHTML = `
    <h2 class="view-heading">${escapeHtml(collection.name)}</h2>
    <button class="back-btn" id="back-btn">&#8592;</button>
    <div class="toolbar">
      <input
        class="form-input toolbar-search"
        id="toolbar-search"
        type="search"
        placeholder="Search titles…"
        value="${escapeHtml(prevSearch)}"
      >
      <div class="custom-select" id="sort-select-wrapper">
        <button class="custom-select__btn" data-sort-select data-sort-value="${prevSort}" aria-haspopup="listbox" aria-expanded="false">
          <span class="custom-select__label">${activeSortLabel}</span>
          <span class="custom-select__arrow">&#9660;</span>
        </button>
        <ul class="custom-select__menu hidden" role="listbox">
          ${SORT_OPTIONS.map(o => `
            <li class="custom-select__option" role="option" data-value="${o.value}">${o.label}</li>
          `).join('')}
        </ul>
      </div>
      <button class="btn btn-gradient" id="toolbar-add-btn">+ Add Item</button>
    </div>
    ${allFormats.length > 1 ? renderFilterBar(allFormats, prevFormats, formatOpts) : ''}
    <div id="item-grid"></div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('home'));

  container.querySelector('#toolbar-add-btn').addEventListener('click', () => {
    import('../modals/addEditItem.js').then(m => m.openAddItemModal(collection.id));
  });

  const searchInput   = container.querySelector('#toolbar-search');
  const sortBtn       = container.querySelector('[data-sort-select]');
  const sortMenu      = container.querySelector('.custom-select__menu');

  const reRenderGrid = () => renderGrid(container, collection, allItems, accent);

  searchInput.addEventListener('input', reRenderGrid);

  const wrapper = container.querySelector('#sort-select-wrapper');

  function openMenu()  {
    sortMenu.classList.remove('hidden');
    sortBtn.classList.add('is-open');
    sortBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    sortMenu.classList.add('hidden');
    sortBtn.classList.remove('is-open');
    sortBtn.setAttribute('aria-expanded', 'false');
  }

  // Toggle menu open/close
  sortBtn.addEventListener('click', () => {
    sortMenu.classList.contains('hidden') ? openMenu() : closeMenu();
  });

  // Select an option
  sortMenu.querySelectorAll('.custom-select__option').forEach(opt => {
    opt.addEventListener('click', () => {
      sortBtn.dataset.sortValue = opt.dataset.value;
      sortBtn.querySelector('.custom-select__label').textContent = opt.textContent;
      closeMenu();
      reRenderGrid();
    });
  });

  // Close on outside click (only when click is outside the wrapper)
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeMenu();
  });

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      reRenderGrid();
    });
  });

  renderGrid(container, collection, allItems, accent);
}

function renderFilterBar(allFormats, activeFormats, formatOpts) {
  const chips = allFormats.map(fmt => {
    const label  = formatOpts.find(o => o.value === fmt)?.label ?? fmt;
    const active = activeFormats.includes(fmt) ? 'active' : '';
    return `<div class="filter-chip ${active}" data-format="${escapeHtml(fmt)}">${label}</div>`;
  }).join('');
  return `<div class="filter-bar">${chips}</div>`;
}

function renderGrid(container, collection, allItems, accent = '#e85d04') {
  const search      = container.querySelector('#toolbar-search')?.value.toLowerCase() ?? '';
  const sort        = container.querySelector('[data-sort-select]')?.dataset.sortValue ?? 'addedAt';
  const activeChips = [...container.querySelectorAll('.filter-chip.active')].map(c => c.dataset.format);

  let items = [...allItems];

  if (search)             items = items.filter(i => i.title?.toLowerCase().includes(search));
  if (activeChips.length) items = items.filter(i => activeChips.includes(i.mediaFormat));

  items.sort((a, b) => {
    if (sort === 'title')   return (a.title ?? '').localeCompare(b.title ?? '');
    if (sort === 'year')    return (b.year ?? 0) - (a.year ?? 0);
    return new Date(b.addedAt) - new Date(a.addedAt); // addedAt default
  });

  const grid = container.querySelector('#item-grid');
  const icon = CATEGORY_ICONS[collection.category] ?? '📦';

  if (items.length === 0) {
    const isEmpty = allItems.length === 0;
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"></div>
        <p class="empty-state__title">${isEmpty ? 'Nothing here yet' : 'No matches'}</p>
        <p class="empty-state__desc">${isEmpty ? 'Add your first item to this collection.' : 'Try a different search or filter.'}</p>
        ${isEmpty ? `<button class="btn btn-gradient" id="empty-add-btn">+ Add Item</button>` : ''}
      </div>
    `;
    if (isEmpty) {
      grid.querySelector('#empty-add-btn').addEventListener('click', () => {
        import('../modals/addEditItem.js').then(m => m.openAddItemModal(collection.id));
      });
    }
    return;
  }

  grid.innerHTML = '<div class="card-grid" id="media-card-grid"></div>';
  const cardGrid = grid.querySelector('#media-card-grid');

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.style.setProperty('--card-accent', accent);
    card.innerHTML = `
      ${coverImgOrPlaceholder(item.coverUrl, icon)}
      <div class="media-card__body">
        <div class="media-card__title">${escapeHtml(item.title ?? 'Untitled')}</div>
        <div class="media-card__meta">${[item.mediaFormat, item.year].filter(Boolean).join(' · ')}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      import('../modals/itemDetail.js').then(m =>
        m.openItemDetailModal(item.id, collection, () => refreshCollection())
      );
    });
    cardGrid.appendChild(card);
  });
}
