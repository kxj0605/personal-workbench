import React from 'react';
import { ArrowRight, CircleHelp, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import './VideoCollectionPanel.css';
import { BenchmarkVideoDetails, getBenchmarkMetadataFields, getVideoPlatformLabel } from './BenchmarkVideoDetails';
import { loadBenchmarkAccounts } from '../utils/benchmarkLibrary';

const STORAGE_KEY = 'video-collection-v1';
const PLATFORMS = ['抖音', 'YouTube', '快手', 'B站', '小红书', '其他'];
const CATEGORIES = ['情绪', '反转打脸爽剧', '搞笑整蛊', '剧情', 'shorts'];
const BASIC_METADATA_FIELD_NAMES = ['benchmark-video-title', 'benchmark-video-tags', 'benchmark-video-url'];
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
const splitTags = (value = '') => value.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean);
const formatTopics = (metadata = {}) => String(metadata['benchmark-video-tags'] || '').replaceAll('#', '').trim();

function parseDouyinShareText(value = '') {
  const normalized = String(value).replace(/\\(?=[:/])/g, '').trim();
  const url = normalized.match(/https?:\/\/[^\s'"”）\]]+/i)?.[0] || '';
  if (!/douyin\.com\b/i.test(url)) return null;

  const tags = [...normalized.matchAll(/#[\s\u3000]*([^\s#]+)/g)].map((match) => match[1].trim()).filter(Boolean);
  const firstTagIndex = normalized.search(/#[\s\u3000]*\S/);
  let description = (firstTagIndex >= 0 ? normalized.slice(0, firstTagIndex) : normalized).replace(url, '').trim();
  const quoteStart = description.search(/[“"「]/);
  if (quoteStart >= 0) description = description.slice(quoteStart).trim();
  else description = description.replace(/^[\d.\s:]+(?:\d{2}\/\d{2}\s+)?(?:[\w@.-]+\s+){1,3}\/?\s*/, '').trim();
  const shareHeader = description.match(/^([^\u4e00-\u9fff“"「]{0,120}):\/\s*/);
  if (shareHeader) description = description.slice(shareHeader[0].length).trim();
  if (!description) return null;

  return { url, tags: [...new Set(tags)], description };
}

export function VideoCollectionPanel({ initialAccountId = '', onOpenBreakdown, onCreateProject }) {
  const intakeRef = React.useRef(null);
  const titleInputRef = React.useRef(null);
  const urlInputRef = React.useRef(null);
  const noteInputRef = React.useRef(null);
  const [videos, setVideos] = React.useState(loadVideos);
  const [accounts, setAccounts] = React.useState(loadBenchmarkAccounts);
  const [draft, setDraft] = React.useState({ title: '', platform: '抖音', platformOverride: '抖音', accountId: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
  const [query, setQuery] = React.useState('');
  const [selectedPlatforms, setSelectedPlatforms] = React.useState([]);
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState(initialAccountId);
  const [isCollectSuccess, setIsCollectSuccess] = React.useState(false);
  const [submitSuccessLabel, setSubmitSuccessLabel] = React.useState('');
  const [editingVideoId, setEditingVideoId] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState({ title: false, url: false });
  const [notice, setNotice] = React.useState('');
  const [dataActionTarget, setDataActionTarget] = React.useState(null);
  const [platformTarget, setPlatformTarget] = React.useState(null);

  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos)); }, [videos]);
  React.useEffect(() => { setSelectedAccountId(initialAccountId); }, [initialAccountId]);
  React.useEffect(() => {
    const refreshAccounts = () => setAccounts(loadBenchmarkAccounts());
    window.addEventListener('focus', refreshAccounts);
    window.addEventListener('storage', refreshAccounts);
    return () => { window.removeEventListener('focus', refreshAccounts); window.removeEventListener('storage', refreshAccounts); };
  }, []);
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
      && (!selectedAccountId || video.accountId === selectedAccountId)
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
    const details = {
      ...(draft.details || emptyDetails()),
      metadata: {
        ...(draft.details?.metadata || {}),
        'benchmark-video-title': title,
        'benchmark-video-url': url,
      },
    };
    const nextVideo = {
      title,
      platform: draft.platform,
      platformOverride: draft.platformOverride || '',
      accountId: draft.accountId || '',
      category: draft.category,
      status: 'pending',
      tags: splitTags(draft.tags),
      url,
      note: draft.note.trim(),
      details,
    };
    const isEditing = Boolean(editingVideoId);
    setVideos((current) => isEditing
      ? current.map((video) => video.id === editingVideoId ? { ...video, ...nextVideo } : video)
      : [{ id: makeId(), createdAt: new Date().toISOString(), ...nextVideo }, ...current]);
    setDraft({ title: '', platform: '抖音', platformOverride: '抖音', accountId: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
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
      accountId: video.accountId || '',
      category: video.category || video.focus || '情绪',
      tags: (video.tags || []).join('，'),
      url: video.url || '',
      note: video.note || '',
      details: video.details || emptyDetails(),
    });
    setEditingVideoId(video.id);
    setIsCollectSuccess(false);
    setSubmitSuccessLabel('');
    setValidationErrors({ title: false, url: false });
    window.requestAnimationFrame(() => intakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const cancelEdit = () => {
    setEditingVideoId(null);
    setDraft({ title: '', platform: '抖音', platformOverride: '抖音', accountId: '', category: '情绪', tags: '', url: '', note: '', details: emptyDetails() });
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

  const applyDouyinShare = (text) => {
    const parsed = parseDouyinShareText(text);
    if (!parsed) return false;
    setDraft((current) => {
      const metadata = current.details?.metadata || {};
      return {
        ...current,
        title: current.title || parsed.description.slice(0, 100),
        platform: current.url ? current.platform : '抖音',
        platformOverride: '',
        url: current.url || parsed.url,
        details: {
          ...(current.details || {}),
          metadata: {
            ...metadata,
            'benchmark-video-title': metadata['benchmark-video-title'] || parsed.description.slice(0, 100),
            'benchmark-video-tags': metadata['benchmark-video-tags'] || parsed.tags.join('、'),
            'benchmark-video-url': metadata['benchmark-video-url'] || parsed.url,
          },
        },
      };
    });
    setValidationErrors({ title: false, url: false });
    setNotice(`已识别视频标题、${parsed.tags.length} 个话题和视频链接。`);
    return true;
  };

  const updateDraftMetadata = (name, value) => setDraft((current) => ({
    ...current,
    details: { ...(current.details || {}), metadata: { ...(current.details?.metadata || {}), [name]: value } },
  }));
  const updateTopics = (value) => setDraft((current) => {
    const topics = value.replace(/^\s*(?:话题|标签)\s*[：:]?\s*/, '').replaceAll('#', '').trim();
    return {
      ...current,
      details: {
        ...(current.details || {}),
        metadata: {
          ...(current.details?.metadata || {}),
          'benchmark-video-tags': topics,
        },
      },
    };
  });
  const metadata = draft.details?.metadata || {};
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
  const copyAllVideoInformation = async () => {
    const metadataLines = getBenchmarkMetadataFields(draft.url)
      .filter((field) => !BASIC_METADATA_FIELD_NAMES.includes(field.name))
      .map((field) => `${field.label}：${metadata[field.name] || ''}`);
    const text = [
      `视频名称：${draft.title}`,
      `视频链接：${draft.url}`,
      `视频话题：${formatTopics(metadata)}`,
      ...metadataLines,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice('全部视频信息已复制。');
    } catch {
      setNotice('复制失败，请允许浏览器访问剪贴板。');
    }
  };

  return <section className="video-collection" aria-label="对标视频">
    {notice && <p className="video-collection-notice" role="status">{notice}</p>}
    <section className="video-collection-intake" ref={intakeRef} aria-labelledby="video-collection-intake-title">
      <div className="video-collection-intake-heading"><h1 id="video-collection-intake-title">{editingVideoId ? '编辑对标视频' : '加入对标视频'}</h1><div className="video-collection-submit video-collection-header-submit">{editingVideoId && <button type="button" className="video-collection-cancel" onClick={cancelEdit}>取消编辑</button>}<button form="video-collection-form" type="submit" className={isCollectSuccess ? 'is-success' : undefined} aria-live="polite">{isCollectSuccess ? submitSuccessLabel : editingVideoId ? '保存修改' : <><Plus size={17} />加入对标库</>}</button></div></div>
      <form id="video-collection-form" onSubmit={collectVideo} className="video-collection-form">
        <section className="video-intake-section video-intake-card video-basic-video-card" aria-labelledby="video-basic-info-title">
          <div className="video-card-heading"><div className="video-intake-section-heading"><div className="video-basic-title-row"><h2 id="video-basic-info-title">① 视频信息</h2><HelpPopover label="视频信息" text="填写基础信息与平台视频数据；可通过导入弹窗一次补齐。" /><span className="video-basic-platform-target" ref={setPlatformTarget} /></div></div><div className="video-card-toolbar" ref={setDataActionTarget} /></div>
          <div className="video-collection-primary-row">
            <div className="video-collection-field"><input ref={titleInputRef} className={`video-collection-title${validationErrors.title ? ' has-error' : ''}`} value={draft.title} onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setValidationErrors((current) => current.title ? { ...current, title: false } : current); }} placeholder={validationErrors.title ? '请填写名称' : '视频名称（必填） 如电梯反转片'} aria-label="视频名称" aria-invalid={validationErrors.title || undefined} maxLength="100" /></div>
            <div className={`video-collection-url-field${validationErrors.url ? ' has-error' : ''}`}><input ref={urlInputRef} type="url" value={draft.url} onChange={(event) => { const url = event.target.value; const isEmpty = !url.trim(); setDraft({ ...draft, url, platform: isEmpty ? '抖音' : getVideoPlatformLabel(url), platformOverride: isEmpty ? '抖音' : '' }); setValidationErrors((current) => current.url ? { ...current, url: false } : current); }} onPaste={(event) => { const text = event.clipboardData.getData('text/plain'); if (applyDouyinShare(text)) event.preventDefault(); }} placeholder="视频链接" aria-label="视频链接" aria-invalid={validationErrors.url || undefined} /><button type="button" onClick={copyDraftUrl} disabled={!draft.url.trim()} title="复制视频链接" aria-label="复制视频链接"><Copy size={17} /><span>复制</span></button></div>
          </div>
          <label className="video-description-topic"><textarea value={formatTopics(metadata)} onChange={(event) => updateTopics(event.target.value)} placeholder="视频话题" aria-label="视频话题" rows="1" /></label>
          <BenchmarkVideoDetails video={draft} onChange={setDraft} onNotice={setNotice} excludedFieldNames={BASIC_METADATA_FIELD_NAMES} heading="视频数据" showHeading={false} showMetadataHeading={false} actionsPortalTarget={dataActionTarget} platformPortalTarget={platformTarget} onCopyAll={copyAllVideoInformation} />
        </section>
        <section className="video-intake-section video-intake-card" aria-labelledby="video-research-record-title">
          <div className="video-intake-section-heading"><div className="video-basic-title-row"><h2 id="video-research-record-title">② 我的研究记录</h2><HelpPopover label="我的研究记录" text="只记录你的判断和后续检索所需的信息。" /></div></div>
          <label className="video-account-field"><span>关联对标账号（可选）</span><select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}><option value="">不关联账号，单独收录</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.platform} · {account.name}</option>)}</select></label>
          <div className="video-research-type"><span>研究类型</span><ChoiceGroup options={CATEGORIES} value={draft.category} onChange={(category) => setDraft({ ...draft, category })} tone="focus" /></div>
          <label className="video-basic-field"><span>我的标签</span><input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="如：开头钩子、历史题材，用 、 分隔" aria-label="我的标签" /></label>
          <label className="video-basic-field"><span>研究备注</span><textarea ref={noteInputRef} value={draft.note} onChange={(event) => { setDraft({ ...draft, note: event.target.value }); resizeDraftNote(event.currentTarget); }} placeholder="为什么值得收集 / 我想研究什么（可选）" aria-label="研究备注" rows="1" /></label>
        </section>
      </form>
    </section>

    <section className="video-library" aria-labelledby="video-library-title">
      <div className="video-library-head"><div><div className="video-library-title-row"><h2 id="video-library-title">对标视频</h2><span className="video-library-count">{filteredVideos.length} 条</span></div><p>{selectedAccount ? `正在查看「${selectedAccount.name}」已收录的作品。` : '集中检索已收录的视频，并从这里创建改编项目或进入拆解。'}</p></div>{selectedAccount && <button type="button" className="video-library-account-filter" onClick={() => setSelectedAccountId('')}>查看全部账号</button>}</div>
      <div className="video-library-filter"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索视频、标签、备注…" /></label><div className="video-library-filter-row"><span>标签</span><div className="video-library-filter-tabs category-filter" aria-label="按标签筛选视频">{CATEGORIES.map((category) => <button key={category} type="button" aria-pressed={selectedCategories.includes(category)} className={selectedCategories.includes(category) ? 'active' : ''} onClick={() => setSelectedCategories((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category])}>{category}</button>)}</div></div><div className="video-library-filter-row"><span>平台</span><div className="video-library-filter-tabs platform-filter" aria-label="按平台筛选视频">{PLATFORMS.map((platform) => <button key={platform} type="button" aria-pressed={selectedPlatforms.includes(platform)} className={selectedPlatforms.includes(platform) ? 'active' : ''} onClick={() => setSelectedPlatforms((current) => current.includes(platform) ? current.filter((value) => value !== platform) : [...current, platform])}>{platform}</button>)}</div>{(selectedPlatforms.length > 0 || selectedCategories.length > 0) && <button className="video-library-filter-clear" type="button" onClick={() => { setSelectedPlatforms([]); setSelectedCategories([]); }}>清除筛选</button>}</div></div>
      <div className="video-library-list">{filteredVideos.length ? filteredVideos.map((video) => <VideoCard key={video.id} video={video} account={accounts.find((account) => account.id === video.accountId)} onOpen={() => openBreakdown(video)} onCreateProject={() => onCreateProject?.(video)} onEdit={() => startEdit(video)} onDelete={() => deleteVideo(video)} />) : <p className="video-library-empty">还没有符合条件的对标视频。先从账号近期作品中选择一条加入对标库。</p>}</div>
    </section>
  </section>;
}

function ChoiceGroup({ options, value, onChange, tone = '', children }) {
  return <div className={`video-choice-group ${tone}`}><div>{options.map((option) => <button key={option} type="button" aria-pressed={value === option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{option}</button>)}{children}</div></div>;
}

function HelpPopover({ label, text }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const popoverRef = React.useRef(null);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const closeWhenOutside = (event) => {
      if (!popoverRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('pointerdown', closeWhenOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeWhenOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return <span className="video-help-popover" ref={popoverRef}><button type="button" className="video-help-trigger" aria-label={`查看${label}说明`} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} title="查看说明"><CircleHelp size={16} /></button>{isOpen && <span className="video-help-content" role="tooltip">{text}</span>}</span>;
}

function VideoCard({ video, account, onOpen, onCreateProject, onEdit, onDelete }) {
  const status = STATUSES[video.status] || STATUSES.pending;

  return <article className="video-library-row compact">
    <div className="video-library-row-summary">
      <div className="video-library-row-title"><h3>{video.title}</h3><span className={`video-chip status ${status.className}`}>{status.label}</span></div>
    </div>
    <div className="video-library-row-meta"><span className="video-chip platform">{video.platform}</span>{account && <span className="video-chip account">{account.name}</span>}<span className="video-chip focus">{video.category || video.focus || '剧情'}</span><time>{formatDate(video.createdAt)}</time></div>
    <p className={`video-library-row-note ${video.note ? '' : 'is-empty'}`}>{video.note || '点击铅笔添加简短备注'}</p>
    <div className="video-library-row-actions">
      <button className="video-library-row-primary-action" type="button" onClick={onCreateProject}>创建改编项目<ArrowRight size={16} /></button>
      <button className="video-library-row-secondary-action" type="button" onClick={onOpen}>直接拆解</button>
      <button className="video-library-row-edit" type="button" onClick={onEdit} aria-label={`编辑${video.title}`} title="编辑视频"><Pencil size={17} /></button>
      <button className="video-library-row-delete" type="button" onClick={onDelete} aria-label={`删除${video.title}`} title="删除视频"><Trash2 size={17} /></button>
    </div>
  </article>;
}
