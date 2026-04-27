// ── views/collection.js ───────────────────────────────────────
// Collection view — item grid with sort and filter controls.

import { getCollection, getCollections, getItems } from '../store.js';
import { navigate }                 from '../router.js';
import {
  CATEGORY_ICONS, FORMAT_OPTIONS, getAccentColor,
  coverImgOrPlaceholder, escapeHtml,
} from '../ui.js';

let currentCollectionId = null;
let currentAccent = null;
let renderAbortController = null;

export function mountCollection(container, { collectionId }) {
  currentCollectionId = collectionId;
  const collection = getCollection(collectionId);
  if (!collection) { navigate('home'); return; }
  const colIndex = getCollections().findIndex(c => c.id === collectionId);
  currentAccent = getAccentColor(colIndex);
  render(container, collection);
}

// Called by modals after saving/deleting an item
export function refreshCollection() {
  const collection = getCollection(currentCollectionId);
  const container  = document.getElementById('app');
  if (collection && container) render(container, collection);
}

function render(container, collection) {
  // Abort any document listeners from a previous render
  if (renderAbortController) renderAbortController.abort();
  renderAbortController = new AbortController();
  const { signal } = renderAbortController;

  const allItems    = getItems(collection.id);
  const icon        = CATEGORY_ICONS[collection.category] ?? 'MISC';
  const colIndex    = getCollections().findIndex(c => c.id === collection.id);
  const accent      = getAccentColor(colIndex);
  const formatOpts  = FORMAT_OPTIONS[collection.category] ?? [];
  const allFormats  = [...new Set(allItems.flatMap(i => i.mediaFormat).filter(Boolean))];

  const SORT_OPTIONS = [
    { value: 'addedAt', label: 'Date Added' },
    { value: 'title',   label: 'Title A–Z'  },
  ];

  // Read current filter/sort state from DOM if it exists (for re-renders)
  const prevSort    = container.querySelector('[data-sort-select]')?.dataset.sortValue ?? 'addedAt';
  const prevSearch  = container.querySelector('#toolbar-search')?.value ?? '';
  const prevFormats = [...(container.querySelectorAll('.filter-chip.active') ?? [])]
    .map(el => el.dataset.format);

  const activeSortLabel = prevSort === 'addedAt' ? 'Sort By' : (SORT_OPTIONS.find(o => o.value === prevSort)?.label ?? 'Sort By');

  container.innerHTML = `
    <div class="view-title-row">
      <button class="back-btn" id="back-btn">&#9664;&#9664;</button>
      <h2 class="view-heading">${escapeHtml(collection.name)}</h2>
      <div class="toolbar-right">
        ${allItems.length > 0 ? `<button class="btn btn-red" id="toolbar-add-btn">+ Add Item</button>` : ''}
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
        <div class="toolbar-search-wrap${prevSearch ? ' is-open' : ''}" id="toolbar-search-wrap">
          <input
            class="form-input toolbar-search"
            id="toolbar-search"
            type="search"
            placeholder="Filter titles…"
            value="${escapeHtml(prevSearch)}"
          >
          <button class="toolbar-search-toggle" id="toolbar-search-toggle" aria-label="Search" aria-expanded="${prevSearch ? 'true' : 'false'}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="2"/>
              <line x1="10.35" y1="10.35" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    ${allFormats.length > 1 ? renderFilterBar(allFormats, prevFormats, formatOpts) : ''}
    <div id="item-grid"></div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('home'));

  container.querySelector('#toolbar-add-btn')?.addEventListener('click', () => {
    import('../modals/addEditItem.js').then(m => m.openAddItemModal(collection.id));
  });

  const searchInput    = container.querySelector('#toolbar-search');
  const searchWrap     = container.querySelector('#toolbar-search-wrap');
  const searchToggle   = container.querySelector('#toolbar-search-toggle');
  const sortBtn        = container.querySelector('[data-sort-select]');
  const sortMenu       = container.querySelector('.custom-select__menu');

  const reRenderGrid = () => renderGrid(container, collection, allItems, accent);

  searchToggle.addEventListener('click', () => {
    const opening = !searchWrap.classList.contains('is-open');
    searchWrap.classList.toggle('is-open', opening);
    searchToggle.setAttribute('aria-expanded', String(opening));
    if (opening) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      reRenderGrid();
    }
  });

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

  // Close sort menu and search on outside click — removed automatically on next render via AbortController
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeMenu();
    if (!searchWrap.contains(e.target)) {
      searchWrap.classList.remove('is-open');
      searchToggle.setAttribute('aria-expanded', 'false');
      searchInput.value = '';
      reRenderGrid();
    }
  }, { signal });

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
  if (activeChips.length) items = items.filter(i => activeChips.some(chip => i.mediaFormat.includes(chip)));

  if (sort === 'addedAt') {
    const ts = new Map(items.map(i => [i.id, Date.parse(i.addedAt)]));
    items.sort((a, b) => ts.get(b.id) - ts.get(a.id));
  } else {
    items.sort((a, b) => {
      if (sort === 'title') return (a.title ?? '').localeCompare(b.title ?? '');
      if (sort === 'year')  return (b.year ?? 0) - (a.year ?? 0);
      return 0;
    });
  }

  const grid = container.querySelector('#item-grid');
  const icon = CATEGORY_ICONS[collection.category] ?? '📦';

  if (items.length === 0) {
    const isEmpty = allItems.length === 0;
    grid.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__title">${isEmpty ? 'Nothing here yet' : 'No matches'}</p>
        <p class="empty-state__desc">${isEmpty ? 'Add your first item to this collection.' : 'Try a different search or filter.'}</p>
        ${isEmpty ? `<button class="btn btn-red" id="empty-add-btn">+ Add Item</button>` : ''}
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
      ${coverImgOrPlaceholder(item.coverUrl, item.title ?? '')}
      <div class="media-card__body">
        <div class="media-card__title">${escapeHtml(item.title ?? 'Untitled')}</div>
        <div class="media-card__meta">${[item.mediaFormat.join(', '), item.year].filter(Boolean).join(' · ')}</div>
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
