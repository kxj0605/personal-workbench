import React from 'react';
import { Check, Copy, Pencil, Trash2, X } from 'lucide-react';
import './PromptCard.css';

export function PromptCard({ title, description = '', body, number, metadata, editDetails, categories = [], onCopy, onSave, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [details, setDetails] = React.useState({});
  const editForm = React.useRef(null);
  const subcategories = categories.find(item => item.value === details.materialType)?.subcategories || [];
  const changeDetail = (key, value) => setDetails(current => ({ ...current, [key]: value }));
  const [expanded, setExpanded] = React.useState(false);
  const [overflowing, setOverflowing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  const textRef = React.useRef(null);
  const copyTimer = React.useRef(null);
  const contentId = React.useId();
  React.useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  React.useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollHeight > parseFloat(getComputedStyle(element).lineHeight) * 3 + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [body, editing]);
  const copy = async () => {
    try {
      await onCopy();
      setError('');
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('复制失败，请允许浏览器访问剪贴板。');
    }
  };
  const save = async () => {
    if (editForm.current && !editForm.current.reportValidity()) return;
    if (!draft.trim()) { setError('请填写提示词正文。'); return; }
    try {
      await onSave(editDetails ? { ...details, title: details.title.trim(), description: details.description.trim(), sourceCategory: (details.sourceCategory || '').trim(), tags: [...new Set((details.tags || '').split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean))], body: draft } : draft);
      setEditing(false);
      setError('');
    } catch {
      setError('保存失败，请重试。');
    }
  };
  return <article className="prompt-card">
    <header className="prompt-card-heading">
      <span className="prompt-card-number">{String(number).padStart(2, '0')}</span>
      <div className="prompt-card-title-group">
        <h3 title={title}>{title}</h3>
        {metadata && <div className="prompt-card-metadata">{metadata}</div>}
      </div>
      <div className="prompt-card-actions">
        {editing ? <>
          <button type="button" className="prompt-card-save" onClick={save}>保存</button>
          <button type="button" aria-label={`取消修改：${title}`} onClick={() => { setEditing(false); setError(''); }}><X size={16} /></button>
          {onDelete && <button type="button" className="prompt-card-delete" aria-label={`删除提示词：${title}`} title="删除提示词" onClick={onDelete}><Trash2 size={16} /></button>}
        </> : <>
          {onSave && <button type="button" aria-label={`修改提示词：${title}`} title="修改提示词" onClick={() => { setDraft(body); setDetails({ title, description, ...editDetails, tags: (editDetails?.tags || []).join('，') }); setEditing(true); setError(''); }}><Pencil size={16} /></button>}
          <button type="button" className={copied ? 'is-copied' : ''} aria-label={`${copied ? '已复制' : '复制提示词'}：${title}`} title={copied ? '已复制' : '复制提示词'} onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>
        </>}
      </div>
    </header>
    {!editing && <p className="prompt-card-description" title={description}>{description}</p>}
    {editing ? <form ref={editForm} className="prompt-card-edit-form" onSubmit={event => { event.preventDefault(); save(); }}>
      {editDetails && <div className="prompt-card-edit-fields">
        <label>标题<input required pattern={".*\\S.*"} maxLength={120} value={details.title || ''} onChange={event => changeDetail('title', event.target.value)} /></label>
        <label>简介<input required pattern={".*\\S.*"} maxLength={500} value={details.description || ''} onChange={event => changeDetail('description', event.target.value)} /></label>
        <label>大类<select aria-label="大类" required value={details.materialType || ''} onChange={event => setDetails(current => ({ ...current, materialType: event.target.value, subcategoryId: '' }))}><option value="">请选择大类</option>{!categories.some(item => item.value === details.materialType) && details.materialType && <option value={details.materialType}>原分类</option>}{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>二级分类<select aria-label="二级分类" required={subcategories.length > 0} value={details.subcategoryId || ''} onChange={event => changeDetail('subcategoryId', event.target.value)}><option value="">{subcategories.length ? '请选择二级分类' : '暂无二级分类'}</option>{subcategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>标签<input value={details.tags || ''} onChange={event => changeDetail('tags', event.target.value)} placeholder="多个标签用逗号分隔" /></label>
        <label>来源<input maxLength={40} value={details.sourceCategory || ''} onChange={event => changeDetail('sourceCategory', event.target.value)} /></label>
      </div>}
      <label className="prompt-card-body-label">提示词正文<textarea aria-label="提示词正文" required className="prompt-card-editor" value={draft} onChange={event => setDraft(event.target.value)} /></label>
    </form> :
      <div className={`prompt-card-preview${expanded ? ' is-expanded' : ''}`}>
        <p ref={textRef} id={contentId}>{body}</p>
        {overflowing && <div className="prompt-card-preview-footer"><button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)}>{expanded ? '收起 ▴' : '展开全文 ▾'}</button></div>}
      </div>}
    {error && <p className="prompt-card-error" role="alert">{error}</p>}
  </article>;
}
