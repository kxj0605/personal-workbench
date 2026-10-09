import React from 'react';
import { ArrowRight, CircleHelp, Copy, FileUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import './VideoCollectionPanel.css';
import { BenchmarkVideoDetails, getBenchmarkMetadataFields, getVideoPlatformLabel } from './BenchmarkVideoDetails';
import { loadBenchmarkAccounts } from '../utils/benchmarkLibrary';
import { analyzeCommentFeedback, importCommentText } from '../utils/commentFeedback';
import { moveTopicSummary } from '../utils/topicLibrary';
import { VIDEO_PROFILE_FIELDS } from '../utils/topicAnalysis';
import { parseDouyinShareText } from '../utils/douyinPaste';

const STORAGE_KEY = 'video-collection-v1';
const TOPIC_GROUPS_KEY = 'benchmark-topic-groups-v1';
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
const emptyComparison = () => ({ opening: '', characterConflict: '', twist: '', ending: '', takeaway: '' });
const emptyAnalysisNotes = () => ({ highlights: '', problems: '', reusable: '' });
const emptyFeedback = () => ({ sourceText: '', commentCount: 0, positiveWords: [], negativeWords: [], controversies: [], analyzedAt: '' });
const emptyResearchProfile = () => ({ hookType: '', characterSetup: '', reversalTiming: '', conflictIntensity: '', visualStyle: '', grade: '', followerScale: '', isSeries: '', score: '' });
const emptyVideoDraft = () => ({ title: '', platform: '抖音', platformOverride: '抖音', accountId: '', category: '情绪', tags: '', topicGroup: '', url: '', note: '', researchProfile: emptyResearchProfile(), analysisNotes: emptyAnalysisNotes(), feedback: emptyFeedback(), comparison: emptyComparison(), details: emptyDetails() });
const normalizeGroupName = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const groupKey = (value) => normalizeGroupName(value).toLocaleLowerCase('zh-CN');
const loadTopicGroups = (videos) => {
  let saved = [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TOPIC_GROUPS_KEY) || '[]');
    if (Array.isArray(parsed)) saved = parsed.filter((name) => typeof name === 'string');
  } catch { /* Existing video group names are still recovered below. */ }
  const seen = new Set();
  return [...saved, ...videos.map((video) => video.topicGroup)].map(normalizeGroupName).filter((name) => {
    if (!name || seen.has(groupKey(name))) return false;
    seen.add(groupKey(name));
    return true;
  });
};
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
const formatDate = (value) => {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime()) ? '日期未录入' : new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
};
const splitTags = (value = '') => value.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean);
const formatTopics = (metadata = {}) => String(metadata['benchmark-video-tags'] || '').replaceAll('#', '').trim();
const toVideoDraft = (video, topicGroups) => ({
  title: video.title || '',
  platform: video.platform || getVideoPlatformLabel(video.url),
  platformOverride: video.platformOverride || '',
  accountId: video.accountId || '',
  category: video.category || video.focus || '情绪',
  tags: (video.tags || []).join('，'),
  topicGroup: topicGroups.find((name) => groupKey(name) === groupKey(video.topicGroup)) || '',
  url: video.url || '',
  note: video.note || '',
  researchProfile: { ...emptyResearchProfile(), ...(video.researchProfile || {}) },
  analysisNotes: { ...emptyAnalysisNotes(), ...(video.analysisNotes || {}) },
  feedback: { ...emptyFeedback(), ...(video.feedback || {}) },
  comparison: { ...emptyComparison(), ...(video.comparison || {}) },
  details: video.details || emptyDetails(),
});

export function VideoCollectionPanel({ initialAccountId = '', initialVideoId = '', initialTopicGroup = '', initialComparisonGroup = '', initialComparisonVideoIds = [], onOpenBreakdown, onCreateProject }) {
  const intakeRef = React.useRef(null);
  const comparisonRef = React.useRef(null);
  const savedDraftRef = React.useRef(JSON.stringify({ ...emptyVideoDraft(), topicGroup: initialTopicGroup }));
  const titleInputRef = React.useRef(null);
  const urlInputRef = React.useRef(null);
  const noteInputRef = React.useRef(null);
  const [videos, setVideos] = React.useState(loadVideos);
  const [topicGroups, setTopicGroups] = React.useState(() => loadTopicGroups(videos));
  const [accounts, setAccounts] = React.useState(loadBenchmarkAccounts);
  const [draft, setDraft] = React.useState(() => ({ ...emptyVideoDraft(), topicGroup: initialTopicGroup }));
  const [recordTab, setRecordTab] = React.useState('labels');
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
  const [activeComparisonGroup, setActiveComparisonGroup] = React.useState(initialComparisonGroup);
  const [comparisonSelection, setComparisonSelection] = React.useState(initialComparisonVideoIds);

  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos)); }, [videos]);
  React.useEffect(() => { window.localStorage.setItem(TOPIC_GROUPS_KEY, JSON.stringify(topicGroups)); }, [topicGroups]);
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
  const comparisonGroups = topicGroups.map((name) => [name, videos.filter((video) => groupKey(video.topicGroup) === groupKey(name))]);
  React.useEffect(() => {
    setActiveComparisonGroup((current) => topicGroups.includes(current) ? current : topicGroups[0] || '');
  }, [topicGroups]);
  const resizeDraftNote = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };
  React.useLayoutEffect(() => { resizeDraftNote(noteInputRef.current); }, [draft.note, recordTab]);

  const filteredVideos = videos.filter((video) => {
    const category = video.category || video.focus || '';
    const searchable = `${video.title} ${video.platform || ''} ${category} ${(video.tags || []).join(' ')} ${video.note || ''} ${video.url || ''}`.toLowerCase();
    return (!selectedPlatforms.length || selectedPlatforms.includes(video.platform))
      && (!selectedCategories.length || selectedCategories.includes(category))
      && (!selectedAccountId || video.accountId === selectedAccountId)
      && (!query.trim() || searchable.includes(query.trim().toLowerCase()));
  });
  const relatedVideos = editingVideoId && draft.topicGroup ? videos.filter((video) => video.id !== editingVideoId && groupKey(video.topicGroup) === groupKey(draft.topicGroup)) : [];

  const updateVideo = (id, updater) => {
    setVideos((current) => current.map((item) => item.id === id ? updater(item) : item));
  };

  const createTopicGroup = (value) => {
    const name = normalizeGroupName(value);
    if (!name) { setNotice('请输入题材组名称。'); return false; }
    const existing = topicGroups.find((group) => groupKey(group) === groupKey(name));
    if (existing) { setActiveComparisonGroup(existing); setNotice('这个题材组已经存在。'); return false; }
    setTopicGroups((current) => [...current, name]);
    setActiveComparisonGroup(name);
    setNotice(`已创建题材组「${name}」。`);
    return true;
  };

  const renameTopicGroup = (source, value) => {
    const name = normalizeGroupName(value);
    if (!name) { setNotice('题材组名称不能为空。'); return false; }
    if (topicGroups.some((group) => group !== source && groupKey(group) === groupKey(name))) {
      setNotice('同名题材组已存在，请使用合并。');
      return false;
    }
    if (source === name) return true;
    setTopicGroups((current) => current.map((group) => group === source ? name : group));
    setVideos((current) => current.map((video) => groupKey(video.topicGroup) === groupKey(source) ? { ...video, topicGroup: name } : video));
    setDraft((current) => groupKey(current.topicGroup) === groupKey(source) ? { ...current, topicGroup: name } : current);
    const savedDraft = JSON.parse(savedDraftRef.current);
    if (groupKey(savedDraft.topicGroup) === groupKey(source)) savedDraftRef.current = JSON.stringify({ ...savedDraft, topicGroup: name });
    setActiveComparisonGroup(name);
    moveTopicSummary(source, name);
    setNotice(`已重命名为「${name}」。`);
    return true;
  };

  const mergeTopicGroup = (source, target) => {
    if (!target || source === target) return false;
    const count = videos.filter((video) => groupKey(video.topicGroup) === groupKey(source)).length;
    if (!window.confirm(`将「${source}」的 ${count} 条视频并入「${target}」？原题材组名称将移除，视频与对比笔记会保留。`)) return false;
    setVideos((current) => current.map((video) => groupKey(video.topicGroup) === groupKey(source) ? { ...video, topicGroup: target } : video));
    setTopicGroups((current) => current.filter((group) => group !== source));
    setDraft((current) => groupKey(current.topicGroup) === groupKey(source) ? { ...current, topicGroup: target } : current);
    const savedDraft = JSON.parse(savedDraftRef.current);
    if (groupKey(savedDraft.topicGroup) === groupKey(source)) savedDraftRef.current = JSON.stringify({ ...savedDraft, topicGroup: target });
    setActiveComparisonGroup(target);
    moveTopicSummary(source, target, true);
    setNotice(`已将「${source}」并入「${target}」。`);
    return true;
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
    const existingVideo = videos.find((video) => video.id === editingVideoId);
    const nextVideo = {
      id: existingVideo?.id || makeId(),
      createdAt: existingVideo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title,
      platform: draft.platform,
      platformOverride: draft.platformOverride || '',
      accountId: draft.accountId || '',
      category: draft.category,
      topicGroup: draft.topicGroup.trim(),
      status: existingVideo?.status || 'pending',
      tags: splitTags(draft.tags),
      url,
      note: draft.note.trim(),
      researchProfile: { ...emptyResearchProfile(), ...(draft.researchProfile || {}) },
      analysisNotes: { ...emptyAnalysisNotes(), ...(draft.analysisNotes || {}) },
      feedback: { ...emptyFeedback(), ...(draft.feedback || {}) },
      comparison: { ...emptyComparison(), ...(draft.comparison || {}) },
      details,
    };
    const isEditing = Boolean(editingVideoId);
    setVideos((current) => isEditing
      ? current.map((video) => video.id === editingVideoId ? { ...video, ...nextVideo } : video)
      : [nextVideo, ...current]);
    const savedDraft = toVideoDraft(nextVideo, topicGroups);
    setDraft(savedDraft);
    savedDraftRef.current = JSON.stringify(savedDraft);
    setEditingVideoId(nextVideo.id);
    setIsCollectSuccess(true);
    setSubmitSuccessLabel(isEditing ? '已保存修改 ✓' : '已收录到视频库 ✓');
    setValidationErrors({ title: false, url: false });
  };

  const startEdit = (video) => {
    if (editingVideoId === video.id) { window.requestAnimationFrame(() => intakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); return; }
    if (JSON.stringify(draft) !== savedDraftRef.current && !window.confirm('当前页面有未保存的修改，仍要切换视频吗？')) return;
    const nextDraft = toVideoDraft(video, topicGroups);
    setDraft(nextDraft);
    savedDraftRef.current = JSON.stringify(nextDraft);
    setEditingVideoId(video.id);
    setRecordTab('labels');
    setIsCollectSuccess(false);
    setSubmitSuccessLabel('');
    setValidationErrors({ title: false, url: false });
    window.requestAnimationFrame(() => intakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  React.useEffect(() => {
    if (!initialVideoId) return;
    const video = videos.find((item) => item.id === initialVideoId);
    if (video) startEdit(video);
  }, [initialVideoId]);
  React.useEffect(() => {
    if (!initialComparisonGroup) return;
    setActiveComparisonGroup(initialComparisonGroup);
    window.requestAnimationFrame(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [initialComparisonGroup]);

  const cancelEdit = () => {
    if (editingVideoId && JSON.stringify(draft) !== savedDraftRef.current && !window.confirm('当前视频有未保存的修改，仍要录入新视频吗？')) return;
    setEditingVideoId(null);
    setDraft({ ...emptyVideoDraft(), topicGroup: initialTopicGroup });
    savedDraftRef.current = JSON.stringify({ ...emptyVideoDraft(), topicGroup: initialTopicGroup });
    setRecordTab('labels');
    setIsCollectSuccess(false);
    setSubmitSuccessLabel('');
    setValidationErrors({ title: false, url: false });
  };

  const openBreakdown = (video) => {
    updateVideo(video.id, (item) => ({ ...item, status: item.status === 'pending' ? 'breaking' : item.status }));
    onOpenBreakdown(video);
  };

  const deleteVideo = (video) => {
    if (!window.confirm(`确定删除「${video.title}」吗？删除后无法恢复。`)) return;
    setVideos((current) => current.filter((item) => item.id !== video.id));
    if (editingVideoId === video.id) {
      setEditingVideoId(null);
      setDraft(emptyVideoDraft());
      savedDraftRef.current = JSON.stringify(emptyVideoDraft());
      setRecordTab('labels');
    }
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
        platformOverride: current.url ? current.platformOverride : '',
        url: current.url || parsed.url,
        details: {
          ...(current.details || {}),
          metadata: {
            ...metadata,
            'benchmark-video-title': metadata['benchmark-video-title'] || parsed.description.slice(0, 100),
            'benchmark-video-tags': metadata['benchmark-video-tags'] || parsed.tags.join('、'),
            'benchmark-video-url': current.url || metadata['benchmark-video-url'] || parsed.url,
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
      <div className="video-collection-intake-heading"><div><h1 id="video-collection-intake-title">{editingVideoId ? '单视频详情' : '加入对标视频'}</h1>{editingVideoId && <p className="video-detail-current-title">{draft.title}</p>}</div><div className="video-collection-submit video-collection-header-submit">{editingVideoId && <button type="button" className="video-collection-cancel" onClick={cancelEdit}>录入新视频</button>}<button form="video-collection-form" type="submit" className={isCollectSuccess ? 'is-success' : undefined} aria-live="polite">{isCollectSuccess ? submitSuccessLabel : editingVideoId ? '保存详情' : <><Plus size={17} />加入对标库</>}</button></div></div>
      {editingVideoId && <div className="video-detail-labels" aria-label="当前视频改编标签"><span>{draft.topicGroup || '未归题材组'}</span><span>{draft.category}</span>{splitTags(draft.tags).map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</div>}
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
          <div className="video-record-tabs" role="tablist" aria-label="我的研究记录分类">{[['labels', '改编标签'], ['analysis', '分析笔记'], ['feedback', '用户反馈']].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={recordTab === id} className={recordTab === id ? 'active' : ''} onClick={() => setRecordTab(id)}>{label}</button>)}</div>
          {recordTab === 'labels' && <div className="video-record-panel" role="tabpanel" aria-label="改编标签"><label className="video-account-field"><span>关联对标账号（可选）</span><select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}><option value="">不关联账号，单独收录</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.platform} · {account.name}</option>)}</select></label><div className="video-research-type"><span>研究类型</span><ChoiceGroup options={CATEGORIES} value={draft.category} onChange={(category) => setDraft({ ...draft, category })} tone="focus" /></div><label className="video-account-field"><span>题材组（同一核心故事骨架）</span><select value={draft.topicGroup} onChange={(event) => setDraft({ ...draft, topicGroup: event.target.value })} aria-label="题材组"><option value="">暂不归组</option>{topicGroups.map((name) => <option value={name} key={name}>{name}</option>)}</select></label><label className="video-basic-field"><span>改编标签</span><input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="如：开头钩子、身份反转，用 、 分隔" aria-label="改编标签" /></label><label className="video-basic-field"><span>研究备注</span><textarea ref={noteInputRef} className="video-research-note" value={draft.note} onChange={(event) => { setDraft({ ...draft, note: event.target.value }); resizeDraftNote(event.currentTarget); }} placeholder="为什么值得收集 / 我想研究什么（可选）" aria-label="研究备注" rows="2" /></label></div>}
          {recordTab === 'labels' && <ResearchProfileEditor profile={draft.researchProfile} onChange={(researchProfile) => setDraft((current) => ({ ...current, researchProfile }))} />}
          {recordTab === 'analysis' && <div className="video-record-panel" role="tabpanel" aria-label="分析笔记"><div className="video-analysis-grid">{[['highlights', '这个版本的亮点', '哪些设计有效？'], ['problems', '存在的问题', '哪些地方不成立或可以改进？'], ['reusable', '可复用点', '哪些方法值得带入自己的改编？']].map(([key, label, placeholder]) => <label className="video-basic-field" key={key}><span>{label}</span><textarea value={draft.analysisNotes?.[key] || ''} onChange={(event) => setDraft({ ...draft, analysisNotes: { ...draft.analysisNotes, [key]: event.target.value } })} placeholder={placeholder} rows="3" maxLength="2000" /></label>)}</div><section className="video-comparison-inputs" aria-labelledby="video-comparison-inputs-title"><div><h3 id="video-comparison-inputs-title">多版本对比笔记</h3><p>归组后即可查看单条视频；同组多条视频会自动并排对比。</p></div><div className="video-comparison-input-grid">{[['opening', '开头钩子', '前 3 秒怎样抓人？'], ['characterConflict', '人物 / 冲突', '谁和谁发生了什么？'], ['twist', '核心反转', '关键的预期变化是什么？'], ['ending', '结局', '最后如何收束或留钩子？'], ['takeaway', '可借鉴改法', '你准备怎样改成自己的版本？']].map(([key, label, placeholder]) => <label key={key}><span>{label}</span><textarea value={draft.comparison?.[key] || ''} onChange={(event) => setDraft({ ...draft, comparison: { ...draft.comparison, [key]: event.target.value } })} placeholder={placeholder} rows="2" maxLength="180" /></label>)}</div></section></div>}
          {recordTab === 'feedback' && <UserFeedbackPanel feedback={draft.feedback} onChange={(feedback) => setDraft((current) => ({ ...current, feedback }))} onNotice={setNotice} />}
        </section>
      </form>
      {editingVideoId && <section className="video-related-card" aria-labelledby="video-related-title"><div><h2 id="video-related-title">同母题其他改编版本</h2><p>{draft.topicGroup ? `共同题材组：${draft.topicGroup}` : '将视频归入题材组后，可在这里快速切换同母题版本。'}</p></div>{relatedVideos.length ? <div className="video-related-list">{relatedVideos.map((video) => <button type="button" key={video.id} onClick={() => startEdit(video)}><b>{video.title}</b><span>{video.platform || '未填平台'} · {(video.tags || []).slice(0, 2).join('、') || video.category || '未填标签'}</span><ArrowRight size={16} /></button>)}</div> : <p className="video-related-empty">暂无其他改编版本。</p>}</section>}
    </section>

    <div ref={comparisonRef}><ComparisonBoard groups={comparisonGroups} activeGroup={activeComparisonGroup} selectedVideoIds={comparisonSelection} onSelectGroup={(name) => { setActiveComparisonGroup(name); setComparisonSelection([]); }} onCreateGroup={createTopicGroup} onRenameGroup={renameTopicGroup} onMergeGroup={mergeTopicGroup} /></div>

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

function ResearchProfileEditor({ profile = emptyResearchProfile(), onChange }) {
  return <section className="video-profile-editor" aria-labelledby="video-profile-title">
    <div><h3 id="video-profile-title">结构化改编标签与评分</h3><p>供母题详情页筛选和对比使用；未填写的旧视频会显示“未标注”。</p></div>
    <div className="video-profile-grid">{VIDEO_PROFILE_FIELDS.map(({ key, label, options }) => <label key={key}>{label}<select value={profile[key] || ''} onChange={(event) => onChange({ ...profile, [key]: event.target.value })}><option value="">未标注</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}<label>综合分（手动，0–100）<input type="number" min="0" max="100" step="1" value={profile.score ?? ''} onChange={(event) => onChange({ ...profile, score: event.target.value })} placeholder="未评分" /></label></div>
  </section>;
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

function UserFeedbackPanel({ feedback = emptyFeedback(), onChange, onNotice }) {
  const fileInputRef = React.useRef(null);
  const sourceText = feedback.sourceText || '';
  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) { onNotice('评论文件超过 1 MB，请分批导入。'); return; }
    try {
      const bytes = await file.arrayBuffer();
      let content;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
      catch { content = new TextDecoder('gb18030').decode(bytes); }
      const text = importCommentText(content, file.name);
      if (!text || text.length > 120_000) { onNotice(text ? '评论文本过长，请分批导入。' : '未从文件中读到评论。'); return; }
      onChange({ ...emptyFeedback(), sourceText: text });
      onNotice('评论已导入，请点击“提取反馈”，再保存视频详情。');
    } catch { onNotice('评论文件读取失败，请改用 TXT 或 CSV。'); }
  };
  const extract = () => {
    if (!sourceText.trim()) { onNotice('请先粘贴或导入评论。'); return; }
    const result = analyzeCommentFeedback(sourceText);
    if (!result.commentCount) { onNotice('未识别到有效评论。'); return; }
    onChange(result);
    onNotice(`已从 ${result.commentCount} 条评论提取反馈，请保存视频详情。`);
  };
  return <div className="video-record-panel video-feedback-panel" role="tabpanel" aria-label="用户反馈">
    <div className="video-feedback-intro"><h3>从评论提取用户反馈</h3><p>每行一条评论；也可导入含“评论内容 / 评论 / 内容 / comment / text”列的 CSV，或 TXT。提取在当前浏览器完成，结果可核对原文。</p></div>
    <label className="video-basic-field"><span>评论原文</span><textarea value={sourceText} onChange={(event) => onChange({ ...emptyFeedback(), sourceText: event.target.value })} placeholder="每行粘贴一条评论" rows="7" maxLength="120000" /></label>
    <div className="video-feedback-actions"><input ref={fileInputRef} type="file" accept=".txt,.csv,text/plain,text/csv" onChange={importFile} aria-label="导入评论文件" /><button type="button" onClick={() => fileInputRef.current?.click()}><FileUp size={16} />导入 TXT / CSV</button><button type="button" className="video-feedback-extract" onClick={extract}>提取反馈</button><span>{feedback.analyzedAt ? `已分析 ${feedback.commentCount} 条评论` : '尚未提取'}</span></div>
    <p className="video-feedback-method">本地关键词初筛：词频按出现评论数统计；同一主题同时有正面和负面评价时，列为争议候选。请结合原评论判断。</p>
    <div className="video-feedback-results"><section><h4>正面高频词</h4>{feedback.positiveWords?.length ? <div className="video-feedback-words positive">{feedback.positiveWords.map(({ word, count }) => <span key={word}>{word}<b>{count}</b></span>)}</div> : <p>暂无可提取的正面词。</p>}</section><section><h4>负面高频词</h4>{feedback.negativeWords?.length ? <div className="video-feedback-words negative">{feedback.negativeWords.map(({ word, count }) => <span key={word}>{word}<b>{count}</b></span>)}</div> : <p>暂无可提取的负面词。</p>}</section><section className="video-feedback-controversies"><h4>核心争议点</h4>{feedback.controversies?.length ? <div>{feedback.controversies.map((item) => <article key={item.topic}><strong>{item.topic}</strong><span>正面 {item.positiveCount} 条 · 负面 {item.negativeCount} 条</span><p>正面例句：{item.positiveExample}</p><p>负面例句：{item.negativeExample}</p></article>)}</div> : <p>目前没有足够的正反评价来识别同主题争议。</p>}</section></div>
  </div>;
}

function ComparisonBoard({ groups, activeGroup, selectedVideoIds = [], onSelectGroup, onCreateGroup, onRenameGroup, onMergeGroup }) {
  const [newGroupName, setNewGroupName] = React.useState('');
  const [renameName, setRenameName] = React.useState('');
  const [mergeTarget, setMergeTarget] = React.useState('');
  const selected = groups.find(([name]) => name === activeGroup) || groups[0];
  const [name, allVideos] = selected || ['', []];
  const videos = selectedVideoIds.length ? allVideos.filter((video) => selectedVideoIds.includes(video.id)) : allVideos;
  React.useEffect(() => { setRenameName(name); setMergeTarget(''); }, [name]);
  const rows = [
    ['opening', '开头钩子'],
    ['characterConflict', '人物 / 冲突'],
    ['twist', '核心反转'],
    ['ending', '结局'],
    ['takeaway', '可借鉴改法'],
  ];
  return <section className="video-comparison-board" aria-labelledby="video-comparison-title">
    <header><div><span>多版本横向对比</span><h2 id="video-comparison-title">题材组</h2><p>把同题材视频放在一起，查看每个版本的改法。</p></div><form className="video-comparison-create" onSubmit={(event) => { event.preventDefault(); if (onCreateGroup(newGroupName)) setNewGroupName(''); }}><input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} aria-label="新题材组名称" placeholder="新题材组名称" maxLength="40" /><button type="submit"><Plus size={15} />创建题材组</button></form></header>
    {groups.length ? <>
      <div className="video-comparison-groups" aria-label="题材组列表">{groups.map(([groupName, groupVideos]) => <button key={groupName} type="button" className={groupName === name ? 'active' : ''} aria-pressed={groupName === name} onClick={() => onSelectGroup(groupName)}>{groupName}<b>{groupVideos.length}</b></button>)}</div>
      <div className="video-comparison-management"><div><h3>{name}</h3><p>{videos.length} 条对标视频{videos.length === 1 ? ' · 可继续加入同题材版本' : ''}</p></div><form onSubmit={(event) => { event.preventDefault(); onRenameGroup(name, renameName); }}><input value={renameName} onChange={(event) => setRenameName(event.target.value)} aria-label="重命名题材组" maxLength="40" /><button type="submit">重命名</button></form>{groups.length > 1 && <form onSubmit={(event) => { event.preventDefault(); if (onMergeGroup(name, mergeTarget)) setMergeTarget(''); }}><select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} aria-label="合并目标题材组"><option value="">合并到…</option>{groups.filter(([groupName]) => groupName !== name).map(([groupName]) => <option value={groupName} key={groupName}>{groupName}</option>)}</select><button type="submit" disabled={!mergeTarget}>合并</button></form>}</div>
      {videos.length ? <>{videos.length > 1 && <p className="video-comparison-scroll-hint">左右滑动表格，查看其他版本。</p>}<div className="video-comparison-scroll"><table><thead><tr><th scope="col">对比维度</th>{videos.map((video) => <th scope="col" key={video.id}><span>{video.title}</span><small>{video.platform || '未填平台'}</small></th>)}</tr></thead><tbody>{rows.map(([key, label]) => <tr key={key}><th scope="row">{label}</th>{videos.map((video) => <td key={video.id}>{video.comparison?.[key] || <span className="video-comparison-blank">待补充</span>}</td>)}</tr>)}</tbody></table></div></> : <p className="video-comparison-empty">这个题材组还没有视频。录入或编辑对标视频时，可在“题材组”中选择它。</p>}
    </> : <p className="video-comparison-empty">还没有题材组。先创建一个，再把对标视频归入其中。</p>}
  </section>;
}

function VideoCard({ video, account, onOpen, onCreateProject, onEdit, onDelete }) {
  const status = STATUSES[video.status] || STATUSES.pending;

  return <article className="video-library-row compact">
    <div className="video-library-row-summary">
      <div className="video-library-row-title"><h3><button type="button" className="video-library-title-link" onClick={onEdit}>{video.title}</button></h3><span className={`video-chip status ${status.className}`}>{status.label}</span></div>
    </div>
    <div className="video-library-row-meta"><span className="video-chip platform">{video.platform}</span>{account && <span className="video-chip account">{account.name}</span>}<span className="video-chip focus">{video.category || video.focus || '剧情'}</span>{video.topicGroup && <span className="video-chip topic">{video.topicGroup}</span>}<time>{formatDate(video.createdAt)}</time></div>
    <p className={`video-library-row-note ${video.note ? '' : 'is-empty'}`}>{video.note || '点击铅笔添加简短备注'}</p>
    <div className="video-library-row-actions">
      <button className="video-library-row-primary-action" type="button" onClick={onCreateProject}>创建改编项目<ArrowRight size={16} /></button>
      <button className="video-library-row-secondary-action" type="button" onClick={onOpen}>直接拆解</button>
      <button className="video-library-row-edit" type="button" onClick={onEdit} aria-label={`查看${video.title}详情`} title="查看详情"><Pencil size={17} /></button>
      <button className="video-library-row-delete" type="button" onClick={onDelete} aria-label={`删除${video.title}`} title="删除视频"><Trash2 size={17} /></button>
    </div>
  </article>;
}
