import React from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, Columns3, Download, LayoutGrid, List, Plus, Sparkles } from 'lucide-react';
import { CONTENT_DIMENSIONS, getVideoCoreTags, getVideoIndicators, matchesTopicVideoFilters, TOPIC_VIDEO_FILTERS, autoPairByDimension } from '../utils/topicAnalysis';
import './TopicDetailPanel.css';

const FILTER_SECTIONS = [
  { title: '内容特征', keys: ['hookType', 'characterSetup', 'reversalTiming', 'conflictIntensity', 'visualStyle'] },
  { title: '数据表现', keys: ['grade', 'commentRange', 'shareRange'] },
  { title: '基础属性', keys: ['followerScale', 'publishWindow', 'durationRange', 'isSeries'] },
];
const FILTER_BY_KEY = Object.fromEntries(TOPIC_VIDEO_FILTERS.map((field) => [field.key, field]));
const TOPIC_INFO_HELP_KEY = 'benchmark-topic-info-help-v1';
const DEFAULT_TOPIC_INFO_HELP = '这张卡片用来记录同一母题所有改编版本共享的故事骨架，避免把版本差异误当成母题本身。先写不变的核心基本盘，再补充角色功能、核心命题、核心情节逻辑和情绪闭环；题材大类与改编方向用于母题库首页导航。填写后点击“保存母题信息”。';
const FRAMEWORK_FIELDS = [
  ['roleFunction', '角色功能', '故事里各类角色分别起什么作用？', 1],
  ['coreTheme', '核心命题', '这个故事最终回答或表达什么？', 1],
  ['plotLogic', '核心情节逻辑', '起因、冲突、行动、反转与结果如何相连？', 6],
  ['emotionClosure', '情绪闭环', '观众的情绪从哪里出发，最终得到什么回应？', 1],
];
const percent = (rate) => rate === null ? '—' : `${(rate * 100).toFixed(2)}%`;
const scoreText = (video) => video.researchProfile?.score === '' || video.researchProfile?.score === undefined ? '—' : `${video.researchProfile.score}`;
const gradeText = (video) => video.researchProfile?.grade || '未评';

function exportReport(name, summary, videos, framework) {
  const lines = [
    `# ${name}｜母题分析报告`, '',
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    `核心基本盘：${summary || '待补充'}`,
    ...FRAMEWORK_FIELDS.map(([key, label]) => `${label}：${framework[key] || '待补充'}`),
    `总版本数：${videos.length}`, '',
    '## 版本数据', '',
    '| 视频 | 等级 | 综合分 | 播放量 | 评论率 | 转发率 | 核心改编标签 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...videos.map((video) => {
      const data = getVideoIndicators(video);
      const cells = [video.title || '未命名视频', gradeText(video), scoreText(video), data.viewsText, percent(data.commentRate), percent(data.shareRate), getVideoCoreTags(video).join('、') || '未标注'];
      return `| ${cells.map((cell) => String(cell).replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ')} |`;
    }), '', '## 单版本研究笔记', '',
    ...videos.flatMap((video) => [
      `### ${video.title || '未命名视频'}`, '',
      `链接：${video.url || '未录入'}`, '',
      `亮点：${video.analysisNotes?.highlights || '待补充'}`, '',
      `问题：${video.analysisNotes?.problems || '待补充'}`, '',
      `可复用点：${video.analysisNotes?.reusable || '待补充'}`, '',
    ]),
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[\\/:*?"<>|]/g, '_')}-分析报告.md`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function VideoCover() {
  return <span className="topic-detail-cover" aria-label="无封面">无封面</span>;
}

function TagList({ video }) {
  const tags = getVideoCoreTags(video);
  return <div className="topic-detail-tags">{tags.length ? tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>) : <span>未标注</span>}</div>;
}

export function TopicDetailPanel({ name, videos, meta, categories, summaryDraft, onSummaryChange, frameworkDraft, onFrameworkChange, categoryDraft, onCategoryChange, directionsDraft, onDirectionsChange, onSaveInfo, notice, onBack, onOpenVideo, onAddVideo, onOpenComparison, focusInfo = false, initialBenchmarkOnly = false, onToggleBenchmark }) {
  const summaryInputRef = React.useRef(null);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isHelpEditing, setIsHelpEditing] = React.useState(false);
  const [helpText, setHelpText] = React.useState(() => {
    try { return window.localStorage.getItem(TOPIC_INFO_HELP_KEY) || DEFAULT_TOPIC_INFO_HELP; }
    catch { return DEFAULT_TOPIC_INFO_HELP; }
  });
  const [helpDraft, setHelpDraft] = React.useState(helpText);
  const saveHelp = () => {
    const next = helpDraft.trim() || DEFAULT_TOPIC_INFO_HELP;
    window.localStorage.setItem(TOPIC_INFO_HELP_KEY, next);
    setHelpText(next);
    setHelpDraft(next);
    setIsHelpEditing(false);
  };
  React.useEffect(() => {
    if (!focusInfo) return;
    const frame = window.requestAnimationFrame(() => {
      summaryInputRef.current?.scrollIntoView({ block: 'center' });
      summaryInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusInfo]);
  const [filters, setFilters] = React.useState({});
  const [viewMode, setViewMode] = React.useState('list');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [benchmarkOnly, setBenchmarkOnly] = React.useState(initialBenchmarkOnly);
  const [pairDimension, setPairDimension] = React.useState('characterSetup');
  const [pairs, setPairs] = React.useState([]);
  const [feedback, setFeedback] = React.useState('');
  const manualBenchmarkIds = meta.benchmarkIds || [];
  const benchmarkIds = [...new Set([...manualBenchmarkIds, ...videos.filter((video) => video.researchProfile?.grade === 'S').map((video) => video.id)])];
  const filteredVideos = videos.filter((video) => (!benchmarkOnly || benchmarkIds.includes(video.id)) && matchesTopicVideoFilters(video, filters));
  const sVideos = videos.filter((video) => video.researchProfile?.grade === 'S');
  const cVideos = videos.filter((video) => video.researchProfile?.grade === 'C');

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelectedIds([]);
    setPairs([]);
  };

  const toggleVideo = (id) => {
    setPairs([]);
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 6) { setFeedback('一次最多选择 6 条视频。'); return current; }
      setFeedback('');
      return [...current, id];
    });
  };

  const compareSelected = () => {
    if (selectedIds.length < 2) { setFeedback('请至少选择 2 条视频再对比。'); document.getElementById('topic-detail-list-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    onOpenComparison(name, selectedIds);
  };

  const pairAutomatically = () => {
    const result = autoPairByDimension(filteredVideos, pairDimension);
    if (!result.length) { setFeedback('当前筛选结果中，这个维度至少需要两种不同且已标注的取值。'); setPairs([]); return; }
    setPairs(result);
    setSelectedIds(result.flat().map((video) => video.id));
    setFeedback(`已按${CONTENT_DIMENSIONS.find((item) => item.key === pairDimension)?.label}配出 ${result.length} 组，可直接横向对比。`);
  };

  const selectedCount = selectedIds.length;
  return <div className="topic-detail-page">
    <button type="button" className="topic-library-back" onClick={onBack}><ArrowLeft size={16} />返回母题库</button>
    <header className="topic-detail-overview"><div><span>{meta.category || '未分类'} · 母题详情</span><h2>{name}</h2><p><b>核心基本盘：</b>{summaryDraft || '尚未填写；请在下方补充一句话核心设定。'}</p><strong>{videos.length} 个版本</strong></div><div className="topic-detail-overview-actions"><button type="button" onClick={() => onAddVideo(name)}><Plus size={16} />新增版本</button><button type="button" onClick={compareSelected}><Columns3 size={16} />批量对比</button><button type="button" onClick={() => exportReport(name, summaryDraft, videos, frameworkDraft)}><Download size={16} />导出分析报告</button></div></header>
    <form className="topic-library-summary" onSubmit={onSaveInfo}>
      <header className="topic-library-summary-heading"><span>母题基本信息</span><button type="button" className="topic-library-help-trigger" aria-label="查看母题基本信息说明" aria-expanded={isHelpOpen} aria-controls="topic-library-info-help" onClick={() => setIsHelpOpen((open) => !open)}><CircleHelp size={17} /></button></header>
      {isHelpOpen && <section className="topic-library-info-help" id="topic-library-info-help" aria-label="母题基本信息使用说明">
        {isHelpEditing ? <><textarea aria-label="编辑母题基本信息说明" value={helpDraft} onChange={(event) => setHelpDraft(event.target.value)} rows="5" /><div className="topic-library-help-actions"><button type="button" onClick={() => { setHelpDraft(helpText); setIsHelpEditing(false); }}>取消</button><button type="button" onClick={saveHelp}>保存说明</button></div></> : <><p>{helpText}</p><div className="topic-library-help-actions"><span>说明保存在当前浏览器，适用于所有母题。</span><button type="button" onClick={() => setIsHelpEditing(true)}>编辑说明</button></div></>}
      </section>}
      <p>核心基本盘只记录所有版本都不能改变的故事设定。</p>
      <div className="topic-library-core-row"><label>题材大类（一级）<select value={categoryDraft} onChange={(event) => onCategoryChange(event.target.value)}><option value="">未分类</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>母题（二级）<textarea ref={summaryInputRef} id="topic-summary" value={summaryDraft} onChange={(event) => onSummaryChange(event.target.value)} placeholder="例如：善恶有报 + 身份反转 + 恩人得回馈" rows="1" maxLength="300" /></label></div>
      <div className="topic-library-framework-grid">{FRAMEWORK_FIELDS.map(([key, label, placeholder, rows]) => <label className={`topic-library-framework-${key}`} key={key}>{label}{key === 'roleFunction' ? <input type="text" value={frameworkDraft[key] || ''} onChange={(event) => onFrameworkChange(key, event.target.value)} placeholder={placeholder} maxLength="300" /> : <textarea value={frameworkDraft[key] || ''} onChange={(event) => onFrameworkChange(key, event.target.value)} placeholder={placeholder} rows={rows} maxLength="1000" />}</label>)}</div>
      <div className="topic-library-detail-fields"><label>改编方向（首页最多显示 3 个）<input value={directionsDraft} onChange={(event) => onDirectionsChange(event.target.value)} placeholder="如：单亲妈妈、总裁报恩、开场砸店" maxLength="300" /></label><button type="submit">保存母题信息</button></div>
    </form>
    {notice && <p className="topic-library-message" role="status">{notice}</p>}
    <section className="topic-detail-filters" aria-labelledby="topic-detail-filter-title"><header><div><h3 id="topic-detail-filter-title">筛选版本</h3><p>组合多个下拉条件；旧视频需在单视频详情补齐结构化标签。</p></div><button type="button" onClick={() => { setFilters({}); setBenchmarkOnly(false); setSelectedIds([]); setPairs([]); }}>清除筛选</button></header><div className="topic-detail-filter-groups">{FILTER_SECTIONS.map(({ title, keys }) => <fieldset key={title}><legend>{title}</legend><div>{keys.map((key) => { const field = FILTER_BY_KEY[key]; return <label key={key}>{field.label}<select value={filters[key] || ''} onChange={(event) => changeFilter(key, event.target.value)}><option value="">全部</option>{field.options.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; })}</div></fieldset>)}</div></section>
    <section className="topic-detail-pinned" aria-label="固定置顶极端样本">{[['S', 'S 级标杆', sVideos], ['C', 'C 级踩坑', cVideos]].map(([grade, label, items]) => <div key={grade} className={`topic-detail-pin topic-detail-pin-${grade.toLowerCase()}`}><header><h3>{label}</h3><span>{items.length} 条</span></header>{items.length ? items.slice(0, 3).map((video) => <button type="button" key={video.id} onClick={() => onOpenVideo(video.id)}>{video.title || '未命名视频'}<ArrowRight size={14} /></button>) : <p>暂无 {grade} 级视频；可在单视频详情手动设置等级。</p>}</div>)}</section>
    <section className="topic-detail-list" aria-labelledby="topic-detail-list-title"><header><div><h3 id="topic-detail-list-title">视频版本</h3><p>{filteredVideos.length} / {videos.length} 条符合条件 · 已选 {selectedCount} / 6</p></div><div className="topic-detail-list-tools"><button type="button" className={viewMode === 'list' ? 'active' : ''} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><List size={16} />列表</button><button type="button" className={viewMode === 'cards' ? 'active' : ''} aria-pressed={viewMode === 'cards'} onClick={() => setViewMode('cards')}><LayoutGrid size={16} />卡片</button></div></header><div className="topic-detail-selection-bar"><label>自动配对维度<select value={pairDimension} onChange={(event) => setPairDimension(event.target.value)}>{CONTENT_DIMENSIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></label><button type="button" onClick={pairAutomatically}><Sparkles size={16} />同维度自动配对</button><button type="button" disabled={selectedCount !== 1} onClick={() => onToggleBenchmark(selectedIds[0])}>{selectedCount === 1 && manualBenchmarkIds.includes(selectedIds[0]) ? '取消手动标杆' : '设为手动标杆'}</button><button type="button" className="primary" onClick={compareSelected} disabled={selectedCount < 2}>横向对比 {selectedCount ? `(${selectedCount})` : ''}</button></div>{feedback && <p className="topic-detail-feedback" role="status">{feedback}</p>}{pairs.length > 0 && <div className="topic-detail-pairs" aria-label="自动配对结果">{pairs.map(([first, second], index) => <span key={`${first.id}-${second.id}`}>第 {index + 1} 组：{first.title} ↔ {second.title}</span>)}</div>}{filteredVideos.length ? viewMode === 'list' ? <div className="topic-detail-table-scroll"><table><thead><tr><th scope="col">选择</th><th scope="col">封面</th><th scope="col">视频标题</th><th scope="col">核心改编标签</th><th scope="col">粉丝量级</th><th scope="col">播放量</th><th scope="col">评论率</th><th scope="col">转发率</th><th scope="col">综合分</th><th scope="col">等级</th><th scope="col">操作</th></tr></thead><tbody>{filteredVideos.map((video) => { const data = getVideoIndicators(video); return <tr key={video.id}><td><input type="checkbox" aria-label={`选择${video.title || '未命名视频'}`} checked={selectedIds.includes(video.id)} onChange={() => toggleVideo(video.id)} /></td><td><VideoCover /></td><td className="topic-detail-video-title">{video.title || '未命名视频'}</td><td><TagList video={video} /></td><td>{video.researchProfile?.followerScale || '—'}</td><td>{data.viewsText}</td><td>{percent(data.commentRate)}</td><td>{percent(data.shareRate)}</td><td>{scoreText(video)}</td><td><span className={`topic-detail-grade grade-${(video.researchProfile?.grade || '').toLowerCase()}`}>{gradeText(video)}</span></td><td><button type="button" onClick={() => onOpenVideo(video.id)}>详情 <ArrowRight size={14} /></button></td></tr>; })}</tbody></table></div> : <div className="topic-detail-card-grid">{filteredVideos.map((video) => { const data = getVideoIndicators(video); return <article key={video.id}><header><VideoCover /><label><input type="checkbox" checked={selectedIds.includes(video.id)} onChange={() => toggleVideo(video.id)} />加入对比</label></header><h4>{video.title || '未命名视频'}</h4><TagList video={video} /><p>播放量 {data.viewsText} · 评论率 {percent(data.commentRate)} · 转发率 {percent(data.shareRate)}</p><footer><span>综合分 {scoreText(video)} · {gradeText(video)} 级</span><button type="button" onClick={() => onOpenVideo(video.id)}>详情 <ArrowRight size={14} /></button></footer></article>; })}</div> : <p className="topic-library-empty">没有符合条件的视频。调整筛选，或新增这个母题的版本。</p>}</section>
  </div>;
}
