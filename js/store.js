// ── store.js ──────────────────────────────────────────────────
// All localStorage read/write. The rest of the app never touches
// localStorage directly — it only calls these helpers.

const STORAGE_KEY = 'remedia_data';

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { collections: [], items: [] };
  } catch {
    return { collections: [], items: [] };
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Collections ───────────────────────────────────────────────

export function getCollections() {
  return load().collections;
}

export function getCollection(id) {
  return load().collections.find(c => c.id === id) ?? null;
}

export function createCollection({ name, category, customCategoryLabel = '' }) {
  const data = load();
  const collection = {
    id: generateId(),
    name,
    category,           // 'movies' | 'music' | 'custom'
    customCategoryLabel,
    createdAt: new Date().toISOString(),
  };
  data.collections.push(collection);
  save(data);
  return collection;
}

export function updateCollection(id, changes) {
  const data = load();
  const idx = data.collections.findIndex(c => c.id === id);
  if (idx === -1) return null;
  data.collections[idx] = { ...data.collections[idx], ...changes };
  save(data);
  return data.collections[idx];
}

export function deleteCollection(id) {
  const data = load();
  data.collections = data.collections.filter(c => c.id !== id);
  data.items        = data.items.filter(i => i.collectionId !== id);
  save(data);
}

// ── Items ─────────────────────────────────────────────────────

export function getItems(collectionId) {
  return load().items.filter(i => i.collectionId === collectionId);
}

export function getItem(id) {
  return load().items.find(i => i.id === id) ?? null;
}

export function createItem(fields) {
  const data = load();
  const item = {
    ...fields,
    id:      generateId(),
    addedAt: new Date().toISOString(),
  };
  data.items.push(item);
  save(data);
  return item;
}

export function updateItem(id, changes) {
  const data = load();
  const idx = data.items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  data.items[idx] = { ...data.items[idx], ...changes };
  save(data);
  return data.items[idx];
}

export function deleteItem(id) {
  const data = load();
  data.items = data.items.filter(i => i.id !== id);
  save(data);
}

// ── Counts ────────────────────────────────────────────────────

export function itemCountByCollection() {
  const items = load().items;
  return items.reduce((acc, item) => {
    acc[item.collectionId] = (acc[item.collectionId] ?? 0) + 1;
    return acc;
  }, {});
}
