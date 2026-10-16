import React from 'react';
import { Check, Copy, LibraryBig, Pencil, Plus, Search, Settings2, Trash2, X, CircleHelp, ChevronDown, ChevronRight } from 'lucide-react';
import { loadPromptHub, makeId, PROMPT_HUB_KEY, promptLabels } from '../utils/promptHubStore';
import { PromptCategoryManager } from './PromptCategoryManager';
import './PromptHubPanel.css';

function HubDialog({ title, children, onClose, wide = false }) {
  const ref = React.useRef(null);
  React.useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`ph-dialog${wide ? ' ph-wide' : ''}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><header><h2>{title}</h2><button type="button" aria-label={`关闭${title}`} onClick={onClose}><X size={18} /></button></header>{children}</dialog>;
}

function HubCard({ prompt, categories, onEdit, onNotice }) {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const labels = promptLabels(prompt, categories);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.materialType === 'image-edit' ? prompt.body.replace(/【[^】]*】/g, '【】') : prompt.body);
      setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2200);
      onNotice(prompt.materialType === 'image-edit' ? '已复制，方括号内示例已清空。' : '提示词已复制。');
    } catch { onNotice('复制失败，请允许浏览器访问剪贴板。'); }
  };
  return <article className="ph-card">
    <header className="ph-card-heading"><div className="ph-card-meta"><div className="ph-card-title"><span>{prompt.code}</span><h3 title={prompt.title}>{prompt.title}</h3></div><span className="ph-badge ph-category">{labels.category}</span><span className="ph-badge ph-secondary">{labels.secondary}</span></div><div className="ph-card-actions"><button type="button" aria-label={`修改提示词：${prompt.title}`} title="修改提示词" onClick={() => onEdit(prompt)}><Pencil size={16} /></button><button type="button" className={copied ? 'is-copied' : ''} aria-label={`${copied ? '已复制' : '复制提示词'}：${prompt.title}`} title={copied ? '已复制' : '复制提示词'} onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></header>
    <p className="ph-description" title={prompt.description}>{prompt.description}</p>
    <div className="ph-preview"><button type="button" className="ph-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? '收起正文' : '展开全文'}<ChevronDown size={12} style={expanded ? { transform: 'rotate(180deg)' } : undefined} /></button><div className={`ph-body${expanded ? ' is-expanded' : ''}`}>{prompt.body}</div></div>
  </article>;
}

export function PromptHubPanel({ initialCategory = 'all', onCategoryChange }) {
  const [data, setData] = React.useState(loadPromptHub);
  const [categoryId, setCategoryId] = React.useState(initialCategory);
  const [groupId, setGroupId] = React.useState('');
  const [subcategoryId, setSubcategoryId] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [editor, setEditor] = React.useState(null);
  const [manager, setManager] = React.useState(false);
  const [guide, setGuide] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [storageError, setStorageError] = React.useState('');
  const [manageCategoryId, setManageCategoryId] = React.useState('image-edit');
  const [manageGroupId, setManageGroupId] = React.useState('');
  const [deletePending, setDeletePending] = React.useState(false);
  React.useEffect(() => { try { localStorage.setItem(PROMPT_HUB_KEY, JSON.stringify(data)); setStorageError(''); } catch { setStorageError('本地存储未能保存，请先复制保留重要内容。'); } }, [data]);
  React.useEffect(() => { if (initialCategory !== categoryId) { setCategoryId(initialCategory); setGroupId(''); setSubcategoryId(''); } }, [initialCategory]);
  React.useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2600); return () => clearTimeout(timer); }, [notice]);
  const category = data.categories.find(item => item.value === categoryId);
  const activeGroup = category?.subcategories?.find(item => item.value === groupId);
    const filtered = data.prompts.filter(prompt => (categoryId === 'all' || prompt.materialType === categoryId)
    && (!groupId || (groupId === 'unclassified' ? !prompt.groupId && !prompt.subcategoryId : prompt.groupId === groupId))
    && (!subcategoryId || (subcategoryId === 'unclassified' ? !prompt.subcategoryId : prompt.subcategoryId === subcategoryId))
    && (!search.trim() || [prompt.title, prompt.description, prompt.body, prompt.sourceCategory, ...(prompt.tags || [])].some(text => String(text || '').toLowerCase().includes(search.trim().toLowerCase()))));
  const changeCategory = (value, group = '', subcategory = '') => { setCategoryId(value); setGroupId(group); setSubcategoryId(subcategory); onCategoryChange?.(value); };
  const startEdit = prompt => { setEditor({ ...prompt, tagsText: (prompt.tags || []).join('，') }); setDeletePending(false); };
  const startCreate = () => { const target = category || data.categories[0]; setEditor({ id: '', title: '', description: '', body: '', materialType: target.value, groupId: groupId === 'unclassified' ? '' : groupId, subcategoryId: subcategoryId === 'unclassified' ? '' : subcategoryId, tagsText: '', sourceCategory: '' }); setDeletePending(false); };
  const editorCategory = data.categories.find(item => item.value === editor?.materialType);
  const editorGroup = editorCategory?.subcategories?.find(item => item.value === editor?.groupId);
  const editorGrouped = editorCategory?.subcategories?.some(item => item.children);
  const editorChildren = editorGrouped ? editorGroup?.children || [] : editorCategory?.subcategories || [];
  const save = event => {
    event.preventDefault();
    if (![editor.title, editor.description, editor.body].every(text => text?.trim())) { setNotice('请填写标题、简介和正文。'); return; }
    const { tagsText, ...rest } = editor;
    const prompt = { ...rest, id: editor.id || `user-${makeId()}`, code: editor.code || `#USR-${String(data.prompts.filter(item => !item.isBuiltin).length + 1).padStart(3, '0')}`, title: editor.title.trim(), description: editor.description.trim(), sourceCategory: (editor.sourceCategory || '').trim(), tags: [...new Set(tagsText.split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean))], updatedAt: new Date().toISOString() };
    setData(current => ({ ...current, prompts: editor.id ? current.prompts.map(item => item.id === editor.id ? prompt : item) : [prompt, ...current.prompts] }));
    setEditor(null); setNotice('提示词已保存。');
    if (categoryId !== 'all') { changeCategory(prompt.materialType); setGroupId(prompt.groupId || ''); setSubcategoryId(''); }
  };
  const manageCategory = data.categories.find(item => item.value === manageCategoryId) || data.categories[0];
  const manageGroup = manageCategory.subcategories?.find(item => item.value === manageGroupId);
  const saveCategories = categories => setData(current => ({ ...current, categories }));
  const updateSubcategories = children => saveCategories(data.categories.map(item => item.value === manageCategory.value ? { ...item, subcategories: children } : item));
  const deleteCategory = (value, transferTo) => {
    setData(current => ({ ...current, categories: current.categories.filter(item => item.value !== value), prompts: current.prompts.map(item => item.materialType === value ? { ...item, materialType: transferTo, groupId: '', subcategoryId: '' } : item) }));
    if (categoryId === value) changeCategory('all'); setManageCategoryId(transferTo); setManageGroupId('');
  };
  const deleteSubcategory = (value, transferTo) => {
    setData(current => ({ ...current, categories: current.categories.map(item => item.value === manageCategory.value ? { ...item, subcategories: item.subcategories.filter(child => child.value !== value) } : item), prompts: current.prompts.map(item => item.materialType === manageCategory.value && (item.groupId === value || item.subcategoryId === value) ? { ...item, groupId: item.groupId === value ? (manageCategory.subcategories.find(child => child.value === transferTo)?.children ? transferTo : '') : item.groupId, subcategoryId: item.groupId === value ? '' : transferTo } : item) }));
    setGroupId(''); setSubcategoryId(''); setManageGroupId('');
  };
  return <section className="prompt-hub" aria-label="提示词库">

    {storageError && <p className="ph-error" role="alert">{storageError}</p>}
    <nav className="ph-category-tree" aria-label="提示词大类">
      <div className="ph-filter-search-row"><label className="ph-search"><Search size={16} /><input aria-label="搜索提示词" placeholder="快速查找标题 / 内容…" value={search} onChange={event => setSearch(event.target.value)} /></label><button type="button" className="ph-reset-filters" disabled={categoryId === 'all' && !search} onClick={() => { changeCategory('all'); setSearch(''); }}>清除筛选</button><div className="ph-toolbar-actions"><button type="button" className="ph-primary" onClick={startCreate}><Plus size={16} />新建提示词</button><button type="button" aria-label="分类管理" onClick={() => setManager(true)}><Settings2 size={16} /><span>分类管理</span></button><button type="button" className="ph-help-icon" aria-label="使用教程" title="使用教程" onClick={() => setGuide(true)}><CircleHelp size={16} /></button></div></div>
      {data.categories.map((item, index) => {
        const hasGroups = item.subcategories?.some(child => child.children);
        return <div className={`ph-filter-row${index === 0 ? ' ph-filter-row-count' : ''}`} key={item.value}>
          <button type="button" className="ph-category-label" aria-pressed={categoryId === item.value} onClick={() => changeCategory(item.value)}><span>{item.label}</span><ChevronRight size={14} aria-hidden="true" /></button>
          <nav className="ph-row-options" aria-label={hasGroups ? '提示词分组' : item.value === 'script' ? '二级分类筛选' : `${item.label}二级分类`}>
            {(item.subcategories || []).map(child => <button type="button" key={child.value} aria-pressed={categoryId === item.value && (hasGroups ? groupId : subcategoryId) === child.value} onClick={() => changeCategory(item.value, hasGroups ? child.value : '', hasGroups ? '' : child.value)}>{child.label}</button>)}
            <button type="button" aria-pressed={categoryId === item.value && (hasGroups ? groupId : subcategoryId) === 'unclassified'} onClick={() => changeCategory(item.value, hasGroups ? 'unclassified' : '', hasGroups ? '' : 'unclassified')}>未分类</button>
          </nav>
          {index === 0 && <span className="ph-count" aria-live="polite">共 {filtered.length} 条</span>}
          {categoryId === item.value && activeGroup?.children?.length > 0 && <nav className="ph-row-options ph-refined-row" aria-label={`${activeGroup.label}二级分类`}><button type="button" aria-pressed={!subcategoryId} onClick={() => setSubcategoryId('')}>全部</button>{activeGroup.children.map(child => <button type="button" key={child.value} aria-pressed={subcategoryId === child.value} onClick={() => setSubcategoryId(child.value)}>{child.label}</button>)}<button type="button" aria-pressed={subcategoryId === 'unclassified'} onClick={() => setSubcategoryId('unclassified')}>未分类</button></nav>}
        </div>;
      })}

    </nav>
    <div className="ph-grid">{filtered.map(prompt => <HubCard key={prompt.id} prompt={prompt} categories={data.categories} onEdit={startEdit} onNotice={setNotice} />)}</div>
    {!filtered.length && <div className="ph-empty"><LibraryBig size={32} /><h3>当前筛选条件下暂无提示词</h3><p>尝试其他分类或搜索词，也可以新建提示词。</p><button type="button" onClick={() => { changeCategory('all'); setSearch(''); }}>查看全部</button></div>}
    {notice && <div className="ph-toast" role="status">{notice}</div>}
    {editor && <HubDialog title={editor.id ? '修改提示词' : '新建提示词'} onClose={() => setEditor(null)}><form className="ph-editor" onSubmit={save}><div className="ph-editor-fields"><label className="ph-full">标题<input required pattern={".*\\S.*"} maxLength={120} value={editor.title} onChange={event => setEditor({ ...editor, title: event.target.value })} /></label><label>所属大类<select aria-label="所属大类" required value={editor.materialType} onChange={event => setEditor({ ...editor, materialType: event.target.value, groupId: '', subcategoryId: '' })}>{data.categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>{editorGrouped && <label>分组<select aria-label="分组" required value={editor.groupId || ''} onChange={event => setEditor({ ...editor, groupId: event.target.value, subcategoryId: '' })}><option value="">请选择分组</option>{editorCategory.subcategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}<label>二级分类<select aria-label="二级分类" required={editorChildren.length > 0} value={editor.subcategoryId || ''} onChange={event => setEditor({ ...editor, subcategoryId: event.target.value })}><option value="">{editorChildren.length ? '请选择二级分类' : '暂无二级分类'}</option>{editorChildren.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="ph-full">简介<input required pattern={".*\\S.*"} maxLength={500} value={editor.description} onChange={event => setEditor({ ...editor, description: event.target.value })} /></label><label>标签（逗号分隔）<input value={editor.tagsText} onChange={event => setEditor({ ...editor, tagsText: event.target.value })} /></label><label>来源<input maxLength={80} value={editor.sourceCategory || ''} onChange={event => setEditor({ ...editor, sourceCategory: event.target.value })} /></label><label className="ph-full">提示词正文<textarea aria-label="提示词正文" required value={editor.body} onChange={event => setEditor({ ...editor, body: event.target.value })} /></label></div><footer>{editor.id && <button type="button" className="ph-delete" onClick={() => setDeletePending(true)}><Trash2 size={16} />删除提示词</button>}<button type="button" onClick={() => setEditor(null)}>取消</button><button className="ph-primary" type="submit">保存并生效</button></footer>{deletePending && <div className="ph-delete-confirm" role="alert"><p>确定删除「{editor.title}」？</p><button type="button" className="ph-delete" onClick={() => { setData(current => ({ ...current, prompts: current.prompts.filter(item => item.id !== editor.id) })); setEditor(null); setNotice('提示词已删除。'); }}>确认删除</button><button type="button" onClick={() => setDeletePending(false)}>取消删除</button></div>}</form></HubDialog>}
    {manager && <HubDialog title="分类管理" wide onClose={() => setManager(false)}><div className="ph-manager"><PromptCategoryManager isOpen categories={data.categories} onSave={saveCategories} onSelect={value => { setManageCategoryId(value); setManageGroupId(''); }} onDelete={deleteCategory} /><label>管理哪个大类<select aria-label="管理哪个大类" value={manageCategory.value} onChange={event => { setManageCategoryId(event.target.value); setManageGroupId(''); }}>{data.categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><PromptCategoryManager key={manageCategory.value} secondary isOpen categories={manageCategory.subcategories || []} onSave={updateSubcategories} onSelect={setManageGroupId} onDelete={deleteSubcategory} />{manageGroup?.children && <><h3>{manageGroup.label} · 二级分类</h3><PromptCategoryManager key={manageGroup.value} secondary isOpen categories={manageGroup.children} onSave={children => updateSubcategories(manageCategory.subcategories.map(item => item.value === manageGroup.value ? { ...item, children } : item))} onSelect={() => {}} onDelete={(value, transferTo) => { setData(current => ({ ...current, categories: current.categories.map(item => item.value === manageCategory.value ? { ...item, subcategories: item.subcategories.map(group => group.value === manageGroup.value ? { ...group, children: group.children.filter(child => child.value !== value) } : group) } : item), prompts: current.prompts.map(item => item.materialType === manageCategory.value && item.groupId === manageGroup.value && item.subcategoryId === value ? { ...item, subcategoryId: transferTo } : item) })); setSubcategoryId(''); }} /></>}{manageCategory.subcategories?.some(item => item.children) && <label>管理分组内的二级分类<select aria-label="管理分组内的二级分类" value={manageGroupId} onChange={event => setManageGroupId(event.target.value)}><option value="">请选择分组</option>{manageCategory.subcategories.filter(item => item.children).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}</div></HubDialog>}
    {guide && <HubDialog title="使用教程" onClose={() => setGuide(false)}><div className="ph-guide"><p>默认浏览所有提示词，也可按大类、分组和二级分类筛选。“清除筛选”会清空搜索并恢复全部内容，右侧数量随结果更新。</p><p>点击复制图标复制正文。图片类会把【示例内容】清空为【】，便于填写。</p><p>点击铅笔编辑标题、简介、分类、标签、来源和正文。删除按钮位于编辑窗口内。</p><p>通过“分类管理”新增、改名或删除分类；删除分类时可转移其中的内容。</p><p>内容保存在当前浏览器中，刷新后保留。</p></div></HubDialog>}
  </section>;
}
