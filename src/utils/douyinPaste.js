const normalizePasteText = (value = '') => String(value).replace(/\\(?=[:/])/g, '').trim();

export function getStandaloneDouyinUrl(value = '') {
  const text = normalizePasteText(value).replace(/^[\s'"“”‘’「」]+|[\s'"“”‘’「」]+$/g, '');
  const markdown = text.match(/^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/i);
  const candidate = markdown ? markdown[2] : text;
  if (/\s/.test(candidate)) return '';
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:') return '';
    if (url.hostname === 'v.douyin.com' && /^\/[\w-]+\/?$/.test(url.pathname)) return url.href;
    if ((url.hostname === 'www.douyin.com' || url.hostname === 'douyin.com') && /^\/video\/\d+\/?$/.test(url.pathname)) return url.href;
  } catch { /* Not a standalone URL. */ }
  return '';
}

export function parseDouyinShareText(value = '') {
  const normalized = normalizePasteText(value);
  if (!/(?:复制此链接|打开.{0,10}(?:抖音|Dou音).*搜索)/i.test(normalized)) return null;
  const url = normalized.match(/https?:\/\/(?:v\.|www\.)?douyin\.com\/[^\s'"”）\]]+/i)?.[0] || '';
  if (!url) return null;
  const firstTagIndex = normalized.search(/#[\s\u3000]*\S/);
  const beforeTags = firstTagIndex >= 0 ? normalized.slice(0, firstTagIndex) : normalized.slice(0, normalized.indexOf(url));
  const firstChinese = beforeTags.search(/[\u4e00-\u9fff]/);
  const description = firstChinese >= 0 ? beforeTags.slice(firstChinese).trim() : '';
  if (!description) return null;
  const tags = [...normalized.matchAll(/#[\s\u3000]*([^\s#]+)/g)].map((match) => match[1].trim()).filter(Boolean);
  return { url, description, tags: [...new Set(tags)] };
}
