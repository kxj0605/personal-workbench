import { loadBenchmarkAccounts, loadBenchmarkVideos } from './benchmarkLibrary';
import { loadTopicCategories, loadTopicMetadata, loadTopicSummaries, loadTopicFavorites, loadTopicRecents, loadTopicGuide, topicKey } from './topicLibrary';

const EXTRA_KEY = 'benchmark-hub-integration-v1';
const BACKUP_KEY = 'benchmark-hub-before-integration-v1';
const keys = ['benchmark-accounts-v1', 'video-collection-v1', 'benchmark-topic-groups-v1', 'benchmark-topic-summaries-v1', 'benchmark-topic-metadata-v1', 'benchmark-topic-favorites-v1', 'benchmark-topic-recents-v1', 'benchmark-topic-guide-v1', 'benchmark-topic-categories-v1', EXTRA_KEY];
const read = (key, fallback) => { const text = localStorage.getItem(key); return text === null ? fallback : JSON.parse(text); };
const number = (value) => {
  if (value === '' || value == null) return null;
  const text = String(value).replace(/,/g, '').trim();
  const match = text.match(/^([\d.]+)\s*(万|亿|[kKmM])?$/);
  return match ? Number(match[1]) * ({ 万: 10000, 亿: 1e8, k: 1000, m: 1e6 }[match[2]?.toLowerCase()] || 1) : null;
};
const metrics = { views: 'benchmark-view-count', likes: 'benchmark-like-count', comments: 'benchmark-comment-count', shares: 'benchmark-share-count', collects: 'benchmark-favorite-count' };

export function loadBenchmarkHub() {
  // Refuse corrupt records rather than replacing user data with empty defaults.
  keys.forEach((key) => { if (localStorage.getItem(key) !== null) JSON.parse(localStorage.getItem(key)); });
  const extra = read(EXTRA_KEY, {});
  const metadata = loadTopicMetadata();
  const summaries = loadTopicSummaries();
  const favorites = loadTopicFavorites();
  const videos = loadBenchmarkVideos();
  const names = [...new Set([...read('benchmark-topic-groups-v1', []), ...videos.map(v => v.topicGroup)].filter(Boolean))];
  const categories = loadTopicCategories().map(name => ({ id: `cat-${encodeURIComponent(name)}`, name }));
  const motifs = names.map(name => {
    const key = topicKey(name), meta = metadata[key] || {};
    return { id: `mot-${encodeURIComponent(key)}`, name, categoryId: categories.find(c => c.name === meta.category)?.id || '', skeleton: summaries[key] || '', roles: meta.roleFunction || '', logic: meta.plotLogic || '', emotion: meta.emotionClosure || '', theme: meta.coreTheme || '', adaptationDirection: meta.adaptationDirection || '', tags: meta.directions || [], isFavorite: favorites.includes(key), updatedAt: meta.updatedAt || '', legacyKey: key };
  });
  const guide = loadTopicGuide();
  return {
    categories, motifs,
    creators: loadBenchmarkAccounts().map(c => ({ ...c, reason: c.note || '' })),
    videos: videos.map(v => {
      const m = v.details?.metadata || {};
      const motif = motifs.find(t => t.legacyKey === topicKey(v.topicGroup));
      const platformOverride = v.platformOverride;
      const imported = { importedMetadata: m };
      return { ...extra.videos?.[v.id], ...imported, id: v.id, title: v.title || m['benchmark-video-title'] || '', url: v.url || '', platform: v.platform || '其他', platformOverride, motifId: motif?.id || '', creatorId: v.accountId || '', creatorName: m['benchmark-author'] || m['benchmark-channel-name'] || '', tags: (v.tags || []).join(', '), duration: m['benchmark-video-duration'] || '', ...Object.fromEntries(Object.entries(metrics).map(([field, key]) => [field, number(m[key])])), grade: v.researchProfile?.grade || '', isBenchmark: (metadata[motif?.legacyKey]?.benchmarkIds || []).includes(v.id), hook: v.comparison?.opening || '', conflict: v.comparison?.characterConflict || '', twist: v.comparison?.twist || '', ending: v.comparison?.ending || '', takeaway: v.comparison?.takeaway || '' };
    }),
    methodology: [guide.framework, guide.steps].filter(Boolean).join('\n\n') || extra.methodology || '',
    recentMotifIds: loadTopicRecents().map(key => motifs.find(m => m.legacyKey === key)?.id).filter(Boolean),
  };
}

export function saveBenchmarkHub(data) {
  const oldVideos = loadBenchmarkVideos(), oldAccounts = loadBenchmarkAccounts();
  const oldMetadata = loadTopicMetadata();
  const metadata = {}, summaries = {};
  const now = new Date().toISOString();
  for (const motif of data.motifs) {
    const key = topicKey(motif.name);
    metadata[key] = { ...(oldMetadata[key] || oldMetadata[motif.legacyKey]), category: data.categories.find(c => c.id === motif.categoryId)?.name || '', roleFunction: motif.roles, plotLogic: motif.logic, emotionClosure: motif.emotion, coreTheme: motif.theme, adaptationDirection: motif.adaptationDirection || '', directions: motif.tags, updatedAt: motif.updatedAt, benchmarkIds: data.videos.filter(v => v.motifId === motif.id && v.isBenchmark).map(v => v.id) };
    summaries[key] = motif.skeleton || '';
  }
  const videos = data.videos.map(v => {
    const old = oldVideos.find(x => x.id === v.id) || {};
    const m = { ...old.details?.metadata, ...v.importedMetadata, 'benchmark-video-title': v.title, 'benchmark-video-url': v.url, 'benchmark-video-duration': v.duration };
    for (const [field, key] of Object.entries(metrics)) {
      if (number(m[key]) !== v[field]) m[key] = v[field] == null ? '' : String(v[field]);
    }
    return { ...old, id: v.id, title: v.title, url: v.url, platform: v.platform, platformOverride: v.platformOverride ?? old.platformOverride, accountId: v.creatorId || '', topicGroup: data.motifs.find(t => t.id === v.motifId)?.name || '', tags: (v.tags || '').split(/[,，]/).map(t => t.trim()).filter(Boolean), category: old.category || '情绪', status: old.status || 'pending', createdAt: old.createdAt || now, details: { ...old.details, metadata: m }, researchProfile: { ...old.researchProfile, grade: v.grade }, comparison: { ...old.comparison, opening: v.hook, characterConflict: v.conflict, twist: v.twist, ending: v.ending, takeaway: v.takeaway } };
  });
  const accounts = data.creators.map(c => ({ ...oldAccounts.find(x => x.id === c.id), id: c.id, name: c.name, platform: c.platform, url: c.url, niche: c.niche, note: c.reason, workCount: c.workCount ?? null, followerCount: c.followerCount ?? null, createdAt: c.createdAt || now }));
  const writes = {
    'benchmark-accounts-v1': accounts, 'video-collection-v1': videos,
    'benchmark-topic-groups-v1': data.motifs.map(m => m.name),
    'benchmark-topic-categories-v1': data.categories.map(c => c.name),
    'benchmark-topic-metadata-v1': metadata, 'benchmark-topic-summaries-v1': summaries,
    'benchmark-topic-favorites-v1': data.motifs.filter(m => m.isFavorite).map(m => topicKey(m.name)),
    'benchmark-topic-recents-v1': (data.recentMotifIds || []).map(id => data.motifs.find(m => m.id === id)?.name).filter(Boolean).map(topicKey),
    [EXTRA_KEY]: { methodology: data.methodology, videos: Object.fromEntries(data.videos.map(v => [v.id, { metricDate: v.metricDate }])) },
  };
  const guide = loadTopicGuide();
  if (data.methodology !== [guide.framework, guide.steps].filter(Boolean).join('\n\n')) writes['benchmark-topic-guide-v1'] = { ...guide, framework: data.methodology || '', steps: '' };
  const before = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
  if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, JSON.stringify(before));
  try { for (const [key, value] of Object.entries(writes)) localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { for (const [key, value] of Object.entries(before)) { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } throw error; }
  return videos;
}
