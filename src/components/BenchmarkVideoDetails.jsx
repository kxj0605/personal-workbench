import React from 'react';
import { ChevronUp, ClipboardPaste, Copy, Pencil } from 'lucide-react';

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'bilibili', label: 'B站' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'other', label: '其他' },
];
const promptPlatformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'douyin', label: '抖音' },
  { value: 'other', label: '其他' },
];

const defaultPrompts = {
  youtube: '请根据 YouTube / YouTube Shorts 视频链接，提取公开资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n视频标题：仅保留标题正文，不包含任何 # 标签\n视频标签：去掉 #；剔除与频道名称相同的标签；多项用 、 分隔\n视频链接：原始视频链接\n背景音乐：歌曲或音乐名称；无法确认请写不可用\n视频时长：\n频道名称：使用 @频道 Handle\n频道链接：https://www.youtube.com/@频道Handle\n播放量：\n点赞量：\n评论量：\n\n无法可靠获取的字段请写“不可用”，不要猜测。\n\n视频链接：{{视频链接}}',
  douyin: '我会提供一条抖音视频链接和一张视频详情截图。请结合链接与截图提取公开资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n截图优先用于识别背景音乐、点赞量、评论量、收藏量和转发量；请只读取截图中清晰可见的数据。\n\n视频标题：优先读取作者昵称下方的视频发布文案第一句，去掉后续 # 标签；不要把封面、暂停画面、视频内容里的字幕或大字当作标题。若发布文案只有一句，视频标题和视频简介可以相同\n视频简介：\n视频标签：去掉 #；如果标签与频道名称相同则剔除\n视频链接：{{视频链接}}\n发布者：严格使用 Markdown 链接格式 [@昵称](https://www.douyin.com/user/...)\n背景音乐：\n点赞量：\n评论量：\n收藏量：\n转发量：\n\n无法可靠获取或截图中看不清的字段请写“不可用”，不要猜测。',
  other: '请根据视频链接，提取公开可见的视频资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n视频标题：\n视频标签：\n视频链接：{{视频链接}}\n发布者：\n视频时长：\n播放量：\n点赞量：\n评论量：\n\n无法可靠获取的字段请写“不可用”，不要猜测。',
};

const fieldsByPlatform = {
  youtube: [
    { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
    { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
    { label: '视频链接', name: 'benchmark-video-url', placeholder: 'YouTube 视频链接', column: 'content' },
    { label: '背景音乐', name: 'benchmark-background-music', placeholder: '歌曲或音乐名称', column: 'content' },
    { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'content' },
    { label: '播放量', name: 'benchmark-view-count', placeholder: '如：12.3万', column: 'metrics' },
    { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
    { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
    { label: '频道名称', name: 'benchmark-channel-name', placeholder: '如：@频道 Handle', column: 'metrics' },
    { label: '频道链接', name: 'benchmark-channel-url', placeholder: 'https://www.youtube.com/@频道Handle', column: 'metrics' },
  ],
  douyin: [
    { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
    { label: '视频简介', name: 'benchmark-video-description', placeholder: '视频简介正文', column: 'content' },
    { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
    { label: '视频链接', name: 'benchmark-video-url', placeholder: '抖音视频链接', column: 'content' },
    { label: '发布者', name: 'benchmark-author', placeholder: '[@某某某](https://www.douyin.com/user/...)', column: 'metrics' },
    { label: '背景音乐', name: 'benchmark-background-music', placeholder: '歌曲或音乐名称', column: 'content' },
    { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
    { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
    { label: '收藏量', name: 'benchmark-favorite-count', placeholder: '如：1,260', column: 'metrics' },
    { label: '转发量', name: 'benchmark-share-count', placeholder: '如：320', column: 'metrics' },
  ],
  other: [
    { label: '视频标题', name: 'benchmark-video-title', placeholder: '视频标题正文', column: 'content' },
    { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
    { label: '视频链接', name: 'benchmark-video-url', placeholder: '视频链接', column: 'content' },
    { label: '发布者', name: 'benchmark-author', placeholder: '作者或频道名称', column: 'content' },
    { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'metrics' },
    { label: '播放量', name: 'benchmark-view-count', placeholder: '如：12.3万', column: 'metrics' },
    { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
    { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
  ],
};

export const detectVideoPlatform = (value = '') => {
  if (/douyin\.com\b|iesdouyin\.com\b/i.test(value)) return 'douyin';
  if (/youtube\.com\b|youtu\.be\b|youtube-nocookie\.com\b/i.test(value)) return 'youtube';
  if (/kuaishou\.com\b|kuaishouapp\.com\b|kwai\.com\b/i.test(value)) return 'kuaishou';
  if (/bilibili\.com\b|b23\.tv\b/i.test(value)) return 'bilibili';
  if (/xiaohongshu\.com\b|xhslink\.com\b/i.test(value)) return 'xiaohongshu';
  return 'other';
};
export const getVideoPlatformLabel = (value = '') => platformOptions.find((item) => item.value === detectVideoPlatform(value))?.label || '其他';
const getVideoPlatformKey = (video = {}) => {
  const manuallySelected = platformOptions.find((item) => item.label === video.platformOverride)?.value;
  return manuallySelected || detectVideoPlatform(video.url);
};
const getDisplayPlatformLabel = (video, platform) => {
  if (video.platformOverride) return video.platformOverride === '其他' ? '其他平台' : video.platformOverride;
  if (!video.url?.trim()) return '未知平台';
  const label = platformOptions.find((item) => item.value === platform)?.label || '其他';
  return label === '其他' ? '其他平台' : label;
};
export const getVideoMetadataStatus = (video = {}) => {
  const platform = getVideoPlatformKey(video);
  const fields = fieldsByPlatform[platform] || fieldsByPlatform.other;
  const metadata = video.details?.metadata || {};
  const metadataFields = fields;
  const filledCount = metadataFields.filter((field) => {
    const value = field.name === 'benchmark-video-url' ? (video.url || metadata[field.name]) : metadata[field.name];
    return String(value || '').trim();
  }).length;

  return {
    platform,
    fields,
    platformLabel: getDisplayPlatformLabel(video, platform),
    filledCount,
    totalCount: metadataFields.length,
  };
};
const normalizeDouyinVideoUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const isDouyin = url.protocol === 'https:' && (url.hostname === 'douyin.com' || url.hostname.endsWith('.douyin.com'));
    const videoId = url.searchParams.get('modal_id') || url.pathname.match(/^\/video\/(\d+)/)?.[1];
    return isDouyin && videoId ? `https://www.douyin.com/video/${videoId}` : trimmed;
  } catch {
    return trimmed;
  }
};

export function BenchmarkVideoDetails({ video, onChange, onNotice, onCollapse }) {
  const [isPromptSettingsOpen, setIsPromptSettingsOpen] = React.useState(false);
  const [promptPlatform, setPromptPlatform] = React.useState(detectVideoPlatform(video.url));
  const [templates, setTemplates] = React.useState(defaultPrompts);
  const [isPasteOpen, setIsPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState('');
  const { platform, fields, platformLabel, filledCount, totalCount } = getVideoMetadataStatus(video);
  const metadata = { 'benchmark-video-url': video.url, ...(video.details?.metadata || {}) };
  const metadataProgressLabel = filledCount ? `已填写 ${filledCount}/${totalCount} 项` : '未录入元数据';
  const promptTemplatePlatform = defaultPrompts[platform] ? platform : 'other';
  const activeTemplate = templates[promptTemplatePlatform] || defaultPrompts[promptTemplatePlatform];
  const settingsTemplate = templates[promptPlatform] || defaultPrompts[promptPlatform] || defaultPrompts.other;

  React.useEffect(() => {
    const nextTemplates = { ...defaultPrompts };
    platformOptions.forEach(({ value }) => {
      const saved = window.localStorage.getItem(`benchmark-video-prompt-${value}-v1`) || (value === 'youtube' ? window.localStorage.getItem('benchmark-video-prompt-v1') : '');
      if (saved) nextTemplates[value] = saved;
    });
    setTemplates(nextTemplates);
  }, []);

  const updateMetadata = (name, value) => {
    const nextMetadata = { ...metadata, [name]: value };
    const nextVideo = name === 'benchmark-video-url'
      ? { ...video, url: detectVideoPlatform(value) === 'douyin' ? normalizeDouyinVideoUrl(value) : value, platform: getVideoPlatformLabel(value), platformOverride: '' }
      : video;
    onChange({ ...nextVideo, details: { ...(video.details || {}), metadata: nextMetadata } });
  };

  const applyPaste = (text) => {
    setPasteText(text);
    const parsed = {};
    text.split(/\r?\n/).forEach((line) => {
      const normalized = line.replace(/^\s*(?:[-+•]\s+|\d+[.)]\s+)?/, '').replace(/[*_`]/g, '').trim();
      const separator = normalized.indexOf('：') >= 0 ? normalized.indexOf('：') : normalized.indexOf(':');
      if (separator < 0) return;
      const label = normalized.slice(0, separator).trim();
      const field = fields.find((item) => item.label === label);
      if (field) parsed[field.name] = normalized.slice(separator + 1).trim();
    });
    if (!Object.keys(parsed).length) return;
    const metadataWithPaste = { ...metadata, ...parsed };
    const pastedUrl = parsed['benchmark-video-url'];
    const nextVideo = pastedUrl ? { ...video, url: detectVideoPlatform(pastedUrl) === 'douyin' ? normalizeDouyinVideoUrl(pastedUrl) : pastedUrl, platform: getVideoPlatformLabel(pastedUrl), platformOverride: '' } : video;
    onChange({ ...nextVideo, details: { ...(video.details || {}), metadata: metadataWithPaste } });
    setPasteText('');
    setIsPasteOpen(false);
    onNotice(`已填入 ${Object.keys(parsed).length} 项视频资料`);
  };

  const copyMetadata = async () => {
    const text = fields.map((field) => `${field.label}：${metadata[field.name] || ''}`).join('\n');
    try { await navigator.clipboard.writeText(text); onNotice('视频资料已复制'); } catch { onNotice('复制失败，请允许浏览器访问剪贴板'); }
  };

  const copyPrompt = async () => {
    const prompt = activeTemplate.replaceAll('{{视频链接}}', video.url || '');
    try { await navigator.clipboard.writeText(prompt); onNotice(`${platformOptions.find((item) => item.value === platform)?.label} 视频资料提示词已复制，已附视频链接`); } catch { onNotice('复制失败，请允许浏览器访问剪贴板'); }
  };

  const savePromptSettings = () => {
    window.localStorage.setItem(`benchmark-video-prompt-${promptPlatform}-v1`, settingsTemplate.trim() || defaultPrompts[promptPlatform]);
    setIsPromptSettingsOpen(false);
    onNotice('视频资料提示词已保存');
  };

  const resetPrompt = () => {
    setTemplates((current) => ({ ...current, [promptPlatform]: defaultPrompts[promptPlatform] }));
    window.localStorage.removeItem(`benchmark-video-prompt-${promptPlatform}-v1`);
    if (promptPlatform === 'youtube') window.localStorage.removeItem('benchmark-video-prompt-v1');
    onNotice('已恢复默认提示词');
  };

  return <section className="benchmark-video-details-inspiration" aria-label={`${video.title} 的视频数据`}>
    <div className="benchmark-data-head"><div className="benchmark-data-heading" role="button" tabIndex={0} aria-expanded="true" aria-label="收起视频数据" onClick={onCollapse} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onCollapse(); } }}><h4>视频数据</h4><ChevronUp className="benchmark-data-heading-chevron" size={17} /><span className="benchmark-platform-status"><span className="benchmark-platform-label">{platformLabel}</span><PlatformCorrection value={video.platformOverride} onChange={(label) => onChange({ ...video, platform: label, platformOverride: label })} /></span><span className="benchmark-status-divider" aria-hidden="true" /><span className={`benchmark-metadata-status${filledCount ? ' is-filled' : ' is-empty'}`}>{metadataProgressLabel}</span></div><div className="benchmark-data-actions"><div className="benchmark-prompt-actions" aria-label="视频数据提示词操作"><button type="button" className="benchmark-prompt-settings-trigger" onClick={() => { setPromptPlatform(promptTemplatePlatform); setIsPromptSettingsOpen((open) => !open); }} aria-label="设置视频数据提示词" aria-expanded={isPromptSettingsOpen} title="设置提示词"><span>提示词</span><Pencil size={15} /></button><button type="button" className="benchmark-prompt-copy-trigger" onClick={copyPrompt} aria-label="复制提示词" title="复制提示词"><Copy size={17} /></button></div></div></div>
    {isPromptSettingsOpen && <section className="benchmark-prompt-settings" aria-label="视频资料提示词设置"><div><h3>视频资料提示词 · {promptPlatformOptions.find((item) => item.value === promptPlatform)?.label}</h3><p className="benchmark-prompt-flow">💡 流程：复制提示词 → AI 提取元数据 → 粘贴导入填充表单</p></div><div className="benchmark-prompt-platform-tabs" role="group" aria-label="选择提示词平台">{promptPlatformOptions.map((item) => <button type="button" className={promptPlatform === item.value ? 'active' : undefined} aria-pressed={promptPlatform === item.value} key={item.value} onClick={() => setPromptPlatform(item.value)}>{item.label}</button>)}</div><textarea value={settingsTemplate} onChange={(event) => setTemplates((current) => ({ ...current, [promptPlatform]: event.target.value }))} rows={14} aria-label="视频资料提示词内容" /><div className="benchmark-prompt-settings-actions"><button type="button" className="text-button" onClick={resetPrompt}>恢复默认</button><button type="button" className="primary-button" onClick={savePromptSettings}>保存提示词</button></div></section>}
    <section className="benchmark-video-details benchmark-metadata-panel" aria-label="视频资料">
      <div className="benchmark-metadata-head"><strong>视频资料</strong><span className="benchmark-metadata-actions" aria-label="视频资料操作"><button type="button" onClick={() => setIsPasteOpen(true)} title="粘贴导入视频资料"><ClipboardPaste size={15} />粘贴导入</button><button type="button" onClick={copyMetadata} title="复制资料"><Copy size={15} />复制资料</button></span></div>
      {isPasteOpen && <div className="benchmark-metadata-paste-panel"><div className="benchmark-metadata-paste-heading"><span>在这里按 Ctrl+V，识别后会自动填入表格</span><button type="button" onClick={() => { setPasteText(''); setIsPasteOpen(false); }}>取消</button></div><textarea value={pasteText} onChange={(event) => applyPaste(event.target.value)} onPaste={(event) => { event.preventDefault(); applyPaste(event.clipboardData.getData('text/plain')); }} rows={4} autoFocus aria-label="粘贴视频资料内容" placeholder="在这里粘贴视频标题、标签、链接、播放量等资料" /></div>}
      <div className="benchmark-metadata-grid" aria-label="视频资料">{['content', 'metrics'].map((column) => <div className="benchmark-metadata-column" key={column}>{fields.filter((field) => field.column === column).map((field) => <label className="benchmark-metadata-field" key={field.name}><span>{field.label}</span><input value={metadata[field.name] || ''} placeholder={field.placeholder} aria-label={field.label} onChange={(event) => updateMetadata(field.name, event.target.value)} onPaste={field.name === 'benchmark-video-title' ? (event) => { const text = event.clipboardData.getData('text/plain'); if (text.includes('：') || text.includes(':')) { event.preventDefault(); applyPaste(text); } } : undefined} /></label>)}</div>)}</div>
    </section>
  </section>;
}

export const getBenchmarkMetadataFields = (url) => fieldsByPlatform[detectVideoPlatform(url)] || fieldsByPlatform.other;

function PlatformCorrection({ value, onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return <span className="benchmark-platform-correction" onClick={(event) => event.stopPropagation()}><button type="button" className="benchmark-platform-correction-toggle" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>修改</button>{isOpen && <span className="benchmark-platform-correction-options" role="group" aria-label="手动修正平台">{platformOptions.map((item) => <button type="button" key={item.value} className={value === item.label ? 'active' : ''} aria-pressed={value === item.label} onClick={() => { onChange(item.label); setIsOpen(false); }}>{item.label}</button>)}</span>}</span>;
}
