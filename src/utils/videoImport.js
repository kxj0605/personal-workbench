import { defaultPrompts, ensureDouyinPromptFields, getBenchmarkMetadataFields } from '../components/BenchmarkVideoDetails';
import { parseDouyinShareText, getStandaloneDouyinUrl } from './douyinPaste';

export function getVideoPrompt(platform) {
  const value = localStorage.getItem(`benchmark-video-prompt-${platform}-v1`) || (platform === 'youtube' ? localStorage.getItem('benchmark-video-prompt-v1') : '') || defaultPrompts[platform];
  return platform === 'douyin' ? ensureDouyinPromptFields(value) : value;
}
export function saveVideoPrompt(platform, value) {
  localStorage.setItem(`benchmark-video-prompt-${platform}-v1`, value.trim() || defaultPrompts[platform]);
}
export function resetVideoPrompt(platform) {
  localStorage.removeItem(`benchmark-video-prompt-${platform}-v1`);
  if (platform === 'youtube') localStorage.removeItem('benchmark-video-prompt-v1');
  return defaultPrompts[platform];
}
const usable = value => value && !/^(不可用|暂无|未知|待填|无|N\/A)$/i.test(value);
const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
export function parseVideoImport(text, currentUrl) {
  const standalone = getStandaloneDouyinUrl(text);
  if (standalone) return { metadata: { 'benchmark-video-url': standalone } };
  const share = parseDouyinShareText(text);
  if (share) return { metadata: { 'benchmark-video-title': share.description, 'benchmark-video-tags': share.tags.join('、'), 'benchmark-video-url': share.url } };
  const entries = text.split(/\r?\n/).map(line => {
    const clean = line.replace(/^\s*(?:[-+•]\s+|\d+[.)]\s+)?/, '').replace(/[*`]/g, '').trim();
    const match = clean.match(/^([^：:]+)[：:]\s*(.*)$/);
    return match ? [match[1].trim(), match[2].trim()] : null;
  }).filter(Boolean);
  const link = safeUrl(entries.find(([label]) => label === '视频链接')?.[1]);
  const fields = getBenchmarkMetadataFields(link || currentUrl);
  const youtube = (link || currentUrl).includes('youtu');
  const aliases = {
    '账号': youtube ? 'benchmark-channel-name' : 'benchmark-author',
    '账号链接': youtube ? 'benchmark-channel-url' : 'benchmark-author-url',
    '主页链接': youtube ? 'benchmark-channel-url' : 'benchmark-author-url',
    '账号主页链接': youtube ? 'benchmark-channel-url' : 'benchmark-author-url',
    '发布时间': 'benchmark-published-at', '背景音乐': 'benchmark-background-music',
  };
  const metadata = {};
  for (const [label, value] of entries) {
    if (!usable(value)) continue;
    const key = aliases[label] || fields.find(field => field.label === label)?.name;
    if (!key) continue;
    if (key.endsWith('-url')) { const url = safeUrl(value); if (url) metadata[key] = url; }
    else metadata[key] = key === 'benchmark-video-tags' ? value.split(/[\s,，、]+/).map(tag => tag.replace(/^#/, '').trim()).filter(Boolean).join('、') : value;
  }
  return { metadata };
}
