import React from 'react';
import html from './benchmarkHub.html?raw';
import { loadBenchmarkHub, saveBenchmarkHub } from '../utils/benchmarkHubAdapter';
import { getVideoPrompt, saveVideoPrompt, resetVideoPrompt, parseVideoImport } from '../utils/videoImport';
import { MaterialVideosPanel } from './MaterialVideosPanel';
import { useMaterialProjects } from '../utils/materialVideos';

export function IntegratedBenchmarkLibrary({ onOpenBreakdown, onCreateProject }) {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showMaterials, setShowMaterials] = React.useState(false);
  const projects = useMaterialProjects();
  const hostKey = React.useRef(`benchmarkHost_${crypto.randomUUID().replaceAll('-', '')}`);
  React.useEffect(() => {
    window[hostKey.current] = {
      load: loadBenchmarkHub,
      getVideoPrompt, saveVideoPrompt, resetVideoPrompt, parseVideoImport,
      openMaterials() { setShowMaterials(true); },
      save(data) { try { return saveBenchmarkHub(data); } catch (e) { setError('保存失败，原数据已保留。请先导出备份，再检查浏览器存储空间。'); throw e; } },
      open(action, id, data) {
        const videos = saveBenchmarkHub(data);
        const video = videos.find(v => v.id === id);
        if (video) (action === 'deconstruct' ? onOpenBreakdown : onCreateProject)?.(video);
      },
      error(message) { setError(`对标库运行异常：${message}`); },
    };
    setReady(true);
    return () => { delete window[hostKey.current]; };
  }, [onOpenBreakdown, onCreateProject]);
  return <section aria-label="对标库" style={{ minWidth: 0, width: '100%' }}>
    {error && <p role="alert">{error}</p>}
    {showMaterials && <><nav className="material-library-tabs" aria-label="视频全景管理类型"><button type="button" aria-pressed="false" onClick={() => setShowMaterials(false)}>对标视频</button><button type="button" aria-pressed="true">素材视频</button></nav><MaterialVideosPanel projects={projects} /></>}
    {ready && <iframe name={hostKey.current} title="对标库工作区" srcDoc={html} style={{ display: showMaterials ? 'none' : 'block', width: '100%', height: 'calc(100dvh - 100px)', minHeight: 620, border: 0, borderRadius: 24 }} />}
  </section>;
}
