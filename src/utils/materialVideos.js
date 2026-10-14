import React from 'react';

export const MATERIAL_VIDEOS_KEY = 'material-videos-v1';
const EVENT = 'material-videos-changed';
export const PROJECTS_CHANGED_EVENT = 'creator-projects-changed';

export function loadMaterialVideos() {
  const saved = JSON.parse(window.localStorage.getItem(MATERIAL_VIDEOS_KEY) || '[]');
  if (!Array.isArray(saved)) throw new Error('素材记录格式异常，请先备份浏览器数据。');
  return saved;
}

export function parseMaterialUrl(text) {
  const match = text.trim().match(/https?:\/\/[^\s<>"'，。！？；）】]+/i);
  if (!match) throw new Error('请填写 http 或 https 视频链接，也可以粘贴包含链接的分享文案。');
  const url = new URL(match[0]);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('请填写有效的视频链接。');
  url.hash = '';
  return url.href;
}

export function materialUrlKey(url) {
  const parsed = new URL(url);
  parsed.hash = '';
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => parsed.searchParams.delete(key));
  parsed.searchParams.sort();
  return parsed.href.replace(/\/$/, '');
}

export function useMaterialVideos() {
  const [videos, setVideos] = React.useState([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    const refresh = () => { try { setVideos(loadMaterialVideos()); setError(''); } catch (e) { setError(e.message); } };
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener(EVENT, refresh); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, []);
  const update = (updater) => {
    const next = updater(loadMaterialVideos());
    window.localStorage.setItem(MATERIAL_VIDEOS_KEY, JSON.stringify(next));
    setVideos(next);
    window.dispatchEvent(new Event(EVENT));
  };
  return { videos, update, error };
}

export function useMaterialProjects() {
  const [projects, setProjects] = React.useState([]);
  React.useEffect(() => {
    const refresh = () => {
      try {
        const saved = JSON.parse(window.localStorage.getItem('creator-growth-dashboard-v1') || '{}');
        setProjects(Array.isArray(saved.projects) ? saved.projects : []);
      } catch { setProjects([]); }
    };
    refresh();
    window.addEventListener(PROJECTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener(PROJECTS_CHANGED_EVENT, refresh); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, []);
  return projects;
}
