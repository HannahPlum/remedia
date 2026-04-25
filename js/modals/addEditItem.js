// ── modals/addEditItem.js ─────────────────────────────────────
// Modal for adding a new item or editing an existing one.
// Renders category-aware fields and wires up API search.

import { getCollection, createItem, updateItem, getItem } from '../store.js';
import { openModal, closeModal, showToast, renderFormatSelector, escapeHtml } from '../ui.js';
import { refreshCollection } from '../views/collection.js';
import { searchMoviesDebounced } from '../api/movies.js';
import { searchMusicDebounced, fetchCoverArt } from '../api/music.js';

export function openAddItemModal(collectionId) {
  _openModal(collectionId, null);
}

export function openEditItemModal(itemId, collectionId) {
  _openModal(collectionId, itemId);
}

function _openModal(collectionId, itemId) {
  const collection = getCollection(collectionId);
  if (!collection) return;

  const item     = itemId ? getItem(itemId) : null;
  const isEdit   = !!item;
  const category = collection.category;

  const modalAbort = new AbortController();

  openModal(`
    <div class="modal__header">
      <h2 class="modal__title">${isEdit ? 'Edit Item' : 'Add Item'}</h2>
      <button class="modal__close" aria-label="Close">&times;</button>
    </div>

    <form id="item-form" novalidate>
      ${category !== 'custom' ? `
      <div class="form-group">
        <label class="form-label" for="item-search">Search</label>
        <div class="search-wrapper">
          <input
            class="form-input"
            id="item-search"
            type="search"
            placeholder="${category === 'movies' ? 'Search movies…' : 'Search albums or artists…'}"
            autocomplete="off"
          >
          <div class="search-results hidden" id="search-results"></div>
        </div>
      </div>
      <hr class="divider">
      ` : ''}

      <div class="form-group">
        <label class="form-label" for="item-title">Title *</label>
        <input
          class="form-input"
          id="item-title"
          type="text"
          placeholder="Title"
          value="${escapeHtml(item?.title ?? '')}"
          required
          autocomplete="off"
        >
      </div>

      ${category === 'movies' ? renderMovieFields(item) : ''}
      ${category === 'music'  ? renderMusicFields(item)  : ''}

      ${renderFormatSelector(category, item?.mediaFormat ?? [])}

      <div class="form-group">
        <label class="form-label" for="item-notes">Notes</label>
        <textarea class="form-textarea" id="item-notes" placeholder="Any notes…">${escapeHtml(item?.notes ?? '')}</textarea>
      </div>

      <div class="modal__footer">
        <button type="button" class="btn btn-ghost" data-close-modal>Close</button>
        <button type="submit" class="btn btn-gradient">${isEdit ? 'Save Changes' : 'Add Item'}</button>
      </div>
    </form>
  `, { onClose: () => modalAbort.abort() });

  // ── Search wiring ─────────────────────────────────────────
  if (category !== 'custom') {
    const searchInput  = document.getElementById('item-search');
    const searchResults = document.getElementById('search-results');

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value;
      const handler = category === 'movies' ? searchMoviesDebounced : searchMusicDebounced;
      handler(q, (results) => {
        renderSearchResults(results, category, searchResults);
        // For music, lazily load cover art into each placeholder
        if (category === 'music') {
          searchResults.querySelectorAll('.result-cover-placeholder[data-mbid]').forEach(async (el) => {
            const mbid = el.dataset.mbid;
            if (!mbid) return;
            const coverUrl = await fetchCoverArt(mbid);
            if (coverUrl && el.isConnected) {
              const img = document.createElement('img');
              img.src = coverUrl;
              img.alt = '';
              img.style.cssText = 'width:36px;height:54px;object-fit:cover;border-radius:4px;flex-shrink:0';
              el.replaceWith(img);
            }
          });
        }
      }, () => {});
    });

    // Hide results on outside click — listener removed automatically when modal closes
    document.addEventListener('click', (e) => {
      if (!searchResults?.contains(e.target) && e.target !== searchInput) {
        searchResults?.classList.add('hidden');
      }
    }, { signal: modalAbort.signal });
  }

  // ── Form submit ───────────────────────────────────────────
  const form = document.getElementById('item-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = gatherFields(form, collectionId, category, item);
    if (!fields.title) {
      document.getElementById('item-title')?.focus();
      return;
    }
    if (isEdit) {
      updateItem(item.id, fields);
      showToast('Item updated');
    } else {
      createItem(fields);
      showToast(`"${fields.title}" added`);
    }
    modalAbort.abort();
    closeModal();
    refreshCollection();
  });
}

// ── Field renderers ───────────────────────────────────────────

function renderMovieFields(item) {
  return `
    <div class="form-group">
      <label class="form-label" for="item-year">Year</label>
      <input class="form-input" id="item-year" type="text" inputmode="numeric" min="1888" max="2099"
        placeholder="e.g. 1994" value="${escapeHtml(String(item?.year ?? ''))}">
    </div>
    <div class="form-group">
      <label class="form-label" for="item-director">Director</label>
      <input class="form-input" id="item-director" type="text"
        placeholder="Director" value="${escapeHtml(item?.director ?? '')}">
    </div>
    <div class="form-group">
      <label class="form-label" for="item-overview">Overview</label>
      <textarea class="form-textarea" id="item-overview" placeholder="Plot summary…">${escapeHtml(item?.overview ?? '')}</textarea>
    </div>
  `;
}

function renderMusicFields(item) {
  return `
    <div class="form-group">
      <label class="form-label" for="item-artist">Artist</label>
      <input class="form-input" id="item-artist" type="text"
        placeholder="Artist" value="${escapeHtml(item?.artist ?? '')}">
    </div>
    <div class="form-group">
      <label class="form-label" for="item-year">Year</label>
      <input class="form-input" id="item-year" type="text" inputmode="numeric" min="1877" max="2099"
        placeholder="e.g. 1991" value="${escapeHtml(String(item?.year ?? ''))}">
    </div>
    <div class="form-group">
      <label class="form-label" for="item-genre">Genre</label>
      <input class="form-input" id="item-genre" type="text"
        placeholder="Genre" value="${escapeHtml(item?.genre ?? '')}">
    </div>
  `;
}

// ── Search result rendering ───────────────────────────────────

function renderSearchResults(results, category, container) {
  if (!container) return;

  if (!results.length) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = results.map((r, i) => `
    <div class="search-result-item" data-index="${i}">
      ${r.coverUrl
        ? `<img src="${escapeHtml(r.coverUrl)}" alt="" loading="lazy">`
        : `<div class="result-cover-placeholder" data-mbid="${escapeHtml(r.mbid ?? '')}" style="width:36px;height:54px;background:var(--color-bg-elevated);border-radius:4px;flex-shrink:0"></div>`
      }
      <div class="search-result-item__info">
        <div class="search-result-item__title">${escapeHtml(r.title)}</div>
        <div class="search-result-item__sub">
          ${category === 'music' && r.artist ? escapeHtml(r.artist) + ' · ' : ''}${r.year ?? ''}
        </div>
      </div>
    </div>
  `).join('') + `<div class="search-manual-link">Enter manually instead</div>`;

  // Selecting a result fills the form
  container.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.addEventListener('click', async () => {
      const result = results[i];
      fillForm(result, category);
      container.classList.add('hidden');

      // Lazy-load cover art for music
      if (category === 'music' && result.mbid && !result.coverUrl) {
        const coverUrl = await fetchCoverArt(result.mbid);
        if (coverUrl) document.getElementById('item-cover-url-hidden')?.setAttribute('value', coverUrl);
      }
    });
  });

  container.querySelector('.search-manual-link')?.addEventListener('click', () => {
    container.classList.add('hidden');
  });
}

function fillForm(result, category) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.value = val;
  };

  set('item-title',    result.title);
  set('item-year',     result.year);

  if (category === 'movies') {
    set('item-director', result.director);
    set('item-overview', result.overview);
  }
  if (category === 'music') {
    set('item-artist', result.artist);
    set('item-genre',  result.genre);
  }

  // Store cover URL in a hidden input so gatherFields can pick it up
  let hidden = document.getElementById('item-cover-url-hidden');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id   = 'item-cover-url-hidden';
    document.getElementById('item-form')?.appendChild(hidden);
  }
  hidden.value = result.coverUrl ?? '';

  // Store source IDs
  let tmdbInput = document.getElementById('item-tmdb-id-hidden');
  if (!tmdbInput) {
    tmdbInput = document.createElement('input');
    tmdbInput.type = 'hidden';
    tmdbInput.id   = 'item-tmdb-id-hidden';
    document.getElementById('item-form')?.appendChild(tmdbInput);
  }
  tmdbInput.value = result.id ?? result.mbid ?? '';
}

// ── Gather all form values into an item object ────────────────

function gatherFields(form, collectionId, category, existingItem) {
  const val = (id) => form.querySelector(`#${id}`)?.value.trim() ?? '';
  const num = (id) => { const v = parseInt(val(id), 10); return isNaN(v) ? null : v; };

  const base = {
    collectionId,
    title:       val('item-title'),
    mediaFormat: [...form.querySelectorAll('input[name="mediaFormat"]:checked')].map(el => el.value),
    notes:       val('item-notes'),
    coverUrl:    form.querySelector('#item-cover-url-hidden')?.value || existingItem?.coverUrl || '',
  };

  if (category === 'movies') {
    return {
      ...base,
      year:     num('item-year'),
      director: val('item-director'),
      overview: val('item-overview'),
      tmdbId:   form.querySelector('#item-tmdb-id-hidden')?.value || existingItem?.tmdbId || null,
    };
  }

  if (category === 'music') {
    return {
      ...base,
      artist: val('item-artist'),
      year:   num('item-year'),
      genre:  val('item-genre'),
      mbid:   form.querySelector('#item-tmdb-id-hidden')?.value || existingItem?.mbid || null,
    };
  }

  return base; // custom
}
