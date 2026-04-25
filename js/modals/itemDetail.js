// ── modals/itemDetail.js ──────────────────────────────────────
// Read-only item detail modal with Edit and Delete actions.

import { getItem, deleteItem } from '../store.js';
import { openModal, closeModal, showToast, CATEGORY_ICONS, escapeHtml } from '../ui.js';
import { openEditItemModal } from './addEditItem.js';

export function openItemDetailModal(itemId, collection, onChanged) {
  const item = getItem(itemId);
  if (!item) return;

  const icon = CATEGORY_ICONS[collection.category] ?? '📦';

  openModal(`
    <div class="modal__header">
      <h2 class="modal__title">${escapeHtml(item.title ?? 'Untitled')}</h2>
      <button class="modal__close" aria-label="Close">&times;</button>
    </div>

    <div style="display:flex;gap:var(--space-lg);align-items:flex-start">
      ${item.coverUrl
        ? `<img src="${escapeHtml(item.coverUrl)}" alt="cover"
             style="width:120px;border-radius:var(--radius-md);flex-shrink:0">`
        : `<div style="width:120px;height:180px;background:var(--color-bg-elevated);
                       border-radius:var(--radius-md);display:flex;align-items:center;
                       justify-content:center;font-size:3rem;flex-shrink:0">${icon}</div>`
      }
      <div style="flex:1;min-width:0">
        ${detailRow('Format', item.mediaFormat)}
        ${detailRow('Year',   item.year)}
        ${collection.category === 'movies' ? `
          ${detailRow('Director', item.director)}
        ` : ''}
        ${collection.category === 'music' ? `
          ${detailRow('Artist', item.artist)}
          ${detailRow('Genre',  item.genre)}
        ` : ''}
        ${item.overview ? `
          <div style="margin-top:var(--space-sm)">
            <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted)">Summary</span>
            <p style="font-size:0.85rem;color:var(--color-text-muted);margin-top:2px">${escapeHtml(item.overview)}</p>
          </div>` : ''}
        ${item.notes ? `
          <div style="margin-top:var(--space-sm)">
            <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted)">Notes</span>
            <p style="font-size:0.85rem;margin-top:2px">${escapeHtml(item.notes)}</p>
          </div>` : ''}
      </div>
    </div>

    <div class="modal__footer">
      <button class="btn btn-danger" id="detail-delete-btn">Delete</button>
      <button class="btn btn-ghost"         id="detail-close-btn">Close</button>
      <button class="btn btn-gradient"      id="detail-edit-btn">Edit</button>
    </div>
  `);

  document.getElementById('detail-close-btn').addEventListener('click', () => closeModal());

  document.getElementById('detail-edit-btn').addEventListener('click', () => {
    closeModal();
    openEditItemModal(item.id, collection.id);
  });

  document.getElementById('detail-delete-btn').addEventListener('click', () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    deleteItem(item.id);
    closeModal();
    showToast(`"${item.title}" deleted`);
    if (onChanged) onChanged();
  });
}

function detailRow(label, value) {
  if (!value) return '';
  return `
    <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-xs);font-size:0.85rem">
      <span style="color:var(--color-text-muted);min-width:64px;font-weight:700;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase">${escapeHtml(label)}</span>
      <span>${escapeHtml(String(value))}</span>
    </div>
  `;
}
