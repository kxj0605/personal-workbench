import React from 'react';
import { Film, FolderPlus, Layers3, LibraryBig, Plus, Trash2 } from 'lucide-react';
import './ViralResearchPanel.css';
import { getBenchmarkVideoSummary, loadBenchmarkVideos, makeBenchmarkId } from '../utils/benchmarkLibrary';

const STORAGE_KEY = 'viral-research-library-v1';
const TYPES = [
  { id: 'element', label: '爆款元素', hint: '可组合的冲突、情绪、身份、镜头或台词零件' },
  { id: 'script', label: '爆款脚本', hint: '可复用的叙事结构、节奏和转折方式' },
  { id: 'opening', label: '爆款开头', hint: '前几秒的钩子、首句与首镜头设计' },
];
const emptyData = () => ({ categories: { element: ['待分类'], script: ['待分类'], opening: ['待分类'] }, variants: [] });
const loadData = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return { ...emptyData(), ...saved, categories: { ...emptyData().categories, ...(saved?.categories || {}) }, variants: Array.isArray(saved?.variants) ? saved.variants : [] };
  } catch { return emptyData(); }
};

export function ViralResearchPanel({ initialVideoId = '', onInitialVideoHandled }) {
  const [data, setData] = React.useState(loadData);
  const [activeType, setActiveType] = React.useState('element');
  const [activeCategory, setActiveCategory] = React.useState('待分类');
  const [categoryDraft, setCategoryDraft] = React.useState('');
  const [variantDraft, setVariantDraft] = React.useState({ name: '', note: '', videoIds: [] });
  const [notice, setNotice] = React.useState('');
  const videos = loadBenchmarkVideos();
  const type = TYPES.find((item) => item.id === activeType);
  const categories = data.categories[activeType] || ['待分类'];
  const variants = data.variants.filter((variant) => variant.type === activeType && variant.category === activeCategory);

  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  React.useEffect(() => {
    if (!initialVideoId) return;
    setVariantDraft((current) => ({ ...current, videoIds: current.videoIds.includes(initialVideoId) ? current.videoIds : [...current.videoIds, initialVideoId] }));
    setNotice('已带入项目来源视频，保存研究结论时会自动关联。');
    onInitialVideoHandled?.();
  }, [initialVideoId, onInitialVideoHandled]);
  React.useEffect(() => { setActiveCategory((current) => (data.categories[activeType] || []).includes(current) ? current : '待分类'); }, [activeType, data.categories]);
  React.useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const addCategory = (event) => {
    event.preventDefault();
    const label = categoryDraft.trim();
    if (!label) return;
    if (categories.includes(label)) { setNotice('这个分类已经存在。'); return; }
    setData((current) => ({ ...current, categories: { ...current.categories, [activeType]: [...(current.categories[activeType] || ['待分类']), label] } }));
    setActiveCategory(label);
    setCategoryDraft('');
  };
  const addVariant = (event) => {
    event.preventDefault();
    const name = variantDraft.name.trim();
    if (!name) { setNotice('请为这个变体命名。'); return; }
    setData((current) => ({ ...current, variants: [{ id: makeBenchmarkId(), type: activeType, category: activeCategory, name, note: variantDraft.note.trim(), videoIds: variantDraft.videoIds, createdAt: new Date().toISOString() }, ...current.variants] }));
    setVariantDraft({ name: '', note: '', videoIds: [] });
    setNotice('已沉淀新的研究变体。');
  };
  const deleteVariant = (id) => setData((current) => ({ ...current, variants: current.variants.filter((variant) => variant.id !== id) }));
  const toggleVideo = (id) => setVariantDraft((current) => ({ ...current, videoIds: current.videoIds.includes(id) ? current.videoIds.filter((videoId) => videoId !== id) : [...current.videoIds, id] }));

  return <section className="viral-research" aria-label="爆款研究库">
    <header className="viral-research-hero"><div><span>爆款研究</span><h1>把观察结论变成可复用的方法</h1><p>围绕对标视频沉淀爆点、脚本与开头，再带入项目继续拆解。</p></div><LibraryBig size={26} /></header>
    <div className="viral-type-tabs" role="tablist" aria-label="选择研究库类型">{TYPES.map((item) => <button type="button" role="tab" aria-selected={activeType === item.id} className={activeType === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveType(item.id)}>{item.label}</button>)}</div>
    {notice && <p className="viral-research-notice" role="status">{notice}</p>}
    <section className="viral-research-layout">
      <aside className="viral-category-panel"><div><span className="viral-panel-icon"><Layers3 size={17} /></span><h2>{type.label}分类</h2><p>{type.hint}</p></div><div className="viral-category-list" role="tablist" aria-label={`${type.label}分类`}>{categories.map((category) => <button type="button" role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? 'active' : ''} key={category} onClick={() => setActiveCategory(category)}>{category}<b>{data.variants.filter((variant) => variant.type === activeType && variant.category === category).length}</b></button>)}</div><form className="viral-add-category" onSubmit={addCategory}><input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="新建自定义分类" maxLength="30" /><button type="submit" aria-label="新增分类"><FolderPlus size={16} /></button></form></aside>
      <div className="viral-variants-panel"><header><div><span>{type.label} · {activeCategory}</span><h2>变体与对应视频</h2><p>同一条对标视频可以被关联到多个分类或变体。</p></div></header>
        <form className="viral-variant-form" onSubmit={addVariant}><label>变体名称<input value={variantDraft.name} onChange={(event) => setVariantDraft({ ...variantDraft, name: event.target.value })} placeholder="例如：先被轻视，再一句话反转" maxLength="80" /></label><label>我的结论（可选）<textarea value={variantDraft.note} onChange={(event) => setVariantDraft({ ...variantDraft, note: event.target.value })} placeholder="这个变体为什么有效、如何借鉴？" rows="2" maxLength="400" /></label><fieldset><legend>关联对标视频（可多选）</legend>{videos.length ? <div className="viral-video-picker">{videos.map((video) => { const summary = getBenchmarkVideoSummary(video); return <label key={video.id}><input type="checkbox" checked={variantDraft.videoIds.includes(video.id)} onChange={() => toggleVideo(video.id)} /><span>{summary.title}</span></label>; })}</div> : <p>对标库还没有视频；仍可先保存变体。</p>}</fieldset><button type="submit"><Plus size={16} />保存变体</button></form>
        <div className="viral-variant-list">{variants.length ? variants.map((variant) => <VariantCard variant={variant} videos={videos} key={variant.id} onDelete={() => deleteVariant(variant.id)} />) : <p className="viral-empty">「{activeCategory}」还没有变体。先记录一个你观察到的具体做法。</p>}</div>
      </div>
    </section>
  </section>;
}

function VariantCard({ variant, videos, onDelete }) {
  const relatedVideos = variant.videoIds.map((id) => videos.find((video) => video.id === id)).filter(Boolean);
  return <article className="viral-variant-card"><header><div><h3>{variant.name}</h3>{variant.note && <p>{variant.note}</p>}</div><button type="button" onClick={onDelete} title="删除变体" aria-label={`删除${variant.name}`}><Trash2 size={16} /></button></header><section><div className="viral-related-heading"><Film size={15} /><strong>对应视频 {variant.videoIds.length}</strong></div>{relatedVideos.length ? <div className="viral-related-videos">{relatedVideos.map((video) => { const summary = getBenchmarkVideoSummary(video); return <a href={video.url || undefined} target={video.url ? '_blank' : undefined} rel="noreferrer" key={video.id}><b>{summary.title}</b><span>{summary.creator} · {summary.views} · {summary.publishedAt}</span></a>; })}</div> : <p className="viral-source-missing">暂无可显示的视频；原视频可能尚未录入或已移除。</p>}</section></article>;
}
