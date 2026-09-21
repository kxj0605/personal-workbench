import React from 'react';
import { CheckCircle2, Coffee, History, Pause, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import { CREATOR_DASHBOARD_STORAGE_KEY, PROJECT_STAGES } from './CreatorDashboard';
import { FOCUS_TIMER_RECORDS_KEY } from '../utils/focusTimerRecords';
import './FocusTimerCard.css';

const FOCUS_TIMER_SESSION_KEY = 'personal-workbench-focus-timer-session-v1';

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function readCreatorProjects() {
  const data = readStorage(CREATOR_DASHBOARD_STORAGE_KEY, {});
  return Array.isArray(data?.projects) ? data.projects : [];
}

function getProjectStageSelectionKey(projectId, stageId) {
  return `${projectId}:${stageId}`;
}

function formatElapsed(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatClockTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatClockDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatRecordTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getElapsedSeconds(session, now = Date.now()) {
  if (!session) return 0;
  if (session.status !== 'running') return session.elapsedSeconds || 0;
  const resumedAt = new Date(session.resumedAt).getTime();
  return Math.max(0, (session.elapsedSeconds || 0) + Math.floor((now - resumedAt) / 1000));
}

function createSession({ taskId = null, taskName, durationMinutes, note = '', isBreak = false, mode = 'focus', projectId = null, projectTitle = '', projectStage = '', projectStageLabel = '' }) {
  const startedAt = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId,
    taskName: taskName.trim() || (isBreak ? '休息' : '未命名专注'),
    durationMinutes,
    note,
    projectId,
    projectTitle,
    projectStage,
    projectStageLabel,
    isBreak,
    mode,
    status: 'running',
    startedAt,
    resumedAt: startedAt,
    elapsedSeconds: 0,
  };
}

function getPomodoroPhaseLabel(phase) {
  if (phase === 'short-break') return '短休息';
  if (phase === 'long-break') return '长休息';
  return '专注';
}

function createPomodoroSession({ taskId = null, taskName, note = '', phase = 'focus', round = 1, longBreakMinutes = 15, projectId = null, projectTitle = '', projectStage = '', projectStageLabel = '' }) {
  const durationMinutes = phase === 'focus' ? 25 : (phase === 'short-break' ? 5 : longBreakMinutes);
  return {
    ...createSession({ taskId, taskName, durationMinutes, note, isBreak: phase !== 'focus', mode: 'pomodoro', projectId, projectTitle, projectStage, projectStageLabel }),
    pomodoroPhase: phase,
    pomodoroRound: round,
    pomodoroLongBreakMinutes: longBreakMinutes,
  };
}

function createTimerRecord(session, pomodoroOutcome) {
  return {
    id: session.id,
    taskId: session.taskId,
    taskName: session.taskName,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    totalSeconds: getElapsedSeconds(session),
    note: session.note.trim(),
    projectId: session.projectId,
    projectTitle: session.projectTitle,
    projectStage: session.projectStage,
    projectStageLabel: session.projectStageLabel,
    isBreak: session.isBreak,
    mode: session.mode || 'focus',
    pomodoroPhase: session.pomodoroPhase,
    pomodoroRound: session.pomodoroRound,
    pomodoroOutcome,
  };
}

function getRecordModeLabel(record) {
  if (record.mode === 'pomodoro') return `番茄·${getPomodoroPhaseLabel(record.pomodoroPhase)}`;
  return record.mode === 'free' ? '自由计时' : '专注模式';
}

function getPomodoroOutcome(record) {
  if (record.mode !== 'pomodoro' || record.pomodoroPhase !== 'focus') return null;
  return record.pomodoroOutcome === 'completed' ? 'completed' : (record.pomodoroOutcome === 'interrupted' ? 'interrupted' : null);
}

function TomatoIcon({ outcome, size = 18 }) {
  const isGoodTomato = outcome === 'completed';
  return <svg className={`pomodoro-tomato-icon ${isGoodTomato ? 'good' : 'bad'}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path className="tomato-fruit" d="M5.2 12.1C5.2 8.1 8.1 5.8 12 5.8s6.8 2.3 6.8 6.3c0 4.3-2.7 7.2-6.8 7.2s-6.8-2.9-6.8-7.2Z" />
    <path className="tomato-leaf" d="M12 6.2 9.1 3.8l.9 2.9L7.1 6l2.4 2.1M12 6.2l2.9-2.4-.9 2.9 2.9-.7-2.4 2.1" />
    {!isGoodTomato && <path className="tomato-crack" d="m11.1 9.2 1.4 2-1.2 1.6 1.5 2.1-1.1 1.8" />}
  </svg>;
}

export function FocusTimerCard({ tasks, onCompleteTask }) {
  const [records, setRecords] = React.useState(() => {
    const saved = readStorage(FOCUS_TIMER_RECORDS_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [session, setSession] = React.useState(() => readStorage(FOCUS_TIMER_SESSION_KEY, null));
  const [now, setNow] = React.useState(Date.now());
  const [durationMinutes, setDurationMinutes] = React.useState(25);
  const [customMinutes, setCustomMinutes] = React.useState('');
  const [pomodoroLongBreakMinutes, setPomodoroLongBreakMinutes] = React.useState(15);
  const [timerMode, setTimerMode] = React.useState('focus');
  const [taskId, setTaskId] = React.useState('');
  const [taskName, setTaskName] = React.useState('');
  const [note, setNote] = React.useState('');
  const [projectStageSelection, setProjectStageSelection] = React.useState('');
  const [creatorProjects, setCreatorProjects] = React.useState(readCreatorProjects);
  const [taskFilter, setTaskFilter] = React.useState('all');
  const [modeFilter, setModeFilter] = React.useState('all');
  const [completion, setCompletion] = React.useState(null);

  const availableTasks = tasks.filter((task) => task.status !== 'completed');
  const elapsedSeconds = getElapsedSeconds(session, now);
  const isRunning = session?.status === 'running';
  const isActive = Boolean(session);
  const activeMode = session?.mode || timerMode;
  const isFocusMode = activeMode === 'focus';
  const isPomodoroMode = activeMode === 'pomodoro';
  const isClockMode = activeMode === 'clock';
  const durationSeconds = (session?.durationMinutes || durationMinutes) * 60;
  const displaySeconds = (isFocusMode || isPomodoroMode) ? Math.max(0, durationSeconds - elapsedSeconds) : elapsedSeconds;
  const pomodoroFocusRecords = records.filter((record) => getPomodoroOutcome(record));
  const projectStageOptions = creatorProjects.flatMap((project) => PROJECT_STAGES.map((stage) => ({
    selectionKey: getProjectStageSelectionKey(project.id, stage.id),
    projectId: project.id,
    projectTitle: project.title,
    projectStage: stage.id,
    projectStageLabel: stage.label,
  })));

  React.useEffect(() => {
    const needsClockTick = isRunning || (!isActive && timerMode === 'clock');
    if (!needsClockTick) return undefined;
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [isActive, isRunning, timerMode]);

  React.useEffect(() => {
    const refreshCreatorProjects = () => setCreatorProjects(readCreatorProjects());
    window.addEventListener('storage', refreshCreatorProjects);
    window.addEventListener('focus', refreshCreatorProjects);
    return () => {
      window.removeEventListener('storage', refreshCreatorProjects);
      window.removeEventListener('focus', refreshCreatorProjects);
    };
  }, []);

  React.useEffect(() => {
    try {
      if (session) window.localStorage.setItem(FOCUS_TIMER_SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(FOCUS_TIMER_SESSION_KEY);
    } catch {
      // 本地存储不可用时，计时仍可在当前页面使用。
    }
  }, [session]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(FOCUS_TIMER_RECORDS_KEY, JSON.stringify(records));
    } catch {
      // 本地存储不可用时，记录仍保留到本次页面会话结束。
    }
  }, [records]);

  const finishSession = React.useCallback(() => {
    if (!session) return;
    const pomodoroOutcome = session.mode === 'pomodoro' && session.pomodoroPhase === 'focus'
      ? (getElapsedSeconds(session) >= session.durationMinutes * 60 ? 'completed' : 'interrupted')
      : undefined;
    const record = createTimerRecord(session, pomodoroOutcome);
    setRecords((current) => [record, ...current]);
    setCompletion(record);
    setSession(null);
    setNow(Date.now());
  }, [session]);

  const advancePomodoro = React.useCallback(() => {
    if (!session) return;
    const record = createTimerRecord(session, session.pomodoroPhase === 'focus' ? 'completed' : undefined);
    const currentRound = session.pomodoroRound || 1;
    const longBreakMinutes = session.pomodoroLongBreakMinutes || pomodoroLongBreakMinutes;
    let nextPhase = 'focus';
    let nextRound = currentRound;
    if (session.pomodoroPhase === 'focus') {
      nextPhase = currentRound >= 4 ? 'long-break' : 'short-break';
    } else if (session.pomodoroPhase === 'short-break') {
      nextRound = currentRound + 1;
    } else {
      nextRound = 1;
    }
    setRecords((current) => [record, ...current]);
    setSession(createPomodoroSession({
      taskId: session.taskId,
      taskName: session.taskName,
      note: session.note,
      projectId: session.projectId,
      projectTitle: session.projectTitle,
      projectStage: session.projectStage,
      projectStageLabel: session.projectStageLabel,
      phase: nextPhase,
      round: nextRound,
      longBreakMinutes,
    }));
    setNow(Date.now());
  }, [pomodoroLongBreakMinutes, session]);

  React.useEffect(() => {
    if (!isRunning || elapsedSeconds < durationSeconds) return;
    if (isPomodoroMode) advancePomodoro();
    else if (isFocusMode) finishSession();
  }, [advancePomodoro, durationSeconds, elapsedSeconds, finishSession, isFocusMode, isPomodoroMode, isRunning]);

  function selectTask(nextTaskId) {
    setTaskId(nextTaskId);
    const selectedTask = availableTasks.find((task) => String(task.id) === nextTaskId);
    if (selectedTask) setTaskName(selectedTask.title);
  }

  function selectMode(nextMode) {
    setTimerMode(nextMode);
    setCompletion(null);
    setNow(Date.now());
  }

  function selectDuration(minutes) {
    setDurationMinutes(minutes);
    setCustomMinutes('');
  }

  function setCustomDuration(value) {
    setCustomMinutes(value);
    const minutes = Number(value);
    if (Number.isInteger(minutes) && minutes >= 1) setDurationMinutes(minutes);
  }

  function startTimer() {
    if (session?.status === 'paused') {
      setSession((current) => ({ ...current, status: 'running', resumedAt: new Date().toISOString() }));
      setNow(Date.now());
      return;
    }
    setCompletion(null);
    const selectedProjectStage = projectStageOptions.find((option) => option.selectionKey === projectStageSelection);
    setSession(timerMode === 'pomodoro'
      ? createPomodoroSession({ taskId: taskId || null, taskName, note, longBreakMinutes: pomodoroLongBreakMinutes, ...selectedProjectStage })
      : createSession({ taskId: taskId || null, taskName, durationMinutes, note, mode: timerMode, ...selectedProjectStage }));
    setNow(Date.now());
  }

  function pauseTimer() {
    setSession((current) => current ? { ...current, status: 'paused', elapsedSeconds: getElapsedSeconds(current) } : current);
    setNow(Date.now());
  }

  function resetTimer() {
    if (session?.mode === 'pomodoro' && session.pomodoroPhase === 'focus') {
      const record = createTimerRecord(session, 'interrupted');
      setRecords((current) => [record, ...current]);
      setCompletion(record);
    }
    setSession(null);
    setNow(Date.now());
  }

  function startBreak() {
    const record = completion;
    setCompletion(null);
    setDurationMinutes(5);
    setTaskId('');
    setTaskName('休息');
    setNote('');
    setProjectStageSelection(record?.projectId && record?.projectStage ? getProjectStageSelectionKey(record.projectId, record.projectStage) : '');
    setSession(createSession({ taskName: '休息', durationMinutes: 5, isBreak: true, mode: 'focus', projectId: record?.projectId, projectTitle: record?.projectTitle, projectStage: record?.projectStage, projectStageLabel: record?.projectStageLabel }));
    setNow(Date.now());
  }

  function startAnotherFocus() {
    const record = completion;
    setCompletion(null);
    const nextMode = record?.mode === 'pomodoro' ? 'pomodoro' : (record?.isBreak ? 'focus' : (record?.mode || 'focus'));
    setTimerMode(nextMode);
    setDurationMinutes(25);
    setCustomMinutes('');
    const keepRecordTask = record?.mode === 'pomodoro' || !record?.isBreak;
    setTaskId(keepRecordTask && record?.taskId ? String(record.taskId) : '');
    setTaskName(keepRecordTask ? (record?.taskName || taskName) : '');
    setNote('');
    setProjectStageSelection(record?.projectId && record?.projectStage ? getProjectStageSelectionKey(record.projectId, record.projectStage) : '');
    setSession(nextMode === 'pomodoro'
      ? createPomodoroSession({ taskId: record?.taskId, taskName: record?.taskName || taskName, longBreakMinutes: pomodoroLongBreakMinutes, projectId: record?.projectId, projectTitle: record?.projectTitle, projectStage: record?.projectStage, projectStageLabel: record?.projectStageLabel })
      : createSession({ taskId: record?.isBreak ? null : record?.taskId, taskName: record?.isBreak ? '' : (record?.taskName || taskName), durationMinutes: 25, mode: nextMode, projectId: record?.isBreak ? null : record?.projectId, projectTitle: record?.isBreak ? '' : record?.projectTitle, projectStage: record?.isBreak ? '' : record?.projectStage, projectStageLabel: record?.isBreak ? '' : record?.projectStageLabel }));
    setNow(Date.now());
  }

  function completeLinkedTask() {
    const linkedTask = tasks.find((task) => String(task.id) === String(completion?.taskId));
    if (linkedTask && linkedTask.status !== 'completed') onCompleteTask(linkedTask);
    setCompletion(null);
  }

  function deleteRecord(recordId) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
  }

  const taskNames = [...new Set(records.map((record) => record.taskName))];
  const visibleRecords = records.filter((record) => (
    (taskFilter === 'all' || record.taskName === taskFilter)
    && (modeFilter === 'all' || (record.mode || 'focus') === modeFilter)
  ));
  return (
    <section className={`focus-timer-card${isClockMode ? ' clock-mode' : ''}`} aria-label="专注计时">
      <div className="focus-timer-main">
        <div className="focus-timer-display" aria-live="polite">
          <strong>{isClockMode ? formatClockTime(now) : formatElapsed(displaySeconds)}</strong>
          {isClockMode && <span>{formatClockDate(now)}</span>}
          {!isClockMode && <div className="focus-timer-actions">
            <div className="focus-timer-primary-row">
              {!isRunning && <button className="focus-primary-action" type="button" onClick={startTimer}><Play size={17} />{session?.status === 'paused' ? '继续' : '开始'}</button>}
              {isRunning && <button className="focus-primary-action" type="button" onClick={pauseTimer}><Pause size={17} />暂停</button>}
            </div>
            <div className="focus-timer-secondary-row">
              {isActive && <><button className="focus-secondary-action" type="button" onClick={resetTimer}><RotateCcw size={16} />重置</button>
                <button className="focus-finish-action" type="button" onClick={finishSession}><Square size={15} />结束并保存</button></>}
            </div>
          </div>}
        </div>
        <div className="focus-timer-setup">
            <div className="focus-mode-options" aria-label="选择计时模式">
              <button type="button" className={activeMode === 'focus' ? 'active' : ''} onClick={() => selectMode('focus')} disabled={isActive} title={isActive ? '结束当前计时后才能切换模式' : undefined}>专注模式</button>
              <button type="button" className={activeMode === 'pomodoro' ? 'active' : ''} onClick={() => selectMode('pomodoro')} disabled={isActive} title={isActive ? '结束当前计时后才能切换模式' : undefined}>番茄钟</button>
              <button type="button" className={activeMode === 'free' ? 'active' : ''} onClick={() => selectMode('free')} disabled={isActive} title={isActive ? '结束当前计时后才能切换模式' : undefined}>计时模式</button>
              <button type="button" className={activeMode === 'clock' ? 'active' : ''} onClick={() => selectMode('clock')} disabled={isActive} title={isActive ? '结束当前计时后才能切换模式' : undefined}>时钟</button>
            </div>
            {!isClockMode && (isPomodoroMode ? <p className={`focus-mode-description focus-pomodoro-status ${session?.pomodoroPhase || 'focus'}`}><span>{isActive ? `第 ${session.pomodoroRound || 1} 轮` : '第 1 轮'}</span><strong>{isActive ? `${getPomodoroPhaseLabel(session.pomodoroPhase)}中` : '准备开始 · 专注'}</strong></p> : <p className="focus-mode-description">{isActive ? (session.isBreak ? '5 分钟休息' : (isFocusMode ? `${session.durationMinutes} 分钟倒计时` : '自由计时 · 手动结束')) : (isFocusMode ? `${durationMinutes} 分钟倒计时` : '自由计时 · 手动结束')}</p>)}
            {!isActive && timerMode === 'focus' && <div className="focus-duration-options" aria-label="选择专注时长">
              {[25, 45, 60].map((minutes) => <button type="button" className={durationMinutes === minutes ? 'active' : ''} onClick={() => selectDuration(minutes)} key={minutes}>{minutes} 分钟</button>)}
              <label className="focus-custom-duration"><input type="number" min="1" step="1" inputMode="numeric" value={customMinutes} onChange={(event) => setCustomDuration(event.target.value)} placeholder="自定义" aria-label="自定义专注时长（分钟）" />分钟</label>
            </div>}
            {!isActive && timerMode === 'pomodoro' && <div className="focus-duration-options" aria-label="选择番茄钟长休息时长">
              <span className="focus-duration-label">长休息</span>
              {[15, 20, 25, 30].map((minutes) => <button type="button" className={pomodoroLongBreakMinutes === minutes ? 'active' : ''} onClick={() => setPomodoroLongBreakMinutes(minutes)} key={minutes}>{minutes} 分钟</button>)}
            </div>}
            {!isActive && timerMode !== 'clock' && <><label className="focus-field">关联待办（可选）
              <select value={taskId} onChange={(event) => selectTask(event.target.value)}>
                <option value="">不关联待办</option>
                {availableTasks.map((task) => <option value={task.id} key={task.id}>{task.title}</option>)}
              </select>
            </label>
            <label className="focus-field">任务名
              <input value={taskName} onChange={(event) => { setTaskName(event.target.value); setTaskId(''); }} placeholder="例如：整理视频脚本" />
            </label>
            {creatorProjects.length > 0 && <label className="focus-field focus-project-stage-field">关联项目阶段（可选）
              <select value={projectStageSelection} onChange={(event) => setProjectStageSelection(event.target.value)}>
                <option value="">不关联项目阶段</option>
                {creatorProjects.map((project) => <optgroup label={project.title} key={project.id}>{PROJECT_STAGES.map((stage) => <option value={getProjectStageSelectionKey(project.id, stage.id)} key={stage.id}>{stage.label}</option>)}</optgroup>)}
              </select>
            </label>}
            <label className="focus-field focus-note-field">备注（可选）
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录这段专注的产出" />
            </label></>}
          </div>
        {isActive && <p className="focus-timer-task">{session.isBreak ? (isPomodoroMode ? `${getPomodoroPhaseLabel(session.pomodoroPhase)}中` : '休息中') : `专注任务：${session.taskName}`} {session.projectTitle && <span>· 项目：{session.projectTitle} · {session.projectStageLabel}</span>}{session.note && <span>· {session.note}</span>}</p>}
      </div>

      {!isClockMode && completion && (
        <div className={`focus-completion${getPomodoroOutcome(completion) ? ` ${getPomodoroOutcome(completion)}` : ''}`} role="status">
          <div><strong>{getPomodoroOutcome(completion) === 'completed' ? '收获一个好番茄' : (getPomodoroOutcome(completion) === 'interrupted' ? '记下一个坏番茄' : (completion.isBreak ? '休息结束' : '本轮已保存'))}</strong><span>{completion.taskName} · {formatElapsed(completion.totalSeconds)}</span>{completion.projectTitle && <span>项目：{completion.projectTitle} · {completion.projectStageLabel}</span>}</div>
          <div className="focus-completion-actions">
            {!completion.isBreak && completion.taskId && <button type="button" onClick={completeLinkedTask}><CheckCircle2 size={15} />完成此待办</button>}
            {!completion.isBreak && completion.mode !== 'pomodoro' && <button type="button" onClick={startBreak}><Coffee size={15} />休息 5 分钟</button>}
            <button type="button" onClick={startAnotherFocus}><Play size={15} />{completion.mode === 'pomodoro' ? '开始番茄钟' : (completion.mode === 'free' ? '继续自由' : '再专注')}</button>
          </div>
        </div>
      )}

      {!isClockMode && <div className="focus-history">
        <div className="focus-history-heading"><div><History size={17} /><h3>计时记录</h3></div><span className="focus-history-filters"><select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} aria-label="按任务筛选计时记录"><option value="all">全部任务</option>{taskNames.map((name) => <option value={name} key={name}>{name}</option>)}</select><select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} aria-label="按模式筛选计时记录"><option value="all">全部模式</option><option value="focus">专注模式</option><option value="pomodoro">番茄钟</option><option value="free">自由计时</option></select></span></div>
        {isPomodoroMode && <div className="pomodoro-harvest" aria-label="番茄收获记录"><span>番茄收获</span>{pomodoroFocusRecords.length ? <div className="pomodoro-tomato-list">{pomodoroFocusRecords.map((record) => { const outcome = getPomodoroOutcome(record); return <span className={`pomodoro-tomato ${outcome}`} key={record.id} title={outcome === 'completed' ? '好番茄：完整完成一轮专注' : '坏番茄：提前结束本轮专注'}><TomatoIcon outcome={outcome} /><span className="sr-only">{outcome === 'completed' ? '好番茄' : '坏番茄'}</span></span>; })}</div> : <small>完成或中断一轮专注后，会在这里留下番茄。</small>}</div>}
        {visibleRecords.length ? <div className="focus-record-list">{visibleRecords.map((record) => { const outcome = getPomodoroOutcome(record); return <article className="focus-record" key={record.id}><div><strong>{record.taskName}<em className={(record.mode || 'focus') === 'free' ? 'free' : ((record.mode || 'focus') === 'pomodoro' ? 'pomodoro' : '')}>{getRecordModeLabel(record)}</em>{outcome && <i className={`pomodoro-record-outcome ${outcome}`}><TomatoIcon outcome={outcome} size={15} />{outcome === 'completed' ? '好番茄' : '坏番茄'}</i>}</strong><span>{formatRecordTime(record.startedAt)} — {formatRecordTime(record.endedAt)}</span>{record.projectTitle && <small>项目：{record.projectTitle} · {record.projectStageLabel}</small>}{record.note && <small>{record.note}</small>}</div><div className="focus-record-meta"><b>{formatElapsed(record.totalSeconds)}</b><button type="button" onClick={() => deleteRecord(record.id)} aria-label={`删除 ${record.taskName} 的计时记录`} title="删除记录"><Trash2 size={16} /></button></div></article>; })}</div> : <p className="focus-history-empty">还没有符合筛选条件的计时记录。</p>}
      </div>}
    </section>
  );
}
