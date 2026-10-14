import React from 'react';
import { useMaterialVideos, parseMaterialUrl, materialUrlKey } from '../utils/materialVideos';
import './MaterialVideosPanel.css';

const blank = () => ({ url: '', title: '', note: '', projectId: '', usage: '' });
export function MaterialVideosPanel({ projectId = '', projects = [] }) {
  const { videos, update, error } = useMaterialVideos();
  const [draft, setDraft] = React.useState(blank);
  const [editingId, setEditingId] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [scope, setScope] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [existingId, setExistingId] = React.useState('');
  const [existingUsage, setExistingUsage] = React.useState('');
  const [deleteId, setDeleteId] = React.useState('');
  const assignments = video => video.assignments || [];
  const linked = video => assignments(video).some(item => item.projectId === projectId);
  const visible = videos.filter(video => (!projectId || linked(video)) && (scope !== 'pending' || !assignments(video).some(item => projects.some(project => project.id === item.projectId))) && `${video.title} ${video.url} ${video.note} ${assignments(video).map(item => item.usage || '').join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const apply = action => { try { action(); } catch (e) { setNotice(`保存失败：${e.message}`); } };
  const attach = (id, target, usage, preserveExisting = false) => {
    update(current => current.map(video => {
      if (video.id !== id) return video;
      const links = assignments(video);
      return { ...video, assignments: links.some(item => item.projectId === target) ? links.map(item => item.projectId === target ? { ...item, usage: preserveExisting && !usage.trim() ? item.usage : usage } : item) : [...links, { projectId: target, usage }] };
    }));
  };
  const save = event => {
    event.preventDefault();
    apply(() => {
      const url = parseMaterialUrl(draft.url);
      const duplicate = videos.find(video => video.id !== editingId && materialUrlKey(video.url) === materialUrlKey(url));
      const target = projectId || draft.projectId;
      if (duplicate) {
        if (editingId) { setNotice('这个链接已存在，请使用已有素材记录。'); return; }
        if (target) attach(duplicate.id, target, draft.usage.trim(), true);
        setNotice(target ? '链接已存在，已引用原素材到项目，未重复收集。' : '链接已收集，未新增重复记录。');
        setSearch(''); setScope('all'); setDraft(blank()); return;
      }
      update(current => {
        if (editingId) return current.map(video => video.id === editingId ? { ...video, url, title: draft.title.trim() || new URL(url).hostname, note: draft.note.trim() } : video);
        return [{ id: crypto.randomUUID(), url, title: draft.title.trim() || new URL(url).hostname, note: draft.note.trim(), createdAt: new Date().toISOString(), assignments: target ? [{ projectId: target, usage: draft.usage.trim() }] : [] }, ...current];
      });
      setEditingId(''); setDraft(blank()); setNotice(target ? '素材已保存并关联项目。' : '素材链接已保存到待分配。');
    });
  };
  const form = <form className="material-video-form" onSubmit={save}>
    <input aria-label="素材视频链接" placeholder="粘贴素材视频链接或分享文案（必填）" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} required />
    <div className="material-video-form-grid"><input aria-label="素材名称" placeholder="名称（可选）" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} maxLength={120} /><input aria-label="素材备注" placeholder="备注（可选）" value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} maxLength={500} />
      {!projectId && !editingId && <select aria-label="素材关联项目" value={draft.projectId} onChange={e => setDraft({ ...draft, projectId: e.target.value })}><option value="">暂不关联项目 · 待分配</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select>}
      {!editingId && (projectId || draft.projectId) && <input aria-label="素材在项目中的用途" placeholder="在项目中的用途，例如参考开头（可选）" value={draft.usage} onChange={e => setDraft({ ...draft, usage: e.target.value })} maxLength={200} />}
    </div><div className="material-video-form-actions"><button type="submit">{editingId ? '保存修改' : projectId ? '保存并引用素材' : '保存素材链接'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setDraft(blank()); }}>取消修改</button>}</div>
  </form>;
  return <section className={`material-videos-panel${projectId ? ' material-videos-project' : ''}`} aria-label={projectId ? '项目素材视频' : '素材视频库'}>
    <header><h3>素材视频</h3><span>{visible.length} 条</span></header>
    {!projectId && <p>先保存链接，之后再分配到项目。每条素材可以被多个项目引用。</p>}
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {projectId ? <details><summary>添加素材链接</summary>{form}</details> : form}
    {projectId && <details><summary>从已收集素材中选择</summary><div className="material-video-existing"><select aria-label="选择已有素材" value={existingId} onChange={e => setExistingId(e.target.value)}><option value="">选择素材</option>{videos.filter(video => !linked(video)).map(video => <option key={video.id} value={video.id}>{video.title}</option>)}</select><input aria-label="引用已有素材的用途" placeholder="用途（可选）" value={existingUsage} onChange={e => setExistingUsage(e.target.value)} maxLength={200} /><button type="button" disabled={!existingId} onClick={() => apply(() => { attach(existingId, projectId, existingUsage); setExistingId(''); setExistingUsage(''); setNotice('已引用素材。'); })}>引用素材</button></div></details>}
    {!projectId && <div className="material-video-filters"><nav aria-label="素材视频筛选"><button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>全部素材</button><button type="button" aria-pressed={scope === 'pending'} onClick={() => setScope('pending')}>待分配</button></nav><input aria-label="搜索素材视频" placeholder="搜索名称、链接或用途" value={search} onChange={e => setSearch(e.target.value)} /></div>}
    <div className="material-video-list">{visible.map(video => <article className="material-video-card" key={video.id}><div className="material-video-card-heading"><a href={video.url} target="_blank" rel="noreferrer">{video.title}</a><div>{projectId ? <button type="button" onClick={() => apply(() => { update(current => current.map(item => item.id === video.id ? { ...item, assignments: assignments(item).filter(link => link.projectId !== projectId) } : item)); setNotice('已取消项目引用，素材链接仍保留在素材库。'); })}>取消引用</button> : <><button type="button" onClick={() => { setEditingId(video.id); setDraft({ ...blank(), url: video.url, title: video.title, note: video.note || '' }); }}>修改</button><button type="button" onClick={() => setDeleteId(video.id)}>删除</button></>}</div></div><a className="material-video-url" href={video.url} target="_blank" rel="noreferrer">{video.url}</a>{video.note && <p>{video.note}</p>}
      {projectId ? <label className="material-video-usage">项目用途<input aria-label={`${video.title} 的项目用途`} value={assignments(video).find(item => item.projectId === projectId)?.usage || ''} placeholder="例如：参考人物动作" maxLength={200} onChange={e => apply(() => attach(video.id, projectId, e.target.value))} /></label> : <div className="material-video-assignment-list">{assignments(video).filter(link => projects.some(project => project.id === link.projectId)).map(link => <span key={link.projectId}>{projects.find(project => project.id === link.projectId)?.title}{link.usage ? ` · ${link.usage}` : ''}</span>)}{!assignments(video).some(link => projects.some(project => project.id === link.projectId)) && <span>待分配</span>}</div>}
      {!projectId && <MaterialAssignmentEditor projects={projects.filter(project => !assignments(video).some(item => item.projectId === project.id))} onAttach={(target, usage) => apply(() => { attach(video.id, target, usage); setNotice('已关联项目。'); })} />}
      {deleteId === video.id && <div className="material-video-delete-confirm"><p>删除这条素材？{assignments(video).length ? `会同时移除 ${assignments(video).length} 个项目引用。` : ''}</p><button type="button" onClick={() => apply(() => { update(current => current.filter(item => item.id !== video.id)); setDeleteId(''); setNotice('素材已删除。'); })}>确认删除素材</button><button type="button" onClick={() => setDeleteId('')}>取消删除</button></div>}
    </article>)}</div>
    {!visible.length && <p className="material-video-empty">{projectId ? '还没有引用素材，可以添加链接或从素材库选择。' : '暂无符合条件的素材。先粘贴链接保存。'}</p>}
  </section>;
}

function MaterialAssignmentEditor({ projects, onAttach }) {
  const [target, setTarget] = React.useState('');
  const [usage, setUsage] = React.useState('');
  return <details><summary>关联项目</summary><div className="material-video-existing"><select aria-label="选择素材关联项目" value={target} onChange={event => setTarget(event.target.value)}><option value="">{projects.length ? '选择项目' : '暂无可关联项目'}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select><input aria-label="关联项目用途" placeholder="用途（可选）" value={usage} onChange={event => setUsage(event.target.value)} maxLength={200} /><button type="button" disabled={!target || !projects.some(project => project.id === target)} onClick={() => { onAttach(target, usage.trim()); setTarget(''); setUsage(''); }}>关联素材</button></div></details>;
}
