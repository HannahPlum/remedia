// ── modals/newCollection.js ───────────────────────────────────
// Modal for creating a new collection.

import { createCollection }  from '../store.js';
import { openModal, closeModal, showToast } from '../ui.js';
import { navigate }           from '../router.js';

export function openNewCollectionModal(onCreated) {
  openModal(`
    <div class="modal__header">
      <h2 class="modal__title">New Collection</h2>
      <button class="modal__close" aria-label="Close">&times;</button>
    </div>

    <form id="new-collection-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="col-name">Collection Name</label>
        <input
          class="form-input"
          id="col-name"
          type="text"
          placeholder="e.g. My Blu-rays"
          maxlength="60"
          required
          autocomplete="off"
        >
      </div>

      <div class="form-group">
        <span class="form-label">Category</span>
        <div class="format-selector">
          <input class="format-option" type="radio" name="category" id="cat-movies" value="movies" checked>
          <label for="cat-movies">Movies</label>

          <input class="format-option" type="radio" name="category" id="cat-music" value="music">
          <label for="cat-music">Music</label>

          <input class="format-option" type="radio" name="category" id="cat-custom" value="custom">
          <label for="cat-custom">Custom</label>
        </div>
      </div>

      <div class="form-group hidden" id="custom-label-group">
        <label class="form-label" for="custom-label">Category Label</label>
        <input
          class="form-input"
          id="custom-label"
          type="text"
          placeholder="e.g. Comic Books, Video Games…"
          maxlength="40"
          autocomplete="off"
        >
      </div>

      <div class="modal__footer">
        <button type="button" class="btn btn-ghost" data-close-modal>Close</button>
        <button type="submit" class="btn btn-gradient">Create Collection</button>
      </div>
    </form>
  `);

  const form            = document.getElementById('new-collection-form');
  const customLabelGroup = document.getElementById('custom-label-group');
  const categoryRadios  = form.querySelectorAll('input[name="category"]');

  // Show/hide custom label field
  categoryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      customLabelGroup.classList.toggle('hidden', radio.value !== 'custom' || !radio.checked);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name     = form.querySelector('#col-name').value.trim();
    const category = form.querySelector('input[name="category"]:checked')?.value ?? 'movies';
    const customCategoryLabel = form.querySelector('#custom-label')?.value.trim() ?? '';

    if (!name) {
      form.querySelector('#col-name').focus();
      return;
    }

    const collection = createCollection({ name, category, customCategoryLabel });
    closeModal();
    showToast(`"${name}" created`);
    if (onCreated) onCreated(collection);
    else navigate('collection', { collectionId: collection.id });
  });
}
