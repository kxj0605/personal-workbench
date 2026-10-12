import React from 'react';
import html from './benchmarkHub.html?raw';
import { loadBenchmarkHub, saveBenchmarkHub } from '../utils/benchmarkHubAdapter';
import { getVideoPrompt, saveVideoPrompt, resetVideoPrompt, parseVideoImport } from '../utils/videoImport';

export function IntegratedBenchmarkLibrary({ onOpenBreakdown, onCreateProject }) {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState('');
  const hostKey = React.useRef(`benchmarkHost_${crypto.randomUUID().replaceAll('-', '')}`);
  React.useEffect(() => {
    window[hostKey.current] = {
      load: loadBenchmarkHub,
      getVideoPrompt, saveVideoPrompt, resetVideoPrompt, parseVideoImport,
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
    {ready && <iframe name={hostKey.current} title="对标库工作区" srcDoc={html} style={{ display: 'block', width: '100%', height: 'calc(100dvh - 100px)', minHeight: 620, border: 0, borderRadius: 24 }} />}
  </section>;
}
