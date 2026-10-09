import React from 'react';

const EMOJI_TIME_PATTERN = /^(\d+):(\d{1,2})$/;

function parseDraftTime(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(EMOJI_TIME_PATTERN);
  if (!match || Number(match[2]) > 59) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function getEmotionTime(node, entries, index, nodes) {
  const linked = entries.find((entry) => entry.id === node.linkedEntryId);
  if (linked) return linked.end !== null && linked.end > linked.start ? linked.end : linked.start;
  const previousEnd = index > 0 ? nodes[index - 1]?.endTime : null;
  return parseDraftTime(node.endTime) ?? parseDraftTime(node.startTime) ?? parseDraftTime(previousEnd) ?? 0;
}

function toPrototypeStore({ entries, types, duration, emotionNodes, hasEditedEmotionCurve }) {
  const typeById = new Map(types.map((type) => [type.id, type]));
  const pointEvents = [];
  const rangeEvents = [];
  entries.forEach((entry) => {
    const type = typeById.get(entry.typeId);
    const common = {
      id: entry.id,
      title: entry.title || '',
      type: type?.label || '未分类',
      typeId: entry.typeId,
      color: entry.color || type?.color || '#3976d5',
      note: entry.description || '',
      tags: entry.tags || '',
      takeaway: entry.takeaway || '',
    };
    if (entry.end !== null && Number(entry.end) > Number(entry.start)) {
      rangeEvents.push({ ...common, startTime: entry.start, endTime: entry.end });
    } else {
      pointEvents.push({ ...common, time: entry.start });
    }
  });
  const emotions = hasEditedEmotionCurve ? emotionNodes.map((node, index) => ({
    id: node.id,
    time: getEmotionTime(node, entries, index, emotionNodes),
    value: Number(node.level) || 0,
    feeling: node.idea || '',
    linkedEventId: entries.some((entry) => entry.id === node.linkedEntryId) ? node.linkedEntryId : null,
  })) : [];
  const latestTime = Math.max(0, ...pointEvents.map((item) => item.time), ...rangeEvents.map((item) => item.endTime), ...emotions.map((item) => item.time));
  return { duration: Math.max(10, Number(duration) || 60, latestTime), emotions, pointEvents, rangeEvents };
}

function fromPrototypeStore(store, previous) {
  const oldEntryById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  const oldNodeById = new Map(previous.emotionNodes.map((node) => [node.id, node]));
  const originalTypeById = new Map(previous.types.map((type) => [type.id, type]));
  const nextTypes = [...previous.types];
  const resolveTypeId = (item, oldEntry) => {
    const originalType = originalTypeById.get(oldEntry?.typeId);
    if (oldEntry && item.type === (originalType?.label || '未分类')) return oldEntry.typeId;
    const matching = nextTypes.find((type) => type.label === item.type);
    if (matching) return matching.id;
    const customId = `timeline-${item.id}`;
    const custom = nextTypes.find((type) => type.id === customId);
    if (custom) custom.label = item.type || '未分类';
    else nextTypes.push({ id: customId, group: '自定义类型', label: item.type || '未分类', color: item.color || '#3976d5' });
    return customId;
  };
  const toEntry = (item, isRange) => {
    const old = oldEntryById.get(item.id);
    const preserveLegacyEnd = !isRange && old && old.end !== null && Number(old.end) <= Number(old.start) && Number(item.time) === Number(old.start);
    return {
      ...old,
      id: String(item.id),
      typeId: resolveTypeId(item, old),
      start: isRange ? Number(item.startTime) : Number(item.time),
      end: isRange ? Number(item.endTime) : (preserveLegacyEnd ? old.end : null),
      title: item.title || '',
      description: item.note || '',
      tags: item.tags || '',
      takeaway: item.takeaway || '',
      color: item.color || '',
    };
  };
  const entries = [
    ...store.pointEvents.map((item) => toEntry(item, false)),
    ...store.rangeEvents.map((item) => toEntry(item, true)),
  ];
  const emotionNodes = store.emotions.map((item) => {
    const old = oldNodeById.get(item.id);
    const linkedEntry = entries.find((entry) => entry.id === item.linkedEventId);
    const previousTime = old ? getEmotionTime(old, previous.entries, previous.emotionNodes.findIndex((node) => node.id === old.id), previous.emotionNodes) : null;
    const shouldUpdateTime = !old || previousTime !== Number(item.time) || old.linkedEntryId !== (linkedEntry?.id || null);
    return {
      ...(old || { endTime: '', phase: '', range: '' }),
      id: Number(item.id),
      linkedEntryId: linkedEntry?.id || null,
      startTime: shouldUpdateTime ? formatTime(item.time) : old.startTime,
      endTime: shouldUpdateTime && old?.endTime ? formatTime(item.time) : (old?.endTime || ''),
      idea: item.feeling || '',
      level: Number(item.value) || 0,
    };
  });
  return { entries, types: nextTypes, duration: Number(store.duration), emotionNodes };
}

export default function EmbeddedVideoTimeline({ entries, types, duration, emotionNodes, hasEditedEmotionCurve, onEntriesChange, onTypesChange, onDurationChange, onEmotionNodesChange }) {
  const frameRef = React.useRef(null);
  const latestRef = React.useRef(null);
  const [height, setHeight] = React.useState(650);
  latestRef.current = { entries, types, duration, emotionNodes, hasEditedEmotionCurve, onEntriesChange, onTypesChange, onDurationChange, onEmotionNodesChange };

  React.useEffect(() => {
    const sendInitialStore = () => {
      const frameWindow = frameRef.current?.contentWindow;
      if (frameWindow) frameWindow.postMessage({ type: 'video-timeline:init', store: toPrototypeStore(latestRef.current) }, '*');
    };
    const handleMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'video-timeline:ready') sendInitialStore();
      if (event.data?.type === 'video-timeline:height' && Number.isFinite(event.data.height)) {
        setHeight(Math.max(480, Math.min(1800, event.data.height)));
      }
      if (event.data?.type === 'video-timeline:change') {
        const store = event.data.store;
        if (!store || !Array.isArray(store.emotions) || !Array.isArray(store.pointEvents) || !Array.isArray(store.rangeEvents)) return;
        const previous = latestRef.current;
        const next = fromPrototypeStore(store, previous);
        previous.onEntriesChange(next.entries);
        previous.onTypesChange(next.types);
        previous.onDurationChange(next.duration);
        previous.onEmotionNodesChange(next.emotionNodes);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const initialStore = toPrototypeStore({ entries, types, duration, emotionNodes, hasEditedEmotionCurve });
  const emotionTimes = initialStore.emotions.map((emotion) => emotion.time);
  const pointTimes = initialStore.pointEvents.map((point) => point.time);
  const hasLegacyCollision = new Set(emotionTimes).size < emotionTimes.length || new Set(pointTimes).size < pointTimes.length;

  return <section className="embedded-video-timeline" id="script-breakdown-timeline" aria-label="视频脚本拆解时间轴" style={{ width: '100%', minWidth: 0 }}>
    {hasLegacyCollision && <p className="embedded-video-timeline-warning" role="status" style={{ margin: '0 0 8px', padding: '8px 12px', borderRadius: 8, background: '#fff2de', color: '#8a5300', fontSize: 12 }}>旧草稿中有同一区域同一秒的节点；现有数据已原样保留。请逐个调整冲突时间后再新增关联。</p>}
    <iframe
      ref={frameRef}
      src="/video-timeline-embed.html?embedded=1"
      title="视频脚本拆解时间轴"
      sandbox="allow-scripts"
      style={{ width: '100%', height, border: 0, display: 'block' }}
    />
  </section>;
}
