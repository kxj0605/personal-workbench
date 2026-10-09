export const CONTENT_DIMENSIONS = [
  { key: 'hookType', label: '钩子类型', options: ['悬念提问', '冲突开场', '结果前置', '身份反差', '情绪刺激', '其他'] },
  { key: 'characterSetup', label: '人物设定', options: ['普通人逆袭', '隐瞒身份', '亲情关系', '职场关系', '恩人/受助者', '其他'] },
  { key: 'reversalTiming', label: '反转时机', options: ['开场', '前段', '中段', '结尾', '多次反转', '无反转'] },
  { key: 'conflictIntensity', label: '冲突强度', options: ['低', '中', '高'] },
  { key: 'visualStyle', label: '视听风格', options: ['口播', '情景短剧', '混剪', '纪录感', '电影感', '其他'] },
];

export const VIDEO_PROFILE_FIELDS = [
  ...CONTENT_DIMENSIONS,
  { key: 'grade', label: '数据等级', options: ['S', 'A', 'B', 'C'] },
  { key: 'followerScale', label: '账号粉丝量级', options: ['1万以下', '1万–10万', '10万–100万', '100万以上'] },
  { key: 'isSeries', label: '是否合集', options: ['是', '否'] },
];

export const COUNT_BANDS = [
  { value: '0-99', label: '0–99', min: 0, max: 99 },
  { value: '100-999', label: '100–999', min: 100, max: 999 },
  { value: '1000-9999', label: '1千–9999', min: 1000, max: 9999 },
  { value: '10000+', label: '1万以上', min: 10000, max: Infinity },
];

export const TOPIC_VIDEO_FILTERS = [
  ...CONTENT_DIMENSIONS.map(({ key, label, options }) => ({ key, label, options: [...options, '未标注'] })),
  { key: 'grade', label: '数据等级', options: ['S', 'A', 'B', 'C', '未标注'] },
  { key: 'commentRange', label: '评论区间', options: [...COUNT_BANDS.map(({ value, label }) => ({ value, label })), { value: 'missing', label: '未录入' }] },
  { key: 'shareRange', label: '转发区间', options: [...COUNT_BANDS.map(({ value, label }) => ({ value, label })), { value: 'missing', label: '未录入' }] },
  { key: 'followerScale', label: '账号粉丝量级', options: ['1万以下', '1万–10万', '10万–100万', '100万以上', '未标注'] },
  { key: 'publishWindow', label: '发布时间', options: [{ value: '7d', label: '最近 7 天' }, { value: '30d', label: '最近 30 天' }, { value: '365d', label: '最近一年' }, { value: 'older', label: '更早' }, { value: 'missing', label: '未录入' }] },
  { key: 'durationRange', label: '视频时长', options: [{ value: '0-30', label: '30 秒以内' }, { value: '31-60', label: '31–60 秒' }, { value: '61-180', label: '1–3 分钟' }, { value: '181+', label: '3 分钟以上' }, { value: 'missing', label: '未录入' }] },
  { key: 'isSeries', label: '是否合集', options: ['是', '否', '未标注'] },
];

export function parseMetricCount(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  const normalized = String(value || '').trim().replaceAll(',', '').replaceAll('，', '');
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(亿|万|千|k|K)?$/);
  if (!match) return null;
  return Number(match[1]) * ({ 亿: 1e8, 万: 1e4, 千: 1e3, k: 1e3, K: 1e3 }[match[2]] || 1);
}

export function parseDuration(value) {
  const text = String(value || '').trim();
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(text)) return text.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
  const match = text.match(/^(?:(\d+)分)?(?:(\d+)秒)?$/);
  return match && (match[1] || match[2]) ? Number(match[1] || 0) * 60 + Number(match[2] || 0) : null;
}

export function getVideoIndicators(video) {
  const source = video.details?.metadata || {};
  const views = parseMetricCount(source['benchmark-view-count']);
  const comments = parseMetricCount(source['benchmark-comment-count']);
  const shares = parseMetricCount(source['benchmark-share-count']);
  return {
    views,
    comments,
    shares,
    viewsText: source['benchmark-view-count'] || '未录入',
    commentRate: views > 0 && comments !== null ? comments / views : null,
    shareRate: views > 0 && shares !== null ? shares / views : null,
  };
}

const countBand = (count) => count === null ? 'missing' : COUNT_BANDS.find(({ min, max }) => count >= min && count <= max)?.value || 'missing';

export function getVideoFilterValue(video, key, now = Date.now()) {
  const profile = video.researchProfile || {};
  const metadata = video.details?.metadata || {};
  if (key === 'commentRange') return countBand(parseMetricCount(metadata['benchmark-comment-count']));
  if (key === 'shareRange') return countBand(parseMetricCount(metadata['benchmark-share-count']));
  if (key === 'durationRange') {
    const seconds = parseDuration(metadata['benchmark-video-duration']);
    return seconds === null ? 'missing' : seconds <= 30 ? '0-30' : seconds <= 60 ? '31-60' : seconds <= 180 ? '61-180' : '181+';
  }
  if (key === 'publishWindow') {
    const timestamp = Date.parse(metadata['benchmark-published-at'] || '');
    if (!Number.isFinite(timestamp)) return 'missing';
    const days = (now - timestamp) / 86400000;
    return days < 0 ? 'missing' : days <= 7 ? '7d' : days <= 30 ? '30d' : days <= 365 ? '365d' : 'older';
  }
  return profile[key] || '未标注';
}

export function matchesTopicVideoFilters(video, filters) {
  return Object.entries(filters).every(([key, value]) => !value || getVideoFilterValue(video, key) === value);
}

export function getVideoCoreTags(video) {
  const profile = video.researchProfile || {};
  const structured = CONTENT_DIMENSIONS.map(({ key }) => profile[key]).filter(Boolean);
  return structured.length ? structured.slice(0, 3) : (video.tags || []).slice(0, 3);
}

export function autoPairByDimension(videos, dimension) {
  const buckets = new Map();
  for (const video of videos) {
    const value = video.researchProfile?.[dimension];
    if (!value) continue;
    if (!buckets.has(value)) buckets.set(value, []);
    buckets.get(value).push(video);
  }
  const groups = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length);
  if (groups.length < 2) return [];
  const pairs = [];
  while (pairs.length < 3) {
    const available = groups.filter(([, items]) => items.length);
    if (available.length < 2) break;
    const [first, second] = available;
    pairs.push([first[1].shift(), second[1].shift()]);
    groups.sort((a, b) => b[1].length - a[1].length);
  }
  return pairs;
}
