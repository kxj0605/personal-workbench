import React from 'react';
import { Check, ChevronRight, ExternalLink, FolderInput, Grid2X2, LayoutList, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import './WebsiteNavigationPanel.css';

const STORAGE_KEY = 'website-navigation-v1';
const DEFAULT_CATEGORIES = ['常用', '工作工具', '学习资料', '创作素材', '账号后台', '未分类'];
const COLOR_OPTIONS = ['#3976d5', '#7647c8', '#247b55', '#c97808', '#d93655', '#526077'];
const EMPTY_FORM = {
  name: '', url: '', category: '常用', iconText: '', iconColor: '#3976d5', iconMode: 'favicon', iconUrl: '', showOnHome: false, isFavorite: false,
};

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function loadData() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    const categories = Array.isArray(saved.categories) && saved.categories.length ? saved.categories : DEFAULT_CATEGORIES;
    const websites = Array.isArray(saved.websites) ? saved.websites : [];
    return { categories: [...new Set([...categories, '未分类'])], websites };
  } catch {
    return { categories: DEFAULT_CATEGORIES, websites: [] };
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getDomainFallbackName(url) {
  const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
  const segments = hostname.split('.').filter(Boolean);
  if (segments.length <= 1) return hostname;
  const countrySecondLevel = ['ac', 'co', 'com', 'edu', 'gov', 'net', 'org'];
  const hasCountrySuffix = segments.at(-1)?.length === 2 && countrySecondLevel.includes(segments.at(-2));
  return segments.at(hasCountrySuffix ? -3 : -2) || hostname;
}

function makeIconText(name = '') {
  return name.trim().slice(0, 2).toUpperCase() || '网';
}

function getAutoIconSources(value) {
  try {
    const url = new URL(value);
    const domain = url.hostname.replace(/^www\./, '');
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
      `${url.origin}/favicon.ico`,
    ];
  } catch {
    return [];
  }
}

function AutomaticWebsiteIcon({ sources }) {
  const sourceKey = sources.join('|');
  const [sourceIndex, setSourceIndex] = React.useState(0);

  React.useEffect(() => { setSourceIndex(0); }, [sourceKey]);

  const source = sources[sourceIndex];
  if (!source) return null;
  return <img src={source} alt="" onError={() => setSourceIndex((current) => current + 1)} />;
}

function WebsiteIcon({ website, size = 'regular' }) {
  const text = website.iconText || makeIconText(website.name);
  const autoIconSources = getAutoIconSources(website.url);
  return (
    <span className={`website-icon website-icon-${size}`} style={{ '--website-icon-color': website.iconColor || '#3976d5' }} aria-hidden="true">
      <span className="website-icon-text">{text}</span>
      {website.iconMode === 'custom' && website.iconUrl && <img src={website.iconUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
      {website.iconMode === 'favicon' && <AutomaticWebsiteIcon sources={autoIconSources} />}
    </span>
  );
}

export function WebsiteQuickLinks({ onAddWebsite }) {
  const [websites, setWebsites] = React.useState(() => loadData().websites);
  const pinned = websites.filter((website) => website.showOnHome).slice(0, 8);

  React.useEffect(() => {
    const refresh = () => setWebsites(loadData().websites);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  return (
    <section className="dashboard-website-section" aria-label="常用网址">
      {pinned.length ? (
        <div className="dashboard-website-grid">
          {pinned.map((website) => (
            <a className="dashboard-website-link" href={website.url} key={website.id} target="_blank" rel="noreferrer" title={website.name}>
              <WebsiteIcon website={website} size="small" />
              <span>{website.name}</span>
            </a>
          ))}
          <button className="dashboard-website-add" type="button" onClick={onAddWebsite}>
            <span aria-hidden="true"><Plus size={25} /></span>
            <em>添加网址</em>
          </button>
        </div>
      ) : (
        <div className="dashboard-website-grid">
          <button className="dashboard-website-add" type="button" onClick={onAddWebsite}>
            <span aria-hidden="true"><Plus size={25} /></span>
            <em>添加网址</em>
          </button>
        </div>
      )}
    </section>
  );
}

export function WebsiteNavigationPanel({ openCreateOnMount = false, onCreateRequestHandled }) {
  const [data, setData] = React.useState(loadData);
  const [query, setQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('全部');
  const [view, setView] = React.useState('grid');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isGroupOpen, setIsGroupOpen] = React.useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [newCategory, setNewCategory] = React.useState('');
  const [error, setError] = React.useState('');
  const [isReadingTitle, setIsReadingTitle] = React.useState(false);
  const [titleFeedback, setTitleFeedback] = React.useState(null);
  const [iconContextMenu, setIconContextMenu] = React.useState(null);
  const titleRequestId = React.useRef(0);
  const categoryPopoverRef = React.useRef(null);

  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  React.useEffect(() => () => { titleRequestId.current += 1; }, []);
  React.useEffect(() => {
    const closeMenu = () => setIconContextMenu(null);
    const closeOnEscape = (event) => { if (event.key === 'Escape') closeMenu(); };
    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, []);
  React.useEffect(() => {
    if (!isCategoryPopoverOpen) return undefined;
    const closePopover = (event) => {
      if (!categoryPopoverRef.current?.contains(event.target)) setIsCategoryPopoverOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsCategoryPopoverOpen(false);
    };
    window.addEventListener('pointerdown', closePopover);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closePopover);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isCategoryPopoverOpen]);

  const visibleWebsites = React.useMemo(() => data.websites.filter((website) => {
    const searchable = `${website.name} ${website.url} ${website.category}`.toLowerCase();
    return (categoryFilter === '全部' || website.category === categoryFilter)
      && (!query.trim() || searchable.includes(query.trim().toLowerCase()));
  }).sort((left, right) => Number(Boolean(right.isFavorite)) - Number(Boolean(left.isFavorite))), [data.websites, categoryFilter, query]);

  function openCreate() {
    resetTitleLookup();
    setForm({ ...EMPTY_FORM, category: data.categories[0] || '未分类' });
    setEditingId(null);
    setError('');
    setIsReadingTitle(false);
    setTitleFeedback(null);
    setIsFormOpen(true);
  }

  function openEdit(website) {
    resetTitleLookup();
    setForm({ ...EMPTY_FORM, ...website });
    setEditingId(website.id);
    setError('');
    setIsReadingTitle(false);
    setTitleFeedback(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    resetTitleLookup();
    setIsFormOpen(false);
    setEditingId(null);
    setError('');
    setIsReadingTitle(false);
    setTitleFeedback(null);
  }

  React.useEffect(() => {
    if (!openCreateOnMount) return;
    openCreate();
    onCreateRequestHandled?.();
  }, [openCreateOnMount, onCreateRequestHandled]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'url' || field === 'name') setTitleFeedback(null);
  }

  function resetTitleLookup() {
    titleRequestId.current += 1;
    setIsReadingTitle(false);
  }

  function applyDomainFallback(validatedUrl, requestId) {
    if (titleRequestId.current !== requestId) return;
    const fallbackName = getDomainFallbackName(validatedUrl);
    if (form.name.trim()) {
      setTitleFeedback({ type: 'fallback', text: '无法读取真实网站名称，已保留当前名称。' });
      return;
    }
    setForm((current) => current.name.trim() ? current : { ...current, name: fallbackName });
    setTitleFeedback({ type: 'fallback', text: `无法读取真实网站名称，已使用域名“${fallbackName}”，可修改。` });
  }

  async function readWebsiteTitle() {
    const url = normalizeUrl(form.url);
    if (!url || isReadingTitle) return;

    let validatedUrl;
    try {
      validatedUrl = new URL(url);
    } catch {
      setTitleFeedback({ type: 'error', text: '请输入有效的网址链接后再读取。' });
      return;
    }

    const requestId = titleRequestId.current + 1;
    titleRequestId.current = requestId;
    setIsReadingTitle(true);
    setError('');
    setTitleFeedback(null);

    try {
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(validatedUrl.href)}`);
      const payload = await response.json();
      if (!response.ok || payload?.status === 'fail') {
        throw new Error(payload?.code === 'EPROXYNEEDED' ? '该网站阻止自动读取，请手动填写名称。' : '读取失败，请检查网址或稍后重试。');
      }
      const title = typeof payload?.data?.title === 'string' ? payload.data.title.trim() : '';

      if (titleRequestId.current !== requestId) return;
      if (title) {
        setForm((current) => ({ ...current, name: title.slice(0, 40) }));
        setTitleFeedback({ type: 'success', text: '已读取网站名称，并填入输入框。' });
      } else {
        applyDomainFallback(validatedUrl, requestId);
      }
    } catch {
      if (titleRequestId.current === requestId) {
        applyDomainFallback(validatedUrl, requestId);
      }
    } finally {
      if (titleRequestId.current === requestId) setIsReadingTitle(false);
    }
  }

  function submitForm(event) {
    event.preventDefault();
    const url = normalizeUrl(form.url);
    if (!form.name.trim() || !url) { setError('请填写网站名称和网址链接。'); return; }
    try { new URL(url); } catch { setError('请输入有效的网址链接。'); return; }
    const website = {
      ...form,
      id: editingId || makeId(),
      name: form.name.trim(),
      url,
      category: data.categories.includes(form.category) ? form.category : '未分类',
      iconText: form.iconText.trim().slice(0, 2),
      iconUrl: form.iconUrl.trim(),
      updatedAt: new Date().toISOString(),
    };
    setData((current) => ({
      ...current,
      websites: editingId ? current.websites.map((item) => item.id === editingId ? website : item) : [...current.websites, website],
    }));
    closeForm();
  }

  function addCategory(event) {
    event?.preventDefault();
    const category = newCategory.trim();
    if (!category || data.categories.includes(category)) return;
    setData((current) => ({ ...current, categories: [...current.categories.filter((item) => item !== '未分类'), category, '未分类'] }));
    setNewCategory('');
  }

  function removeCategory(category) {
    if (category === '未分类') return;
    const affected = data.websites.filter((website) => website.category === category).length;
    if (!window.confirm(affected ? `删除“${category}”后，其中 ${affected} 个网址会移至“未分类”。确定继续吗？` : `确定删除分类“${category}”吗？`)) return;
    setData((current) => ({
      categories: current.categories.filter((item) => item !== category),
      websites: current.websites.map((website) => website.category === category ? { ...website, category: '未分类' } : website),
    }));
    if (categoryFilter === category) setCategoryFilter('全部');
  }

  function removeWebsite(website) {
    if (!window.confirm(`确定删除“${website.name}”吗？`)) return;
    setData((current) => ({ ...current, websites: current.websites.filter((item) => item.id !== website.id) }));
  }

  function toggleWebsiteOnHome(website) {
    setData((current) => ({
      ...current,
      websites: current.websites.map((item) => item.id === website.id ? { ...item, showOnHome: !item.showOnHome } : item),
    }));
  }

  function setWebsiteCategory(website, category) {
    setData((current) => ({
      ...current,
      websites: current.websites.map((item) => item.id === website.id ? { ...item, category } : item),
    }));
  }

  function openIconContextMenu(event, website) {
    event.preventDefault();
    setIconContextMenu({
      website,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 128)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 54)),
    });
  }

  return (
    <section className="website-navigation-page">
      <div className="website-navigation-actions">
        <div className="website-browse-controls">
          <label className="website-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站名称、网址或分类" /></label>
          <div className="website-view-switch" aria-label="网址显示方式"><button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} title="图标视图"><Grid2X2 size={17} />图标</button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} title="列表视图"><LayoutList size={17} />列表</button></div>
        </div>
        <span className="website-toolbar-divider" aria-hidden="true" />
        <button className="website-primary-action" type="button" onClick={openCreate}><Plus size={18} />添加网址</button>
      </div>

      {isGroupOpen && (
        <section className="website-category-manager panel-card">
          <div><h2>网址分类</h2><p>一个网址只能归入一个分类；删除分类时，网址会自动移至“未分类”。</p></div>
          <div className="website-category-list">
            {data.categories.map((category) => <span key={category}>{category}{category !== '未分类' && <button type="button" onClick={() => removeCategory(category)} aria-label={`删除分类 ${category}`}><X size={13} /></button>}</span>)}
          </div>
          <form onSubmit={addCategory} className="website-add-category"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="输入新分类名称" maxLength="16" /><button type="submit">新建分类</button></form>
        </section>
      )}

      {isFormOpen && (
        <form className="website-editor panel-card" onSubmit={submitForm}>
          <div className="website-editor-heading"><h2>{editingId ? '编辑网址' : '添加网址'}</h2><button type="button" onClick={closeForm} aria-label="关闭添加网址"><X size={18} /></button></div>
          <div className="website-form-grid website-form-primary">
            <label><span className="website-field-label">网站链接 <span className="website-required-mark">*</span></span><input value={form.url} onChange={(event) => updateForm('url', event.target.value)} placeholder="https://www.notion.so" inputMode="url" autoFocus /></label>
            <label><span className="website-field-label">网站名称 <span className="website-required-mark">*</span></span><span className="website-name-input-row"><input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="例如：Notion" maxLength="40" /><button type="button" className="website-read-title-button" onClick={readWebsiteTitle} disabled={!form.url.trim() || isReadingTitle}>{isReadingTitle ? '读取中…' : '读取名称'}</button></span>{titleFeedback && <small className={`website-title-feedback ${titleFeedback.type}`} role="status" aria-live="polite">{titleFeedback.text}</small>}</label>
          </div>
          <div className="website-form-grid">
            <label><span className="website-field-label">网址图标 <span className="website-required-mark">*</span></span><span className="website-icon-choice"><WebsiteIcon website={{ ...form, url: normalizeUrl(form.url) }} /><select value={form.iconMode} onChange={(event) => updateForm('iconMode', event.target.value)}><option value="favicon">自动获取网站图标</option><option value="text">使用文字图标</option><option value="custom">自定义图标链接</option></select></span></label>
            <label><span className="website-field-label">网站分类</span><span className="website-category-select-row"><select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>{data.categories.map((category) => <option value={category} key={category}>{category}</option>)}</select><span className="website-category-popover-anchor" ref={categoryPopoverRef}><button className="website-category-quick-action" type="button" onClick={() => { setIsGroupOpen(false); setIsCategoryPopoverOpen((open) => !open); }} aria-label="新建分类" title="新建分类"><Pencil size={18} /></button>{isCategoryPopoverOpen && <span className="website-category-popover" role="dialog" aria-label="管理网址分类"><span className="website-category-popover-heading"><strong>管理分类</strong><button type="button" onClick={() => setIsCategoryPopoverOpen(false)} aria-label="关闭分类管理"><X size={16} /></button></span><span className="website-category-list">{data.categories.map((category) => <span key={category}>{category}{category !== '未分类' && <button type="button" onClick={() => removeCategory(category)} aria-label={`删除分类 ${category}`}><X size={13} /></button>}</span>)}</span><span className="website-category-add-row"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } }} placeholder="输入新分类名称" maxLength="16" /><button type="button" onClick={() => addCategory()}>新建</button></span></span>}</span></span></label>
          </div>
          {form.iconMode === 'custom' && <label className="website-full-field">图标图片链接<input value={form.iconUrl} onChange={(event) => updateForm('iconUrl', event.target.value)} placeholder="https://example.com/icon.png" inputMode="url" /></label>}
          {form.iconMode === 'text' && <div className="website-icon-controls">
            <label>图标文字<input value={form.iconText} onChange={(event) => updateForm('iconText', event.target.value)} placeholder={makeIconText(form.name)} maxLength="2" /></label>
            <div className="website-color-field"><span>图标颜色</span><div>{COLOR_OPTIONS.map((color) => <button className={form.iconColor === color ? 'active' : ''} type="button" key={color} onClick={() => updateForm('iconColor', color)} style={{ backgroundColor: color }} aria-label={`选择图标颜色 ${color}`}>{form.iconColor === color && <Check size={13} />}</button>)}</div></div>
          </div>}
          <div className="website-display-options">
            <label className="website-home-toggle"><input type="checkbox" checked={form.showOnHome} onChange={(event) => updateForm('showOnHome', event.target.checked)} /><span><strong>在「首页」显示</strong><small>勾选后会显示在首页的常用网址区域。</small></span></label>
            <label className="website-home-toggle"><input type="checkbox" checked={form.isFavorite} onChange={(event) => updateForm('isFavorite', event.target.checked)} /><span><strong>在列表中置顶</strong><small>勾选后会在下方网址列表中优先显示。</small></span></label>
          </div>
          {error && <p className="website-form-error">{error}</p>}
          <div className="website-form-actions"><button className="website-secondary-action" type="button" onClick={closeForm}>取消</button><button className="website-primary-action" type="submit">{editingId ? '保存修改' : '添加网址'}</button></div>
        </form>
      )}

      <section className="website-library">
        <div className="website-category-filter-row"><div className="website-category-filter" aria-label="网址分类筛选"><button className={categoryFilter === '全部' ? 'active' : ''} type="button" onClick={() => setCategoryFilter('全部')}>全部 <span>{data.websites.length}</span></button>{data.categories.map((category) => <button className={categoryFilter === category ? 'active' : ''} type="button" key={category} onClick={() => setCategoryFilter(category)}>{category} <span>{data.websites.filter((website) => website.category === category).length}</span></button>)}<button className={isGroupOpen ? 'website-category-manage active' : 'website-category-manage'} type="button" onClick={() => setIsGroupOpen((open) => !open)}><Pencil size={15} />管理分类</button></div></div>
        {visibleWebsites.length ? <div className={`website-results website-results-${view}`}>{visibleWebsites.map((website) => <WebsiteCard key={website.id} website={website} view={view} categories={data.categories} onEdit={() => openEdit(website)} onDelete={() => removeWebsite(website)} onSetCategory={(category) => setWebsiteCategory(website, category)} onIconContextMenu={openIconContextMenu} />)}</div> : <section className="website-empty panel-card"><span><Link2 size={28} /></span><h2>{data.websites.length ? '没有符合条件的网址' : '还没有保存网址'}</h2><p>{data.websites.length ? '换一个分类或搜索词试试。' : '把经常打开的网站收在这里，再决定是否固定到首页。'}</p><button className="website-primary-action" type="button" onClick={openCreate}><Plus size={18} />添加第一个网址</button></section>}
      </section>
      {iconContextMenu && <div className="website-icon-context-menu" role="menu" aria-label={`${iconContextMenu.website.name} 的操作`} style={{ left: iconContextMenu.x, top: iconContextMenu.y }} onClick={(event) => event.stopPropagation()}><button type="button" role="menuitem" onClick={() => { setIconContextMenu(null); openEdit(iconContextMenu.website); }}><Pencil size={16} />编辑</button></div>}
    </section>
  );
}

function WebsiteCard({ website, view, categories, onEdit, onDelete, onSetCategory, onIconContextMenu }) {
  return (
    <article className="website-card">
      <a className="website-card-main" href={website.url} target="_blank" rel="noreferrer" onContextMenu={view === 'grid' ? (event) => onIconContextMenu(event, website) : undefined}><WebsiteIcon website={website} /><span className="website-card-copy">{view === 'list' ? <><span className="website-card-title-row"><strong>{website.name}</strong><em>{website.category}</em></span><small>{website.url}</small></> : <strong>{website.name}</strong>}</span></a>
      {view === 'list' && <div className="website-card-actions">
        <a className="website-icon-action" href={website.url} target="_blank" rel="noreferrer" aria-label={`打开 ${website.name}`} title="打开网址"><ExternalLink size={17} /></a>
        <button className="website-icon-action" type="button" onClick={onEdit} aria-label={`编辑 ${website.name}`} title="编辑"><Pencil size={17} /></button>
        <div className="website-more-actions">
          <button className="website-icon-action" type="button" aria-label={`${website.name} 的更多操作`} title="更多操作"><MoreHorizontal size={18} /></button>
          <div className="website-more-menu" role="menu" aria-label={`${website.name} 的更多操作`}>
            <div className="website-group-picker">
              <button type="button" role="menuitem"><FolderInput size={16} />设置分组<ChevronRight size={15} /></button>
              <div className="website-group-menu" role="menu" aria-label="选择网址分组">
                {categories.map((category) => <button type="button" role="menuitem" className={website.category === category ? 'active' : ''} key={category} onClick={() => onSetCategory(category)}>{category}{website.category === category && <Check size={15} />}</button>)}
              </div>
            </div>
            <button type="button" role="menuitem" className="danger" onClick={onDelete}><Trash2 size={16} />删除</button>
          </div>
        </div>
      </div>}
    </article>
  );
}
