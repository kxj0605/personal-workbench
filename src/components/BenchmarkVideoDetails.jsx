import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ClipboardPaste, Copy, Pencil, X } from 'lucide-react';

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
  douyin: '我会提供一段抖音分享链接（可能混有时间、口令、文案和 # 话题）以及一张视频详情截图。请直接提取可导入的完整视频资料，并严格按以下格式逐行输出。不要添加表格、序号、解释、代码块或 Markdown 链接。\n\n先从分享内容中识别真实视频链接；截图优先用于识别发布者、主页链接、视频时长、发布时间、背景音乐和互动数据，只读取清晰可见的信息。\n\n视频标题：优先读取作者昵称下方的视频发布文案第一句，去掉前置口令、时间和后续 # 标签；不要把封面、暂停画面、视频内容字幕或大字当作标题\n视频标签：去掉 #；剔除与发布者名称相同的标签；多项用 、 分隔\n视频链接：仅输出真实抖音视频链接\n发布者：仅保留 @账号昵称\n主页链接：发布者的抖音主页完整链接；无法确认写不可用\n视频时长：如：00:32；无法确认写不可用\n发布时间：如截图或页面可见则提取；看不清写不可用\n背景音乐：歌曲或音乐名称；无法确认写不可用\n点赞量：\n评论量：\n收藏量：\n转发量：\n\n每个字段都必须输出。无法可靠获取或截图中看不清的字段请写“不可用”，不要猜测。',
  other: '请根据视频链接，提取公开可见的视频资料，并严格按以下格式逐行输出。不要添加表格、序号、解释或代码块。\n\n视频标题：\n视频标签：\n视频链接：{{视频链接}}\n发布者：\n主页链接：\n视频时长：\n发布时间：\n播放量：\n点赞量：\n评论量：\n\n无法可靠获取的字段请写“不可用”，不要猜测。',
};

const ensureDouyinPromptFields = (prompt) => {
  let normalized = prompt
    .replace(/\n播放量：[^\n]*/g, '')
    .replace(/\n视频简介：[^\n]*/g, '');
  const publishedAtLine = '发布时间：如截图或页面可见则提取；看不清写不可用';
  if (!normalized.includes('发布时间：')) {
    normalized = normalized.includes('\n背景音乐：')
      ? normalized.replace('\n背景音乐：', `\n${publishedAtLine}\n背景音乐：`)
      : `${normalized.trim()}\n${publishedAtLine}`;
  }
  if (!normalized.includes('主页链接：')) {
    normalized = normalized.includes('\n发布者：')
      ? normalized.replace(/\n发布者：[^\n]*/, '\n发布者：仅保留 @账号昵称\n主页链接：https://www.douyin.com/user/...')
      : `${normalized.trim()}\n发布者：仅保留 @账号昵称\n主页链接：https://www.douyin.com/user/...`;
  }
  if (!normalized.includes('视频时长：')) {
    normalized = normalized.includes('\n发布时间：')
      ? normalized.replace('\n发布时间：', '\n视频时长：如：00:32；无法确认写不可用\n发布时间：')
      : `${normalized.trim()}\n视频时长：如：00:32；无法确认写不可用`;
  }
  return normalized;
};

const fieldsByPlatform = {
  youtube: [
    { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
    { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
    { label: '视频链接', name: 'benchmark-video-url', placeholder: 'YouTube 视频链接', column: 'content' },
    { label: '频道名称', name: 'benchmark-channel-name', placeholder: '如：@频道 Handle', column: 'content' },
    { label: '频道链接', name: 'benchmark-channel-url', placeholder: 'https://www.youtube.com/@频道Handle', column: 'content' },
    { label: '背景音乐', name: 'benchmark-background-music', placeholder: '歌曲或音乐名称', column: 'content' },
    { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'content' },
    { label: '发布时间', name: 'benchmark-published-at', placeholder: '如：2026-09-22', column: 'metrics' },
    { label: '播放量', name: 'benchmark-view-count', placeholder: '如：12.3万', column: 'metrics' },
    { label: '点赞量', name: 'benchmark-like-count', placeholder: '如：8,420', column: 'metrics' },
    { label: '评论量', name: 'benchmark-comment-count', placeholder: '如：325', column: 'metrics' },
  ],
  douyin: [
    { label: '视频标题', name: 'benchmark-video-title', placeholder: '不包含 # 标签', column: 'content' },
    { label: '视频标签', name: 'benchmark-video-tags', placeholder: '多个标签用 、 分隔', column: 'content' },
    { label: '视频链接', name: 'benchmark-video-url', placeholder: '抖音视频链接', column: 'content' },
    { label: '发布者', name: 'benchmark-author', placeholder: '如：@某某某', column: 'metrics' },
    { label: '主页链接', name: 'benchmark-author-url', placeholder: 'https://www.douyin.com/user/...', column: 'metrics' },
    { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'metrics' },
    { label: '发布时间', name: 'benchmark-published-at', placeholder: '如：2026-09-22', column: 'metrics' },
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
    { label: '主页链接', name: 'benchmark-author-url', placeholder: '发布者主页链接', column: 'content' },
    { label: '视频时长', name: 'benchmark-video-duration', placeholder: '如：00:32', column: 'metrics' },
    { label: '发布时间', name: 'benchmark-published-at', placeholder: '如：2026-09-22', column: 'metrics' },
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
export const getVideoMetadataStatus = (video = {}, excludedFieldNames = []) => {
  const platform = getVideoPlatformKey(video);
  const fields = (fieldsByPlatform[platform] || fieldsByPlatform.other).filter((field) => !excludedFieldNames.includes(field.name));
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

const getMetadataColumns = (platform, fields) => {
  if (platform !== 'douyin') return [0, 1].map((columnIndex) => fields.filter((_, fieldIndex) => fieldIndex % 2 === columnIndex));

  const byName = Object.fromEntries(fields.map((field) => [field.name, field]));
  const createColumn = (names) => names.map((name) => byName[name]).filter(Boolean);
  return [
    createColumn(['benchmark-author', 'benchmark-author-url', 'benchmark-video-duration', 'benchmark-published-at', 'benchmark-background-music']),
    createColumn(['benchmark-like-count', 'benchmark-favorite-count', 'benchmark-comment-count', 'benchmark-share-count']),
  ];
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

export function BenchmarkVideoDetails({ video, onChange, onNotice, onCollapse = () => {}, excludedFieldNames = [], heading = '视频数据', showHeading = true, actionsPortalTarget = null, actionPanelPortalTarget = null, platformPortalTarget = null, showMetadataHeading = true, onCopyAll = null }) {
  const [isPromptSettingsOpen, setIsPromptSettingsOpen] = React.useState(false);
  const [promptPlatform, setPromptPlatform] = React.useState(detectVideoPlatform(video.url));
  const [templates, setTemplates] = React.useState(defaultPrompts);
  const [isPasteOpen, setIsPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const { platform, fields, platformLabel, filledCount, totalCount } = getVideoMetadataStatus(video, excludedFieldNames);
  const metadata = { 'benchmark-video-url': video.url, ...(video.details?.metadata || {}) };
  const metadataColumns = getMetadataColumns(platform, fields);
  const metadataProgressLabel = filledCount ? `已填写 ${filledCount}/${totalCount} 项` : '未录入元数据';
  const promptTemplatePlatform = defaultPrompts[platform] ? platform : 'other';
  const activeTemplate = templates[promptTemplatePlatform] || defaultPrompts[promptTemplatePlatform];
  const settingsTemplate = templates[promptPlatform] || defaultPrompts[promptPlatform] || defaultPrompts.other;

  React.useEffect(() => {
    const nextTemplates = { ...defaultPrompts };
    platformOptions.forEach(({ value }) => {
      const saved = window.localStorage.getItem(`benchmark-video-prompt-${value}-v1`) || (value === 'youtube' ? window.localStorage.getItem('benchmark-video-prompt-v1') : '');
      if (saved) nextTemplates[value] = value === 'douyin' ? ensureDouyinPromptFields(saved) : saved;
    });
    setTemplates(nextTemplates);
  }, []);

  React.useEffect(() => {
    if (!isImportDialogOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsImportDialogOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isImportDialogOpen]);

  const updateMetadata = (name, value) => {
    const nextMetadata = { ...metadata, [name]: value };
    const nextVideo = name === 'benchmark-video-url'
      ? { ...video, url: detectVideoPlatform(value) === 'douyin' ? normalizeDouyinVideoUrl(value) : value, platform: getVideoPlatformLabel(value), platformOverride: '' }
      : video;
    onChange({ ...nextVideo, details: { ...(video.details || {}), metadata: nextMetadata } });
  };

  const applyPaste = (text) => {
    setPasteText(text);
    const rawEntries = [];
    text.split(/\r?\n/).forEach((line) => {
      const normalized = line.replace(/^\s*(?:[-+•]\s+|\d+[.)]\s+)?/, '').replace(/[*_`]/g, '').trim();
      const separator = normalized.indexOf('：') >= 0 ? normalized.indexOf('：') : normalized.indexOf(':');
      if (separator >= 0) rawEntries.push([normalized.slice(0, separator).trim(), normalized.slice(separator + 1).trim()]);
    });
    const pastedLink = rawEntries.find(([label]) => label === '视频链接')?.[1] || video.url;
    const importPlatform = detectVideoPlatform(pastedLink);
    const importFields = fieldsByPlatform[importPlatform] || fieldsByPlatform.other;
    const parsed = {};
    rawEntries.forEach(([label, rawValue]) => {
      const field = importFields.find((item) => item.label === label);
      if (field) {
        const value = rawValue;
        parsed[field.name] = field.name === 'benchmark-video-tags'
          ? value.split(/[,，、]/).map((tag) => tag.replace(/^#\s*/, '').trim()).filter(Boolean).join('、')
          : value;
        if (field.name === 'benchmark-author') {
          const markdownAuthor = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
          if (markdownAuthor) {
            parsed['benchmark-author'] = markdownAuthor[1].trim();
            parsed['benchmark-author-url'] = markdownAuthor[2].trim();
          }
        }
      }
    });
    if (!Object.keys(parsed).length) return;
    const metadataWithPaste = { ...metadata, ...parsed };
    const pastedUrl = parsed['benchmark-video-url'];
    const nextVideo = {
      ...video,
      ...(parsed['benchmark-video-title'] ? { title: parsed['benchmark-video-title'] } : {}),
      ...(pastedUrl ? { url: detectVideoPlatform(pastedUrl) === 'douyin' ? normalizeDouyinVideoUrl(pastedUrl) : pastedUrl, platform: getVideoPlatformLabel(pastedUrl), platformOverride: '' } : {}),
    };
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

  const promptSettings = <section className="benchmark-prompt-settings" aria-label="视频资料提示词设置"><div><h3>视频资料提示词 · {promptPlatformOptions.find((item) => item.value === promptPlatform)?.label}</h3><p className="benchmark-prompt-flow">💡 流程：复制提示词 → AI 提取元数据 → 粘贴导入填充表单</p></div><div className="benchmark-prompt-platform-tabs" role="group" aria-label="选择提示词平台">{promptPlatformOptions.map((item) => <button type="button" className={promptPlatform === item.value ? 'active' : undefined} aria-pressed={promptPlatform === item.value} key={item.value} onClick={() => setPromptPlatform(item.value)}>{item.label}</button>)}</div><textarea value={settingsTemplate} onChange={(event) => setTemplates((current) => ({ ...current, [promptPlatform]: event.target.value }))} rows={14} aria-label="视频资料提示词内容" /><div className="benchmark-prompt-settings-actions"><button type="button" className="text-button" onClick={resetPrompt}>恢复默认</button><button type="button" className="primary-button" onClick={savePromptSettings}>保存提示词</button></div></section>;
  const pastePanel = <div className="benchmark-metadata-paste-panel"><div className="benchmark-metadata-paste-heading"><span>在这里按 Ctrl+V，识别后会自动填入表格</span><button type="button" onClick={() => { setPasteText(''); setIsPasteOpen(false); }}>取消</button></div><textarea value={pasteText} onChange={(event) => applyPaste(event.target.value)} onPaste={(event) => { event.preventDefault(); applyPaste(event.clipboardData.getData('text/plain')); }} rows={4} autoFocus aria-label="粘贴视频资料内容" placeholder="在这里粘贴视频标题、标签、链接、互动数据等资料" /></div>;
  const openImportDialog = () => {
    setPromptPlatform(promptTemplatePlatform);
    setIsPromptSettingsOpen(false);
    setIsImportDialogOpen(true);
  };
  const closeImportDialog = () => {
    setPasteText('');
    setIsPromptSettingsOpen(false);
    setIsImportDialogOpen(false);
  };
  const importPastePanel = <textarea value={pasteText} onChange={(event) => applyPaste(event.target.value)} onPaste={(event) => { event.preventDefault(); applyPaste(event.clipboardData.getData('text/plain')); }} rows={6} autoFocus aria-label="粘贴视频资料内容" placeholder="在这里粘贴 AI 提取出的结构化视频资料，识别后会自动填入表单" />;
  const importDialog = isImportDialogOpen ? createPortal(<div className="video-import-dialog-backdrop" role="presentation" onMouseDown={closeImportDialog}><section className="video-import-dialog" role="dialog" aria-modal="true" aria-labelledby="video-import-dialog-title" onMouseDown={(event) => event.stopPropagation()}><header className="video-import-dialog-head"><div><h2 id="video-import-dialog-title">导入视频资料</h2><p>按步骤提取并粘贴，字段会自动回填到视频信息中。</p></div><button type="button" className="video-import-dialog-close" onClick={closeImportDialog} aria-label="关闭导入视频资料"><X size={18} /></button></header><div className="video-import-dialog-steps"><section><div className="video-import-dialog-step-head"><div><strong>① 复制提取提示词</strong><p>复制后，连同视频链接和截图发送给 AI。</p></div><div className="video-import-dialog-step-actions"><button type="button" className="video-import-copy-prompt" onClick={copyPrompt}><Copy size={16} />复制提示词</button><button type="button" className="video-import-settings-trigger" onClick={() => { setPromptPlatform(promptTemplatePlatform); setIsPromptSettingsOpen((open) => !open); }} aria-label="设置视频资料提示词" aria-expanded={isPromptSettingsOpen} title="设置提示词"><Pencil size={16} /></button></div></div>{isPromptSettingsOpen && promptSettings}</section><section><strong>② 粘贴提取结果</strong><p>粘贴 AI 按提示词返回的字段；标题、链接、话题和视频数据会自动填入。</p><div className="video-import-paste-panel">{importPastePanel}</div></section><section><strong>③ 检查并完成</strong><p>关闭弹窗后，可在第一张卡片继续校对视频信息。</p></section></div><footer className="video-import-dialog-footer"><button type="button" onClick={closeImportDialog}>完成导入</button></footer></section></div>, document.body) : null;
  const portalActions = <div className="video-basic-card-actions" aria-label="视频信息操作"><button type="button" className="video-basic-card-copy-all-action" onClick={onCopyAll || copyMetadata} aria-label="复制视频信息" title="复制视频信息"><Copy size={17} /></button><button type="button" className="video-basic-card-import-action" onClick={openImportDialog}><ClipboardPaste size={16} />导入视频资料</button></div>;
  const platformSelector = <PlatformCorrection label={platformLabel} value={video.platformOverride} onChange={(label) => onChange({ ...video, platform: label, platformOverride: label })} />;

  return <section className="benchmark-video-details-inspiration" aria-label={`${video.title} 的${heading}`}>
    {showHeading && <div className="benchmark-data-head"><div className="benchmark-data-heading" role="button" tabIndex={0} aria-expanded="true" aria-label={`收起${heading}`} onClick={onCollapse} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onCollapse(); } }}><h4>{heading}</h4><ChevronUp className="benchmark-data-heading-chevron" size={17} /><span className="benchmark-platform-status">{!platformPortalTarget && platformSelector}</span><span className="benchmark-status-divider" aria-hidden="true" /><span className={`benchmark-metadata-status${filledCount ? ' is-filled' : ' is-empty'}`}>{metadataProgressLabel}</span></div>{!actionsPortalTarget && <div className="benchmark-data-actions"><div className="benchmark-prompt-actions" aria-label={`${heading}提示词操作`}><button type="button" className="benchmark-prompt-settings-trigger" onClick={() => { setPromptPlatform(promptTemplatePlatform); setIsPromptSettingsOpen((open) => !open); }} aria-label={`设置${heading}提示词`} aria-expanded={isPromptSettingsOpen} title="设置提示词"><span>提示词</span><Pencil size={15} /></button><button type="button" className="benchmark-prompt-copy-trigger" onClick={copyPrompt} aria-label="复制提示词" title="复制提示词"><Copy size={17} /></button></div></div>}</div>}
    {actionsPortalTarget && createPortal(portalActions, actionsPortalTarget)}
    {platformPortalTarget && createPortal(platformSelector, platformPortalTarget)}
    {isPromptSettingsOpen && !isImportDialogOpen && (actionPanelPortalTarget ? createPortal(promptSettings, actionPanelPortalTarget) : promptSettings)}
    {isPasteOpen && actionPanelPortalTarget && createPortal(pastePanel, actionPanelPortalTarget)}
    {importDialog}
    <section className="benchmark-video-details benchmark-metadata-panel" aria-label="视频资料">
      {showMetadataHeading && <div className="benchmark-metadata-head"><span className="benchmark-metadata-title"><strong>视频数据</strong><span className="benchmark-platform-status">{!platformPortalTarget && platformSelector}</span></span>{!actionsPortalTarget && <span className="benchmark-metadata-actions" aria-label="视频资料操作"><button type="button" onClick={() => setIsPasteOpen(true)} title="粘贴导入视频资料"><ClipboardPaste size={15} />粘贴导入</button><button type="button" onClick={copyMetadata} title="复制资料"><Copy size={15} />复制资料</button></span>}</div>}
      {isPasteOpen && !actionPanelPortalTarget && pastePanel}
      <div className="benchmark-metadata-grid" aria-label="视频资料">{metadataColumns.map((column, columnIndex) => <div className="benchmark-metadata-column" key={columnIndex}>{column.map((field) => <label className="benchmark-metadata-field" key={field.name}><span>{field.label}</span><input value={metadata[field.name] || ''} placeholder={field.placeholder} aria-label={field.label} onChange={(event) => updateMetadata(field.name, event.target.value)} onPaste={field.name === 'benchmark-video-title' ? (event) => { const text = event.clipboardData.getData('text/plain'); if (text.includes('：') || text.includes(':')) { event.preventDefault(); applyPaste(text); } } : undefined} /></label>)}</div>)}</div>
    </section>
  </section>;
}

export const getBenchmarkMetadataFields = (url) => fieldsByPlatform[detectVideoPlatform(url)] || fieldsByPlatform.other;

function PlatformCorrection({ label, value, onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return <span className="benchmark-platform-correction" onClick={(event) => event.stopPropagation()}><button type="button" className="benchmark-platform-correction-toggle" aria-expanded={isOpen} aria-label={`切换视频平台，当前为${label}`} onClick={() => setIsOpen((open) => !open)}>{label}</button>{isOpen && <span className="benchmark-platform-correction-options" role="group" aria-label="切换视频平台">{platformOptions.map((item) => <button type="button" key={item.value} className={(value || label) === item.label ? 'active' : ''} aria-pressed={(value || label) === item.label} onClick={() => { onChange(item.label); setIsOpen(false); }}>{item.label}</button>)}</span>}</span>;
}
