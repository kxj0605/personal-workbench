import React from 'react';
import { ArrowRight, ChevronDown, Copy, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import './VideoCollectionPanel.css';
import { BenchmarkVideoDetails, getVideoMetadataStatus, getVideoPlatformLabel } from './BenchmarkVideoDetails';

const STORAGE_KEY = 'video-collection-v1';
const PLATFORMS = ['抖音', 'YouTube', '快手', 'B站', '小红书', '其他'];
const CATEGORIES = ['情绪', '反转打脸爽剧', '搞笑整蛊', '剧情', 'shorts'];
const MAX_CUSTOM_TAGS = 5;
const STATUSES = {
  pending: { label: '待补资料', className: 'pending' },
  breaking: { label: '拆解中', className: 'breaking' },
  archived: { label: '已归档', className: 'archived' },
};

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const emptyDetails = () => ({ metadata: {} });
const loadVideos = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.map((video) => {
      const legacyDetails = video.details || {};
      if (legacyDetails.metadata) return video;
      return {
        ...video,
        details: {
          metadata: {
            'benchmark-video-title': legacyDetails.officialTitle || '',
            'benchmark-author': legacyDetails.author || '',
            'benchmark-video-duration': legacyDetails.duration || '',
            'benchmark-background-music': legacyDetails.music || '',
            'benchmark-video-tags': legacyDetails.sourceTags || '',
          },
        },
      };
    }) : [];
  } catch {
    return [];
  }
};
const formatDate = (value) => new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(value));
const splitTags = (value = '') => value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);

export function VideoCollectionPanel({ onOpenBreakdown }) {
  const intakeRef = React.useRef(null);
  const titleInputRef = React.useRef(null);
  const urlInputRef = React.useRef(null);
  const noteInputRef = React.useRef(null);
  const [videos, setVideos] = React.useState(loadVideos);
  const [draft, setDraft] = React.useState({ title: '', platform: '其他', platformOverride: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
  const [query, setQuery] = React.useState('');
  const [selectedPlatforms, setSelectedPlatforms] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [isCustomTagInputOpen, setIsCustomTagInputOpen] = React.useState(false);
  const [customTagInput, setCustomTagInput] = React.useState('');
  const [isDraftDetailsOpen, setIsDraftDetailsOpen] = React.useState(false);
  const [isCollectSuccess, setIsCollectSuccess] = React.useState(false);
  const [submitSuccessLabel, setSubmitSuccessLabel] = React.useState('');
  const [editingVideoId, setEditingVideoId] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState({ title: false, url: false });
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos)); }, [videos]);
  React.useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  React.useEffect(() => {
    if (!isCollectSuccess) return undefined;
    const timer = window.setTimeout(() => { setIsCollectSuccess(false); setSubmitSuccessLabel(''); }, 2600);
    return () => window.clearTimeout(timer);
  }, [isCollectSuccess]);
  const resizeDraftNote = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };
  React.useLayoutEffect(() => { resizeDraftNote(noteInputRef.current); }, [draft.note]);

  const filteredVideos = videos.filter((video) => {
    const category = video.category || video.focus || '';
    const searchable = `${video.title} ${video.platform || ''} ${category} ${(video.tags || []).join(' ')} ${video.note || ''} ${video.url || ''}`.toLowerCase();
    return (!selectedPlatforms.length || selectedPlatforms.includes(video.platform))
      && (!selectedCategories.length || selectedCategories.includes(category))
      && (!query.trim() || searchable.includes(query.trim().toLowerCase()));
  });

  const updateVideo = (id, updater) => {
    setVideos((current) => current.map((item) => item.id === id ? updater(item) : item));
  };

  const collectVideo = (event) => {
    event.preventDefault();
    const title = draft.title.trim();
    const url = draft.url.trim();
    if (!title || !url) {
      setValidationErrors({ title: !title, url: !url });
      (title ? urlInputRef : titleInputRef).current?.focus();
      return;
    }
    if (videos.some((video) => video.id !== editingVideoId && video.url === url)) {
      setNotice('这条视频已在灵感视频库中。');
      return;
    }
    const nextVideo = {
      title,
      platform: draft.platform,
      platformOverride: draft.platformOverride || '',
      category: draft.category,
      status: 'pending',
      tags: draft.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      url,
      note: draft.note.trim(),
      details: draft.details || emptyDetails(),
    };
    const isEditing = Boolean(editingVideoId);
    setVideos((current) => isEditing
      ? current.map((video) => video.id === editingVideoId ? { ...video, ...nextVideo } : video)
      : [{ id: makeId(), createdAt: new Date().toISOString(), ...nextVideo }, ...current]);
    setDraft({ title: '', platform: '其他', platformOverride: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
    setIsDraftDetailsOpen(false);
    setIsCustomTagInputOpen(false);
    setCustomTagInput('');
    setIsCollectSuccess(true);
    setSubmitSuccessLabel(isEditing ? '已保存修改 ✓' : '已收录到视频库 ✓');
    setEditingVideoId(null);
    setValidationErrors({ title: false, url: false });
  };

  const startEdit = (video) => {
    const metadata = video.details?.metadata || {};
    setDraft({
      title: video.title || '',
      platform: video.platform || getVideoPlatformLabel(video.url),
      platformOverride: video.platformOverride || '',
      category: video.category || video.focus || '情绪',
      tags: (video.tags || []).join('，'),
      url: video.url || '',
      note: video.note || '',
      details: video.details || emptyDetails(),
    });
    setEditingVideoId(video.id);
    setIsDraftDetailsOpen(Object.values(metadata).some(Boolean));
    setIsCustomTagInputOpen(false);
    setCustomTagInput('');
    setIsCollectSuccess(false);
    setSubmitSuccessLabel('');
    setValidationErrors({ title: false, url: false });
    window.requestAnimationFrame(() => intakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const cancelEdit = () => {
    setEditingVideoId(null);
    setDraft({ title: '', platform: '其他', platformOverride: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
    setIsDraftDetailsOpen(false);
    setIsCustomTagInputOpen(false);
    setCustomTagInput('');
    setValidationErrors({ title: false, url: false });
  };

  const openBreakdown = (video) => {
    updateVideo(video.id, (item) => ({ ...item, status: item.status === 'pending' ? 'breaking' : item.status }));
    onOpenBreakdown(video);
  };

  const deleteVideo = (video) => {
    if (!window.confirm(`确定删除「${video.title}」吗？删除后无法恢复。`)) return;
    setVideos((current) => current.filter((item) => item.id !== video.id));
    setNotice(`已删除「${video.title}」。`);
  };

  const copyDraftUrl = async () => {
    try {
      await navigator.clipboard.writeText(draft.url.trim());
      setNotice('视频链接已复制。');
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板。');
    }
  };

  const draftTags = splitTags(draft.tags);
  const { platformLabel, filledCount, totalCount } = getVideoMetadataStatus(draft);
  const metadataProgressLabel = filledCount ? `已填写 ${filledCount}/${totalCount} 项` : '未录入元数据';
  const addCustomTag = (value) => {
    const tag = value.trim();
    if (!tag || draftTags.length >= MAX_CUSTOM_TAGS || draftTags.some((item) => item.toLocaleLowerCase() === tag.toLocaleLowerCase())) return false;
    setDraft((current) => ({ ...current, tags: [...splitTags(current.tags), tag].join('，') }));
    setCustomTagInput('');
    return true;
  };
  const removeCustomTag = (tag) => setDraft((current) => ({ ...current, tags: splitTags(current.tags).filter((item) => item !== tag).join('，') }));

  return <section className="video-collection" aria-label="灵感视频">
    {notice && <p className="video-collection-notice" role="status">{notice}</p>}
    <section className="video-collection-intake" ref={intakeRef} aria-labelledby="video-collection-intake-title">
      <h1 id="video-collection-intake-title">{editingVideoId ? '编辑视频' : '收录视频'}</h1>
      <article className="video-collection-card">
      <form onSubmit={collectVideo} className="video-collection-form">
        <div className="video-collection-primary-row"><div className="video-collection-field"><input ref={titleInputRef} className={`video-collection-title${validationErrors.title ? ' has-error' : ''}`} value={draft.title} onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setValidationErrors((current) => current.title ? { ...current, title: false } : current); }} placeholder={validationErrors.title ? '请填写名称' : '视频名称（必填） 如电梯反转片'} aria-label="视频名称" aria-invalid={validationErrors.title || undefined} maxLength="100" /></div><div className={`video-collection-url-field${validationErrors.url ? ' has-error' : ''}`}><input ref={urlInputRef} type="url" value={draft.url} onChange={(event) => { const url = event.target.value; setDraft({ ...draft, url, platform: getVideoPlatformLabel(url), platformOverride: '' }); setValidationErrors((current) => current.url ? { ...current, url: false } : current); }} placeholder={validationErrors.url ? '请填写视频链接' : '视频链接（必填）'} aria-label="视频链接" aria-invalid={validationErrors.url || undefined} /><button type="button" onClick={copyDraftUrl} disabled={!draft.url.trim()} title="复制视频链接" aria-label="复制视频链接"><Copy size={17} /><span>复制</span></button></div></div>
        <div className="video-collection-choice-row category-only"><ChoiceGroup options={CATEGORIES} value={draft.category} onChange={(category) => setDraft({ ...draft, category })} tone="focus">{draftTags.map((tag) => <span className="video-custom-tag" key={tag}><span>{tag}</span><button type="button" className="video-custom-tag-remove" onClick={() => removeCustomTag(tag)} aria-label={`删除标签${tag}`} title={`删除标签 ${tag}`}><X size={13} /></button></span>)}{isCustomTagInputOpen ? <input className="video-custom-tag-input" value={customTagInput} onChange={(event) => setCustomTagInput(event.target.value)} onBlur={() => { addCustomTag(customTagInput); setIsCustomTagInputOpen(false); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',' || event.key === '，') { event.preventDefault(); if (addCustomTag(customTagInput)) setIsCustomTagInputOpen(false); } if (event.key === 'Escape') { setCustomTagInput(''); setIsCustomTagInputOpen(false); } }} placeholder="输入后回车" aria-label="添加自定义标签" autoFocus /> : draftTags.length < MAX_CUSTOM_TAGS && <button type="button" className="video-custom-tag-trigger" onClick={() => setIsCustomTagInputOpen(true)}><Plus size={14} />添加标签</button>}</ChoiceGroup></div>
        <div className="video-draft-extra"><textarea ref={noteInputRef} value={draft.note} onChange={(event) => { setDraft({ ...draft, note: event.target.value }); resizeDraftNote(event.currentTarget); }} placeholder="为什么值得收集 / 我想研究什么（可选）" rows="1" /></div>
        <div className="video-draft-details">
          {isDraftDetailsOpen ? <BenchmarkVideoDetails video={draft} onChange={setDraft} onNotice={setNotice} onCollapse={() => setIsDraftDetailsOpen(false)} /> : <div className="video-data-collapsed" role="button" tabIndex={0} aria-expanded="false" aria-label="展开视频数据" onClick={() => setIsDraftDetailsOpen(true)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsDraftDetailsOpen(true); } }}><strong>视频数据</strong><ChevronDown className="benchmark-data-heading-chevron" size={17} /><span className="video-data-status is-platform">{platformLabel}</span><span className={`video-data-status${filledCount ? ' is-filled' : ' is-empty'}`}>{metadataProgressLabel}</span></div>}
        </div>
        <div className="video-collection-submit">{editingVideoId && <button type="button" className="video-collection-cancel" onClick={cancelEdit}>取消编辑</button>}<button type="submit" className={isCollectSuccess ? 'is-success' : undefined} aria-live="polite">{isCollectSuccess ? submitSuccessLabel : editingVideoId ? '保存修改' : <><Plus size={17} />收录到视频库</>}</button></div>
      </form>
      </article>
    </section>

    <section className="video-library" aria-labelledby="video-library-title">
      <div className="video-library-head"><div><div className="video-library-title-row"><h2 id="video-library-title">视频库</h2><span className="video-library-count">{filteredVideos.length} 条</span></div><p>集中检索已收录的视频，并从这里进入详细拆解。</p></div></div>
      <div className="video-library-filter"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索视频、标签、备注…" /></label><div className="video-library-filter-row"><span>标签</span><div className="video-library-filter-tabs category-filter" aria-label="按标签筛选视频">{CATEGORIES.map((category) => <button key={category} type="button" aria-pressed={selectedCategories.includes(category)} className={selectedCategories.includes(category) ? 'active' : ''} onClick={() => setSelectedCategories((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category])}>{category}</button>)}</div></div><div className="video-library-filter-row"><span>平台</span><div className="video-library-filter-tabs platform-filter" aria-label="按平台筛选视频">{PLATFORMS.map((platform) => <button key={platform} type="button" aria-pressed={selectedPlatforms.includes(platform)} className={selectedPlatforms.includes(platform) ? 'active' : ''} onClick={() => setSelectedPlatforms((current) => current.includes(platform) ? current.filter((value) => value !== platform) : [...current, platform])}>{platform}</button>)}</div>{(selectedPlatforms.length > 0 || selectedCategories.length > 0) && <button className="video-library-filter-clear" type="button" onClick={() => { setSelectedPlatforms([]); setSelectedCategories([]); }}>清除筛选</button>}</div></div>
      <div className="video-library-list">{filteredVideos.length ? filteredVideos.map((video) => <VideoCard key={video.id} video={video} onOpen={() => openBreakdown(video)} onEdit={() => startEdit(video)} onDelete={() => deleteVideo(video)} />) : <p className="video-library-empty">收录完成的视频会保存在这里，可按标签查找并进入拆解学习。</p>}</div>
    </section>
  </section>;
}

function ChoiceGroup({ options, value, onChange, tone = '', children }) {
  return <div className={`video-choice-group ${tone}`}><div>{options.map((option) => <button key={option} type="button" aria-pressed={value === option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{option}</button>)}{children}</div></div>;
}

function VideoCard({ video, onOpen, onEdit, onDelete }) {
  const status = STATUSES[video.status] || STATUSES.pending;

  return <article className="video-library-row compact">
    <div className="video-library-row-summary">
      <div className="video-library-row-title"><h3>{video.title}</h3><span className={`video-chip status ${status.className}`}>{status.label}</span></div>
    </div>
    <div className="video-library-row-meta"><span className="video-chip platform">{video.platform}</span><span className="video-chip focus">{video.category || video.focus || '剧情'}</span><time>{formatDate(video.createdAt)}</time></div>
    <p className={`video-library-row-note ${video.note ? '' : 'is-empty'}`}>{video.note || '点击铅笔添加简短备注'}</p>
    <div className="video-library-row-actions">
      <button className="video-library-row-primary-action" type="button" onClick={onOpen}>进入拆解学习<ArrowRight size={16} /></button>
      <button className="video-library-row-edit" type="button" onClick={onEdit} aria-label={`编辑${video.title}`} title="编辑视频"><Pencil size={17} /></button>
      <button className="video-library-row-delete" type="button" onClick={onDelete} aria-label={`删除${video.title}`} title="删除视频"><Trash2 size={17} /></button>
    </div>
  </article>;
}
