import React from 'react';
import { ArrowLeft, ArrowRight, Download, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { loadBenchmarkVideos } from '../utils/benchmarkLibrary';
import {
  deleteTopicCategory, loadTopicCategories, loadTopicFavorites, loadTopicGuide, loadTopicMetadata, loadTopicRecents, loadTopicSummaries,
  recordTopicVisit, renameTopicCategory, saveTopicCategories, saveTopicFavorites, saveTopicGuide, saveTopicMetadata, saveTopicSummary,
  TOPIC_GROUPS_KEY, topicKey,
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
const cleanCategoryName = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const versionDate = (video) => Date.parse(video.updatedAt || video.createdAt || '') || 0;
const getVersions = (videos, name) => videos.filter((video) => topicKey(video.topicGroup) === topicKey(name)).sort((a, b) => versionDate(b) - versionDate(a));
const getUpdatedAt = (versions, meta) => Math.max(Date.parse(meta?.updatedAt || '') || 0, ...versions.map(versionDate), 0);

export function TopicLibraryHome({ selectedGroup, onSelectGroup, guideOpen, onGuideChange, onOpenVideo, onAddVideo, onOpenComparison, onOpenVideos }) {
  const [videos] = React.useState(loadBenchmarkVideos);
  const [groups, setGroups] = React.useState(() => loadGroups(videos));
  const [summaries, setSummaries] = React.useState(loadTopicSummaries);
  const [metadata, setMetadata] = React.useState(loadTopicMetadata);
  const [categories, setCategories] = React.useState(loadTopicCategories);
  const [favorites, setFavorites] = React.useState(loadTopicFavorites);
  const [recents, setRecents] = React.useState(loadTopicRecents);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [editingCategory, setEditingCategory] = React.useState('');
  const [categoryNameDraft, setCategoryNameDraft] = React.useState('');
  const [deletingCategory, setDeletingCategory] = React.useState('');
  const [deleteDestination, setDeleteDestination] = React.useState('');
  const [topicFilter, setTopicFilter] = React.useState('');
  const [topicManagerOpen, setTopicManagerOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('updated');
  const [newGroup, setNewGroup] = React.useState('');
  const [summaryDraft, setSummaryDraft] = React.useState('');
  const [frameworkDraft, setFrameworkDraft] = React.useState({ roleFunction: '', plotLogic: '', emotionClosure: '', coreTheme: '' });
  const [categoryDraft, setCategoryDraft] = React.useState('');
  const [directionsDraft, setDirectionsDraft] = React.useState('');
  const [benchmarkOnly, setBenchmarkOnly] = React.useState(false);
  const [editRequested, setEditRequested] = React.useState(false);
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
    setFrameworkDraft({
      roleFunction: selectedMeta.roleFunction || '',
      plotLogic: selectedMeta.plotLogic || '',
      emotionClosure: selectedMeta.emotionClosure || '',
      coreTheme: selectedMeta.coreTheme || '',
    });
    setCategoryDraft(selectedMeta.category || '');
    setDirectionsDraft((selectedMeta.directions || []).join('、'));
  }, [selectedName]);

  const openGroup = (name, onlyBenchmarks = false, startEditing = false) => {
    setMessage('');
    setBenchmarkOnly(onlyBenchmarks);
    setEditRequested(startEditing);
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
    if (categoryFilter && categoryFilter !== '未分类') {
      setMetadata(saveTopicMetadata(name, { category: categoryFilter }));
    }
    setTopicFilter('');
    setNewGroup('');
    openGroup(name);
    setMessage('已创建母题，可继续填写题材大类和核心故事骨架。');
  };

  const validateCategoryName = (value, previous = '') => {
    const name = cleanCategoryName(value);
    if (!name || name === '未分类' || name === '全部大类') { setMessage('请填写有效的大类名称；“未分类”和“全部大类”不能作为名称。'); return ''; }
    if (categories.some((category) => category !== previous && topicKey(category) === topicKey(name))) { setMessage('这个题材大类已经存在。'); return ''; }
    return name;
  };

  const createCategory = (event) => {
    event.preventDefault();
    const name = validateCategoryName(newCategory);
    if (!name) return;
    setCategories(saveTopicCategories([...categories, name]));
    setNewCategory('');
    setMessage(`已新增题材大类「${name}」。`);
  };

  const saveCategoryRename = (event, previous) => {
    event.preventDefault();
    const name = validateCategoryName(categoryNameDraft, previous);
    if (!name) return;
    if (name !== previous) {
      const result = renameTopicCategory(previous, name);
      setCategories(result.categories);
      setMetadata(result.metadata);
      if (categoryFilter === previous) setCategoryFilter(name);
      if (categoryDraft === previous) setCategoryDraft(name);
      setMessage(`已将「${previous}」改名为「${name}」，所属母题已同步更新。`);
    }
    setEditingCategory('');
  };

  const confirmCategoryDelete = (source) => {
    const destination = deleteDestination === '__uncategorized__' ? '' : deleteDestination;
    const result = deleteTopicCategory(source, destination);
    setCategories(result.categories);
    setMetadata(result.metadata);
    if (categoryFilter === source) setCategoryFilter(destination);
    if (categoryDraft === source) setCategoryDraft(destination);
    setDeletingCategory('');
    setDeleteDestination('');
    setMessage(destination ? `已删除「${source}」，所属母题已转入「${destination}」。` : `已删除「${source}」，所属母题已设为未分类。`);
  };

  const saveDetails = (event) => {
    event.preventDefault();
    setSummaries(saveTopicSummary(selectedName, summaryDraft));
    setMetadata(saveTopicMetadata(selectedName, { category: categoryDraft, directions: splitDirections(directionsDraft), ...frameworkDraft }));
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

  const categoryGroups = groups.filter((name) => !categoryFilter || (categoryFilter === '未分类' ? !metadata[topicKey(name)]?.category : metadata[topicKey(name)]?.category === categoryFilter));
  React.useEffect(() => {
    if (topicFilter && !categoryGroups.includes(topicFilter)) setTopicFilter('');
  }, [categoryFilter, groups, metadata, topicFilter]);

  const visibleGroups = groups.filter((name) => {
    const key = topicKey(name);
    const meta = metadata[key] || {};
    const text = `${name} ${summaries[key] || ''} ${(meta.directions || []).join(' ')}`.toLocaleLowerCase('zh-CN');
    return text.includes(search.trim().toLocaleLowerCase('zh-CN'))
      && (!categoryFilter || (categoryFilter === '未分类' ? !meta.category : meta.category === categoryFilter))
      && (!topicFilter || name === topicFilter);
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
      <button type="button" className="topic-library-back" onClick={() => { onGuideChange(false); setMessage(''); }}><ArrowLeft size={16} />返回母题库</button>
      <form className="topic-library-guide" onSubmit={saveGuide}><label>分析框架<textarea value={guideDraft.framework || ''} onChange={(event) => setGuideDraft((current) => ({ ...current, framework: event.target.value }))} placeholder="在这里粘贴或编写完整的母题分析框架…" rows="12" /></label><label>落地步骤<textarea value={guideDraft.steps || ''} onChange={(event) => setGuideDraft((current) => ({ ...current, steps: event.target.value }))} placeholder="在这里记录具体执行顺序、检查清单与复盘步骤…" rows="12" /></label><div className="topic-library-guide-actions"><span>保存在当前浏览器；建议定期导出备份。</span><button type="button" className="secondary" onClick={exportGuide}><Download size={16} />导出 Markdown</button><button type="submit">保存研究方法</button></div></form>
      {message && <p className="topic-library-message" role="status">{message}</p>}
    </> : !selectedName ? <>
      <div className="topic-library-toolbar"><label className="topic-library-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索母题或故事骨架…" aria-label="搜索母题" /></label></div>
      <div className="topic-library-filters">
        <div className="topic-library-filter-pair"><label>题材大类（一级）<select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setTopicFilter(''); }}><option value="">全部大类</option>{categories.map((category) => <option key={category}>{category}</option>)}<option>未分类</option></select></label><button type="button" className="topic-category-manage-trigger" aria-expanded={categoryManagerOpen} aria-controls="topic-category-manager" onClick={() => { setCategoryManagerOpen((open) => !open); setTopicManagerOpen(false); setMessage(''); }}>管理大类</button></div>
        <div className="topic-library-filter-pair"><label>母题（二级）<select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}><option value="">全部母题</option>{categoryGroups.map((name) => <option value={name} key={name}>{name}</option>)}</select></label><button type="button" className="topic-category-manage-trigger" aria-expanded={topicManagerOpen} aria-controls="topic-manager" onClick={() => { setTopicManagerOpen((open) => !open); setCategoryManagerOpen(false); setMessage(''); }}>设置母题</button></div>
        <label>排序<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="updated">最近更新</option><option value="count">版本最多</option><option value="name">名称排序</option></select></label><span>{visibleGroups.length} / {groups.length} 个母题</span>
      </div>
      {topicManagerOpen && <section className="topic-category-manager" id="topic-manager" aria-label="设置母题">
        <header><div><h3>设置母题（二级）</h3><p>{categoryFilter ? `当前大类：${categoryFilter}` : '管理已有母题，或新增母题后设置所属大类。'}</p></div><button type="button" onClick={() => setTopicManagerOpen(false)}>收起</button></header>
        <form className="topic-category-create" onSubmit={createGroup}><input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} aria-label="新增二级母题名称" placeholder="新母题名称" maxLength="40" /><button type="submit"><Plus size={15} />新增母题</button></form>
        <div className="topic-category-list">{categoryGroups.map((name) => <div className="topic-category-row" key={name}><div className="topic-category-row-main"><strong>{name}</strong><span>{metadata[topicKey(name)]?.category || '未分类'}</span><button type="button" aria-label={`设置${name}资料`} onClick={() => openGroup(name, false, true)}>修改资料</button></div></div>)}{!categoryGroups.length && <p className="topic-category-empty">当前大类暂无母题，可以在上方新增。</p>}</div>
      </section>}
      {categoryManagerOpen && <section className="topic-category-manager" id="topic-category-manager" aria-label="管理题材大类">
        <header><div><h3>管理题材大类（一级）</h3><p>改名会同步更新所属母题；删除大类不会删除母题或视频。</p></div><button type="button" onClick={() => setCategoryManagerOpen(false)}>收起</button></header>
        <form className="topic-category-create" onSubmit={createCategory}><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} aria-label="新题材大类名称" placeholder="新题材大类名称" maxLength="24" /><button type="submit"><Plus size={15} />新增大类</button></form>
        <div className="topic-category-list">{categories.map((category) => {
          const usage = groups.filter((name) => metadata[topicKey(name)]?.category === category).length;
          return <div className="topic-category-row" key={category}>
            <div className="topic-category-row-main"><strong>{category}</strong><span>{usage} 个母题</span><button type="button" aria-label={`改名${category}`} onClick={() => { setEditingCategory(category); setCategoryNameDraft(category); setDeletingCategory(''); }}>改名</button><button type="button" className="topic-category-delete" aria-label={`删除${category}`} onClick={() => { setDeletingCategory(category); setDeleteDestination(''); setEditingCategory(''); }}><Trash2 size={14} />删除</button></div>
            {editingCategory === category && <form className="topic-category-inline-form" onSubmit={(event) => saveCategoryRename(event, category)}><input value={categoryNameDraft} onChange={(event) => setCategoryNameDraft(event.target.value)} aria-label={`重命名${category}`} maxLength="24" /><button type="submit">保存名称</button><button type="button" onClick={() => setEditingCategory('')}>取消</button></form>}
            {deletingCategory === category && <div className="topic-category-delete-confirm"><p>{usage ? `「${category}」下有 ${usage} 个母题。删除前请选择它们的新归属：` : `「${category}」下暂无母题。删除后仍可重新创建同名大类。`}</p>{usage > 0 && <select value={deleteDestination} onChange={(event) => setDeleteDestination(event.target.value)} aria-label={`删除${category}后转移到`}><option value="" disabled>选择转移目标</option><option value="__uncategorized__">未分类</option>{categories.filter((name) => name !== category).map((name) => <option key={name}>{name}</option>)}</select>}<button type="button" className="topic-category-delete" disabled={usage > 0 && !deleteDestination} onClick={() => confirmCategoryDelete(category)}>确认删除大类</button><button type="button" onClick={() => setDeletingCategory('')}>取消</button></div>}
          </div>;
        })}{!categories.length && <p className="topic-category-empty">暂无题材大类，可以在上方新增。</p>}</div>
      </section>}
      {message && <p className="topic-library-message" role="status">{message}</p>}
      <div className="topic-library-home-layout"><div className="topic-library-main"><div className="topic-library-grid">{visibleGroups.map((name) => {
        const key = topicKey(name);
        const meta = metadata[key] || {};
        const versions = getVersions(videos, name);
        const markers = [...new Set([...(meta.benchmarkIds || []), ...versions.filter((video) => video.researchProfile?.grade === 'S').map((video) => video.id)])].filter((id) => versions.some((video) => video.id === id));
        return <article className="topic-library-card" key={name}><header><div className="topic-library-card-identity"><span className="topic-library-category">{meta.category || '未分类'}</span><h3>{name}</h3></div><div className="topic-library-card-actions"><button type="button" className="topic-library-edit" aria-label={`编辑${name}资料`} title={`编辑${name}资料`} onClick={() => openGroup(name, false, true)}><Pencil size={16} /></button><button type="button" className={`topic-library-favorite${favorites.includes(key) ? ' active' : ''}`} aria-label={`${favorites.includes(key) ? '取消收藏' : '收藏'}${name}`} aria-pressed={favorites.includes(key)} onClick={() => toggleFavorite(name)}><Star size={17} fill={favorites.includes(key) ? 'currentColor' : 'none'} /></button></div></header><p>{summaries[key] || '尚未填写核心故事骨架'}</p><div className="topic-library-directions">{(meta.directions || []).length ? meta.directions.slice(0, 3).map((direction) => <span key={direction}>{direction}</span>) : <span>待标注改编方向</span>}</div><footer><b>{versions.length} 个版本</b><div><button type="button" onClick={() => openGroup(name)}>查看全部版本</button><button type="button" disabled={!markers.length} onClick={() => openGroup(name, true)}>{markers.length ? `标杆合集 ${markers.length}` : '暂无标杆'}</button><button type="button" onClick={() => { setRecents(recordTopicVisit(name)); onOpenComparison(name); }}>对比分析</button></div></footer></article>;
      })}</div>{!visibleGroups.length && <p className="topic-library-empty">{groups.length ? '没有找到匹配的母题。' : '还没有母题。创建一个母题，再把对标视频归入其中。'}</p>}{ungrouped.length > 0 && <section className="topic-library-ungrouped"><header><div><h3>待归类视频</h3><p>这些视频尚未指定母题，可在单视频详情里归组。</p></div><b>{ungrouped.length} 条</b></header><div>{ungrouped.slice(0, 5).map((video) => <button type="button" key={video.id} onClick={() => onOpenVideo(video.id)}>{video.title || '未命名视频'}<ArrowRight size={15} /></button>)}</div>{ungrouped.length > 5 && <button type="button" className="topic-library-see-all" onClick={onOpenVideos}>查看全部对标视频</button>}</section>}</div>
        <aside className={`topic-library-sidebar${sidebarOpen ? ' is-open' : ''}`}><button type="button" className="topic-library-sidebar-toggle" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((current) => !current)}>收藏与最近访问 <span>{sidebarOpen ? '收起' : '展开'}</span></button><div className="topic-library-sidebar-content"><section><h3><Star size={16} />常用母题</h3>{favoriteGroups.length ? favoriteGroups.map((name) => <button key={name} type="button" onClick={() => openGroup(name)}>{name}<ArrowRight size={14} /></button>) : <p>点击母题卡片上的星标，收藏常用题材。</p>}</section><section><h3>最近访问</h3>{recentGroups.length ? recentGroups.slice(0, 5).map((name) => <button key={name} type="button" onClick={() => openGroup(name)}>{name}<ArrowRight size={14} /></button>) : <p>打开母题后，这里会记录最近访问。</p>}</section></div></aside></div>
    </> : <>
      <TopicDetailPanel key={selectedName} name={selectedName} videos={groupVideos} meta={selectedMeta} categories={categories} summaryDraft={summaryDraft} onSummaryChange={setSummaryDraft} frameworkDraft={frameworkDraft} onFrameworkChange={(key, value) => setFrameworkDraft((current) => ({ ...current, [key]: value }))} categoryDraft={categoryDraft} onCategoryChange={setCategoryDraft} directionsDraft={directionsDraft} onDirectionsChange={setDirectionsDraft} onSaveInfo={saveDetails} notice={message} focusInfo={editRequested} initialBenchmarkOnly={benchmarkOnly} onToggleBenchmark={toggleBenchmark} onBack={() => { setMessage(''); setBenchmarkOnly(false); setEditRequested(false); onSelectGroup(''); }} onOpenVideo={onOpenVideo} onAddVideo={onAddVideo} onOpenComparison={onOpenComparison} />
    </>}
  </section>;
}
