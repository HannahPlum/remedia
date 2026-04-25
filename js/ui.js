// ── ui.js ─────────────────────────────────────────────────────
// Shared render helpers: modals, toasts, and element factories.

const overlay  = document.getElementById('modal-overlay');
const modalEl  = document.getElementById('modal');
const toastEl  = document.getElementById('toast');

let toastTimer = null;

// ── Modal ─────────────────────────────────────────────────────

/**
 * Open the shared modal with arbitrary HTML content.
 * @param {string} html
 * @param {{ onClose?: () => void }} [options]
 */
export function openModal(html, { onClose } = {}) {
  modalEl.innerHTML = html;
  overlay.classList.remove('hidden');
  // Focus first focusable element
  const first = modalEl.querySelector('button, input, select, textarea, [tabindex]');
  if (first) first.focus();

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal(onClose);
  };

  // Wire up all close triggers — header × uses .modal__close, footer uses [data-close-modal]
  modalEl.querySelectorAll('.modal__close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(onClose));
  });

  // Escape key
  overlay._escHandler = (e) => { if (e.key === 'Escape') closeModal(onClose); };
  document.addEventListener('keydown', overlay._escHandler);
}

/**
 * Opens a branded confirmation dialog.
 * @param {{ title?: string, message: string, confirmLabel?: string }} options
 * @returns {Promise<boolean>} resolves true if confirmed, false if cancelled
 */
export function confirmModal({ title = 'Are you sure?', message, confirmLabel = 'Delete' } = {}) {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal__header">
        <h2 class="modal__title">${escapeHtml(title)}</h2>
      </div>
      <p style="font-size:0.95rem;margin-bottom:var(--space-lg)">${escapeHtml(message)}</p>
      <div class="modal__footer">
        <button class="btn btn-ghost" id="confirm-cancel-btn">Close</button>
        <button class="btn btn-danger" id="confirm-ok-btn">${escapeHtml(confirmLabel)}</button>
      </div>
    `);

    document.getElementById('confirm-ok-btn').addEventListener('click', () => {
      closeModal();
      resolve(true);
    });
    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
      closeModal();
      resolve(false);
    });
  });
}

export function closeModal(callback) {
  overlay.classList.add('hidden');
  modalEl.innerHTML = '';
  document.removeEventListener('keydown', overlay._escHandler);
  if (callback) callback();
}

// ── Toast ─────────────────────────────────────────────────────

export function showToast(message, duration = 2800) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  // Force reflow so transition plays
  toastEl.offsetHeight; // eslint-disable-line no-unused-expressions
  toastEl.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 220);
  }, duration);
}

// ── Category helpers ──────────────────────────────────────────

export const ACCENT_COLORS = ['#e85d04', '#c0390b', '#d4920a', '#7a1c08', '#c8a882'];

export function getAccentColor(index) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

export const CATEGORY_ICONS = {
  movies: 'FILM',
  music:  'REC',
  custom: 'MISC',
};

export const FORMAT_OPTIONS = {
  movies: [
    { value: 'blu-ray',   label: 'Blu-ray' },
    { value: '4k-uhd',    label: '4K UHD' },
    { value: 'dvd',       label: 'DVD' },
    { value: 'vhs',       label: 'VHS' },
    { value: 'laserdisc', label: 'LaserDisc' },
  ],
  music: [
    { value: 'vinyl',    label: 'Vinyl' },
    { value: 'cd',       label: 'CD' },
    { value: 'cassette', label: 'Cassette' },
    { value: '8-track',  label: '8-Track' },
    { value: 'minidisc', label: 'MiniDisc' },
  ],
};

export function getCategoryLabel(collection) {
  if (collection.category === 'custom') {
    return collection.customCategoryLabel || 'Custom';
  }
  return collection.category === 'movies' ? 'Movies' : 'Music';
}

// ── Format pill renderer ──────────────────────────────────────

/**
 * Renders a group of checkbox pill buttons for format selection.
 * @param {'movies'|'music'} category
 * @param {string[]} [selected]  currently selected values (always an array)
 */
export function renderFormatSelector(category, selected = []) {
  const options = FORMAT_OPTIONS[category] ?? [];
  if (!options.length) return '';

  const pills = options.map(({ value, label }) => `
    <input
      class="format-option"
      type="checkbox"
      name="mediaFormat"
      id="fmt-${value}"
      value="${value}"
      ${selected.includes(value) ? 'checked' : ''}
    >
    <label for="fmt-${value}">${label}</label>
  `).join('');

  return `
    <div class="form-group">
      <span class="form-label">Format</span>
      <div class="format-selector">${pills}</div>
    </div>
  `;
}

// ── Cover image fallback ──────────────────────────────────────

export function coverImgOrPlaceholder(coverUrl, icon = '🎬') {
  if (coverUrl) {
    return `<img class="media-card__cover" src="${escapeAttr(coverUrl)}" alt="cover" loading="lazy">`;
  }
  return `<div class="media-card__cover-placeholder">${icon}</div>`;
}

// ── Escape helpers ────────────────────────────────────────────

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;');
}
