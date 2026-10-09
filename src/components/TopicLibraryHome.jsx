import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Download, Layers3, Plus, Search, Star } from 'lucide-react';
import { loadBenchmarkVideos } from '../utils/benchmarkLibrary';
import {
  loadTopicFavorites, loadTopicGuide, loadTopicMetadata, loadTopicRecents, loadTopicSummaries,
  recordTopicVisit, saveTopicFavorites, saveTopicGuide, saveTopicMetadata, saveTopicSummary,
  TOPIC_CATEGORIES, TOPIC_GROUPS_KEY, topicKey,
} from '../utils/topicLibrary';
import './TopicLibraryHome.css';
import { TopicDetailPanel } from './TopicDetailPanel';

function loadGroups(videos) {
  let saved = [];
  try {
    const value = JSON.parse(window.localStorage.getItem(TOPIC_GROUPS_KEY) || '[]');
    if (Array.isArray(value)) saved = value.filter((name) => typeof name === 'string');
  } catch { /* Recover names from videos below. */ }
  const seen = new Set();
  return [...saved, ...videos.map((video) => video.topicGroup)].map((name) => String(name || '').trim().replace(/\s+/g, ' ')).filter((name) => {
    if (!name || seen.has(topicKey(name))) return false;
    seen.add(topicKey(name));
    return true;
  });
}

const splitDirections = (value) => [...new Set(String(value || '').split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean))];
const versionDate = (video) => Date.parse(video.updatedAt || video.createdAt || '') || 0;
const getVersions = (videos, name) => videos.filter((video) => topicKey(video.topicGroup) === topicKey(name)).sort((a, b) => versionDate(b) - versionDate(a));
const getUpdatedAt = (versions, meta) => Math.max(Date.parse(meta?.updatedAt || '') || 0, ...versions.map(versionDate), 0);

export function TopicLibraryHome({ selectedGroup, onSelectGroup, onOpenVideo, onAddVideo, onOpenComparison, onOpenVideos }) {
  const [videos] = React.useState(loadBenchmarkVideos);
  const [groups, setGroups] = React.useState(() => loadGroups(videos));
  const [summaries, setSummaries] = React.useState(loadTopicSummaries);
  const [metadata, setMetadata] = React.useState(loadTopicMetadata);
  const [favorites, setFavorites] = React.useState(loadTopicFavorites);
  const [recents, setRecents] = React.useState(loadTopicRecents);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [countFilter, setCountFilter] = React.useState('');
  const [sortBy, setSortBy] = React.useState('updated');
  const [newGroup, setNewGroup] = React.useState('');
  const [summaryDraft, setSummaryDraft] = React.useState('');
  const [categoryDraft, setCategoryDraft] = React.useState('');
  const [directionsDraft, setDirectionsDraft] = React.useState('');
  const [benchmarkOnly, setBenchmarkOnly] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideDraft, setGuideDraft] = React.useState(loadTopicGuide);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const selectedName = groups.find((name) => topicKey(name) === topicKey(selectedGroup)) || '';
  const selectedMeta = metadata[topicKey(selectedName)] || {};
  const groupVideos = selectedName ? getVersions(videos, selectedName) : [];
  const benchmarkIds = selectedMeta.benchmarkIds || [];
  const ungrouped = videos.filter((video) => !topicKey(video.topicGroup));

  React.useEffect(() => {
    setSummaryDraft(summaries[topicKey(selectedName)] || '');
    setCategoryDraft(selectedMeta.category || '');
    setDirectionsDraft((selectedMeta.directions || []).join('、'));
  }, [selectedName]);

  const openGroup = (name, onlyBenchmarks = false) => {
    setMessage('');
    setBenchmarkOnly(onlyBenchmarks);
    setRecents(recordTopicVisit(name));
    onSelectGroup(name);
  };

  const createGroup = (event) => {
    event.preventDefault();
    const name = newGroup.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (groups.some((group) => topicKey(group) === topicKey(name))) { setMessage('这个母题已经存在。'); return; }
    const next = [...groups, name];
    window.localStorage.setItem(TOPIC_GROUPS_KEY, JSON.stringify(next));
    setGroups(next);
    setNewGroup('');
    openGroup(name);
    setMessage('已创建母题，可继续填写主类和核心故事骨架。');
  };

  const saveDetails = (event) => {
    event.preventDefault();
    setSummaries(saveTopicSummary(selectedName, summaryDraft));
    setMetadata(saveTopicMetadata(selectedName, { category: categoryDraft, directions: splitDirections(directionsDraft) }));
    setMessage('母题信息已保存。');
  };

  const toggleFavorite = (name) => {
    const key = topicKey(name);
    setFavorites(saveTopicFavorites(favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key]));
  };

  const toggleBenchmark = (id) => {
    const nextIds = benchmarkIds.includes(id) ? benchmarkIds.filter((item) => item !== id) : [...benchmarkIds, id];
    setMetadata(saveTopicMetadata(selectedName, { benchmarkIds: nextIds }));
    setMessage(benchmarkIds.includes(id) ? '已移出标杆合集。' : '已加入标杆合集。');
  };

  const saveGuide = (event) => {
    event.preventDefault();
    saveTopicGuide(guideDraft);
    setMessage('研究方法已保存在当前浏览器。');
  };

  const exportGuide = () => {
    const content = `# 母题库研究方法\n\n## 分析框架\n\n${guideDraft.framework || ''}\n\n## 落地步骤\n\n${guideDraft.steps || ''}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '母题库研究方法.md';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const visibleGroups = groups.filter((name) => {
    const key = topicKey(name);
    const meta = metadata[key] || {};
    const count = getVersions(videos, name).length;
    const text = `${name} ${summaries[key] || ''} ${(meta.directions || []).join(' ')}`.toLocaleLowerCase('zh-CN');
    return text.includes(search.trim().toLocaleLowerCase('zh-CN'))
      && (!categoryFilter || (categoryFilter === '未分类' ? !meta.category : meta.category === categoryFilter))
      && (!countFilter || (countFilter === '0' ? count === 0 : countFilter === '1' ? count === 1 : countFilter === '2-4' ? count >= 2 && count <= 4 : count >= 5));
  }).sort((a, b) => {
    if (sortBy === 'count') return getVersions(videos, b).length - getVersions(videos, a).length || a.localeCompare(b, 'zh-CN');
    if (sortBy === 'name') return a.localeCompare(b, 'zh-CN');
    return getUpdatedAt(getVersions(videos, b), metadata[topicKey(b)]) - getUpdatedAt(getVersions(videos, a), metadata[topicKey(a)]) || a.localeCompare(b, 'zh-CN');
  });

  const groupForKey = (key) => groups.find((name) => topicKey(name) === key);
  const favoriteGroups = favorites.map(groupForKey).filter(Boolean);
  const recentGroups = recents.map(groupForKey).filter(Boolean);

  return <section className="topic-library" aria-label="母题库首页">
    {guideOpen ? <>
      <button type="button" className="topic-library-back" onClick={() => { setGuideOpen(false); setMessage(''); }}><ArrowLeft size={16} />返回母题库</button>
      <header className="topic-library-heading"><div><span>随时回顾</span><h2>母题库研究方法</h2><p>把完整分析框架与落地步骤放在这里，和日常找题材的首页分开。</p></div></header>
      <form className="topic-library-guide" onSubmit={saveGuide}><label>分析框架<textarea value={guideDraft.framework || ''} onChange={(event) => setGuideDraft((current) => ({ ...current, framework: event.target.value }))} placeholder="在这里粘贴或编写完整的母题分析框架…" rows="12" /></label><label>落地步骤<textarea value={guideDraft.steps || ''} onChange={(event) => setGuideDraft((current) => ({ ...current, steps: event.target.value }))} placeholder="在这里记录具体执行顺序、检查清单与复盘步骤…" rows="12" /></label><div className="topic-library-guide-actions"><span>保存在当前浏览器；建议定期导出备份。</span><button type="button" className="secondary" onClick={exportGuide}><Download size={16} />导出 Markdown</button><button type="submit">保存研究方法</button></div></form>
      {message && <p className="topic-library-message" role="status">{message}</p>}
    </> : !selectedName ? <>
      <header className="topic-library-heading"><div><span>母题库首页</span><h2>从一个故事，看它的所有改编</h2><p>按题材大类找到母题，再查看它的改编方向与全部版本。</p></div><button type="button" className="topic-library-guide-link" onClick={() => { setMessage(''); setGuideOpen(true); }}><BookOpen size={17} />研究方法</button></header>
      <div className="topic-library-toolbar"><label className="topic-library-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索母题或故事骨架…" aria-label="搜索母题" /></label><form onSubmit={createGroup}><input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="新母题名称" aria-label="新母题名称" maxLength="40" /><button type="submit"><Plus size={16} />创建母题</button></form></div>
      <div className="topic-library-filters"><label>题材大类<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">全部大类</option>{TOPIC_CATEGORIES.map((category) => <option key={category}>{category}</option>)}<option>未分类</option></select></label><label>版本数量<select value={countFilter} onChange={(event) => setCountFilter(event.target.value)}><option value="">全部数量</option><option value="0">0 个</option><option value="1">1 个</option><option value="2-4">2–4 个</option><option value="5+">5 个以上</option></select></label><label>排序<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="updated">最近更新</option><option value="count">版本最多</option><option value="name">名称排序</option></select></label><span>{visibleGroups.length} / {groups.length} 个母题</span></div>
      {message && <p className="topic-library-message" role="status">{message}</p>}
      <div className="topic-library-home-layout"><div className="topic-library-main"><div className="topic-library-grid">{visibleGroups.map((name) => {
        const key = topicKey(name);
        const meta = metadata[key] || {};
        const versions = getVersions(videos, name);
        const markers = [...new Set([...(meta.benchmarkIds || []), ...versions.filter((video) => video.researchProfile?.grade === 'S').map((video) => video.id)])].filter((id) => versions.some((video) => video.id === id));
        return <article className="topic-library-card" key={name}><header><span className="topic-library-card-icon"><Layers3 size={21} /></span><div className="topic-library-card-identity"><span className="topic-library-category">{meta.category || '未分类'}</span><h3>{name}</h3></div><button type="button" className={`topic-library-favorite${favorites.includes(key) ? ' active' : ''}`} aria-label={`${favorites.includes(key) ? '取消收藏' : '收藏'}${name}`} aria-pressed={favorites.includes(key)} onClick={() => toggleFavorite(name)}><Star size={17} fill={favorites.includes(key) ? 'currentColor' : 'none'} /></button></header><p>{summaries[key] || '尚未填写核心故事骨架'}</p><div className="topic-library-directions">{(meta.directions || []).length ? meta.directions.slice(0, 3).map((direction) => <span key={direction}>{direction}</span>) : <span>待标注改编方向</span>}</div><footer><b>{versions.length} 个版本</b><div><button type="button" onClick={() => openGroup(name)}>查看全部版本</button><button type="button" disabled={!markers.length} onClick={() => openGroup(name, true)}>{markers.length ? `标杆合集 ${markers.length}` : '暂无标杆'}</button><button type="button" onClick={() => { setRecents(recordTopicVisit(name)); onOpenComparison(name); }}>对比分析</button></div></footer></article>;
      })}</div>{!visibleGroups.length && <p className="topic-library-empty">{groups.length ? '没有找到匹配的母题。' : '还没有母题。创建一个母题，再把对标视频归入其中。'}</p>}{ungrouped.length > 0 && <section className="topic-library-ungrouped"><header><div><h3>待归类视频</h3><p>这些视频尚未指定母题，可在单视频详情里归组。</p></div><b>{ungrouped.length} 条</b></header><div>{ungrouped.slice(0, 5).map((video) => <button type="button" key={video.id} onClick={() => onOpenVideo(video.id)}>{video.title || '未命名视频'}<ArrowRight size={15} /></button>)}</div>{ungrouped.length > 5 && <button type="button" className="topic-library-see-all" onClick={onOpenVideos}>查看全部对标视频</button>}</section>}</div>
        <aside className={`topic-library-sidebar${sidebarOpen ? ' is-open' : ''}`}><button type="button" className="topic-library-sidebar-toggle" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((current) => !current)}>收藏与最近访问 <span>{sidebarOpen ? '收起' : '展开'}</span></button><div className="topic-library-sidebar-content"><section><h3><Star size={16} />常用母题</h3>{favoriteGroups.length ? favoriteGroups.map((name) => <button key={name} type="button" onClick={() => openGroup(name)}>{name}<ArrowRight size={14} /></button>) : <p>点击母题卡片上的星标，收藏常用题材。</p>}</section><section><h3>最近访问</h3>{recentGroups.length ? recentGroups.slice(0, 5).map((name) => <button key={name} type="button" onClick={() => openGroup(name)}>{name}<ArrowRight size={14} /></button>) : <p>打开母题后，这里会记录最近访问。</p>}</section></div></aside></div>
    </> : <>
      <TopicDetailPanel key={selectedName} name={selectedName} videos={groupVideos} meta={selectedMeta} summaryDraft={summaryDraft} onSummaryChange={setSummaryDraft} categoryDraft={categoryDraft} onCategoryChange={setCategoryDraft} directionsDraft={directionsDraft} onDirectionsChange={setDirectionsDraft} onSaveInfo={saveDetails} notice={message} initialBenchmarkOnly={benchmarkOnly} onToggleBenchmark={toggleBenchmark} onBack={() => { setMessage(''); setBenchmarkOnly(false); onSelectGroup(''); }} onOpenVideo={onOpenVideo} onAddVideo={onAddVideo} onOpenComparison={onOpenComparison} />
    </>}
  </section>;
}
