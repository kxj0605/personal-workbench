export const TOPIC_GROUPS_KEY = 'benchmark-topic-groups-v1';
export const TOPIC_SUMMARIES_KEY = 'benchmark-topic-summaries-v1';
export const TOPIC_METADATA_KEY = 'benchmark-topic-metadata-v1';
export const TOPIC_FAVORITES_KEY = 'benchmark-topic-favorites-v1';
export const TOPIC_RECENTS_KEY = 'benchmark-topic-recents-v1';
export const TOPIC_GUIDE_KEY = 'benchmark-topic-guide-v1';
export const TOPIC_CATEGORIES_KEY = 'benchmark-topic-categories-v1';
export const TOPIC_CATEGORIES = ['报恩', '逆袭', '爽文', '情感', '其他'];

export const topicKey = (value = '') => String(value).trim().replace(/\s+/g, ' ').toLocaleLowerCase('zh-CN');

function loadObject(key) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function loadArray(key) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function loadTopicSummaries() {
  return loadObject(TOPIC_SUMMARIES_KEY);
}

export const loadTopicMetadata = () => loadObject(TOPIC_METADATA_KEY);
export function loadTopicCategories() {
  const saved = window.localStorage.getItem(TOPIC_CATEGORIES_KEY);
  if (saved !== null) {
    try {
      const values = JSON.parse(saved);
      if (Array.isArray(values)) return [...new Set(values.filter((value) => typeof value === 'string').map((value) => value.trim()).filter((value) => value && value !== '未分类'))];
    } catch { /* Fall back to the original categories. */ }
  }
  return [...new Set([...TOPIC_CATEGORIES, ...Object.values(loadTopicMetadata()).map((meta) => meta?.category)].filter((value) => typeof value === 'string' && value.trim() && value !== '未分类'))];
}
export function saveTopicCategories(categories) {
  window.localStorage.setItem(TOPIC_CATEGORIES_KEY, JSON.stringify(categories));
  return categories;
}
function reassignTopicCategory(source, target) {
  const metadata = loadTopicMetadata();
  const updatedAt = new Date().toISOString();
  for (const [key, meta] of Object.entries(metadata)) {
    if (meta?.category === source) metadata[key] = { ...meta, category: target, updatedAt };
  }
  window.localStorage.setItem(TOPIC_METADATA_KEY, JSON.stringify(metadata));
  return metadata;
}
export function renameTopicCategory(source, target) {
  const categories = saveTopicCategories(loadTopicCategories().map((name) => name === source ? target : name));
  return { categories, metadata: reassignTopicCategory(source, target) };
}
export function deleteTopicCategory(source, target = '') {
  const categories = saveTopicCategories(loadTopicCategories().filter((name) => name !== source));
  return { categories, metadata: reassignTopicCategory(source, target) };
}
export const loadTopicFavorites = () => loadArray(TOPIC_FAVORITES_KEY);
export const loadTopicRecents = () => loadArray(TOPIC_RECENTS_KEY);
export const loadTopicGuide = () => loadObject(TOPIC_GUIDE_KEY);

export function saveTopicMetadata(name, changes) {
  const key = topicKey(name);
  const next = loadTopicMetadata();
  next[key] = { ...(next[key] || {}), ...changes, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(TOPIC_METADATA_KEY, JSON.stringify(next));
  return next;
}

export function saveTopicSummary(name, summary) {
  const next = { ...loadTopicSummaries(), [topicKey(name)]: summary.trim() };
  window.localStorage.setItem(TOPIC_SUMMARIES_KEY, JSON.stringify(next));
  saveTopicMetadata(name, {});
  return next;
}

export function saveTopicFavorites(values) {
  const next = [...new Set(values.map(topicKey).filter(Boolean))];
  window.localStorage.setItem(TOPIC_FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function recordTopicVisit(name) {
  const key = topicKey(name);
  const next = [key, ...loadTopicRecents().filter((item) => item !== key)].slice(0, 8);
  window.localStorage.setItem(TOPIC_RECENTS_KEY, JSON.stringify(next));
  return next;
}

export function saveTopicGuide(guide) {
  window.localStorage.setItem(TOPIC_GUIDE_KEY, JSON.stringify(guide));
}

export function moveTopicSummary(source, target, keepTarget = false) {
  const next = loadTopicSummaries();
  const sourceKey = topicKey(source);
  const targetKey = topicKey(target);
  if (sourceKey === targetKey) return;
  if (next[sourceKey] && (!keepTarget || !next[targetKey])) next[targetKey] = next[sourceKey];
  delete next[sourceKey];
  window.localStorage.setItem(TOPIC_SUMMARIES_KEY, JSON.stringify(next));
  const metadata = loadTopicMetadata();
  if (metadata[sourceKey]) metadata[targetKey] = keepTarget && metadata[targetKey] ? {
    ...metadata[sourceKey], ...metadata[targetKey],
    benchmarkIds: [...new Set([...(metadata[targetKey].benchmarkIds || []), ...(metadata[sourceKey].benchmarkIds || [])])],
  } : metadata[sourceKey];
  delete metadata[sourceKey];
  window.localStorage.setItem(TOPIC_METADATA_KEY, JSON.stringify(metadata));
  saveTopicFavorites(loadTopicFavorites().map((key) => key === sourceKey ? targetKey : key));
  const recents = [...new Set(loadTopicRecents().map((key) => key === sourceKey ? targetKey : key))];
  window.localStorage.setItem(TOPIC_RECENTS_KEY, JSON.stringify(recents));
}
