export const BENCHMARK_ACCOUNTS_KEY = 'benchmark-accounts-v1';
export const BENCHMARK_VIDEOS_KEY = 'video-collection-v1';

export const makeBenchmarkId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function loadBenchmarkAccounts() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(BENCHMARK_ACCOUNTS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function loadBenchmarkVideos() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(BENCHMARK_VIDEOS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function getBenchmarkVideoSummary(video = {}) {
  const metadata = video.details?.metadata || {};
  return {
    title: metadata['benchmark-video-title'] || video.title || '未命名视频',
    creator: metadata['benchmark-author'] || metadata['benchmark-channel-name'] || '未填写创作者',
    views: metadata['benchmark-view-count'] || '未录入播放量',
    publishedAt: metadata['benchmark-published-at'] || metadata['benchmark-publish-date'] || '未录入发布时间',
  };
}
