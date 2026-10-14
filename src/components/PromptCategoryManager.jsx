import React from 'react';

export function PromptCategoryManager({ categories, onSave, onSelect, onDelete, isOpen, secondary = false }) {
  const [name, setName] = React.useState('');
  const [editing, setEditing] = React.useState('');
  const [error, setError] = React.useState('');
  const [deleting, setDeleting] = React.useState('');
  const [transferTo, setTransferTo] = React.useState('');
  const noun = secondary ? '二级分类' : '类别';
  const save = () => {
    const label = name.trim();
    if (!label) { setError('请填写类别名称。'); return; }
    if (categories.some(item => item.value !== editing && item.label === label)) { setError('这个类别已经存在。'); return; }
    const value = editing || `category-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    onSave(editing ? categories.map(item => item.value === editing ? { ...item, label } : item) : [...categories, { value, label }]);
    onSelect(value);
    setName(''); setEditing(''); setError('');
  };
  if (!isOpen) return null;
  return <div className="prompt-category-manager" id={secondary ? 'prompt-subcategory-manager' : 'prompt-category-manager'} role="region" aria-label={secondary ? '管理二级分类' : '管理提示词类别'}>
    <p>{secondary ? '二级分类只属于当前大类，可新增、改名或删除。' : '所有大类都可以改名或删除；至少保留一个大类。'}</p>
    <div className="prompt-category-add-row">
      <input aria-label={editing ? `修改${noun}名称` : `新${noun}名称`} value={name} maxLength={30} placeholder={secondary ? '例如：人物、背景、构图' : '例如：视频生成'} onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} />
      <button type="button" onClick={save}>{editing ? '保存名称' : `新增${noun}`}</button>
      {editing && <button type="button" onClick={() => { setEditing(''); setName(''); setError(''); }}>取消</button>}
    </div>
    {error && <p role="alert" className="prompt-category-error">{error}</p>}
    <ul>{categories.map(item => <li key={item.value}><span>{item.label}</span><div><button type="button" aria-label={`改名${item.label}`} onClick={() => { setEditing(item.value); setName(item.label); setError(''); }}>改名</button><button type="button" aria-label={`删除${item.label}`} disabled={!secondary && categories.length === 1} onClick={() => { setDeleting(item.value); setTransferTo(categories.find(category => category.value !== item.value)?.value || ''); }}>删除</button></div></li>)}</ul>
    {deleting && <div className="prompt-category-delete-confirm"><p>删除「{categories.find(item => item.value === deleting)?.label}」？{secondary ? '提示词可转移到同一大类的其他二级分类，或设为未分类。' : '已有提示词会转移到下方大类，并清除原来的二级分类。'}内容会保留。{!secondary && deleting === 'image-edit' && '图片修改的预置模板入口也会隐藏。'}</p><label>提示词转移到<select value={transferTo} onChange={event => setTransferTo(event.target.value)}>{secondary && <option value="">未分类</option>}{categories.filter(item => item.value !== deleting).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button type="button" disabled={!secondary && (!transferTo || categories.length < 2)} onClick={() => { onDelete(deleting, transferTo); if (editing === deleting) { setEditing(''); setName(''); } setDeleting(''); }}>{`确认删除${noun}`}</button><button type="button" onClick={() => setDeleting('')}>取消删除</button></div>}
  </div>;
}
