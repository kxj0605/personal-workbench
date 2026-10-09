export const TOPIC_GROUPS_KEY = 'benchmark-topic-groups-v1';
export const TOPIC_SUMMARIES_KEY = 'benchmark-topic-summaries-v1';
export const TOPIC_METADATA_KEY = 'benchmark-topic-metadata-v1';
export const TOPIC_FAVORITES_KEY = 'benchmark-topic-favorites-v1';
export const TOPIC_RECENTS_KEY = 'benchmark-topic-recents-v1';
export const TOPIC_GUIDE_KEY = 'benchmark-topic-guide-v1';
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
