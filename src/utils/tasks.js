import { formatDate, formatTime, getToday } from './date';

export function getLabel(options, value) {
  return options.find((item) => item.value === value)?.label ?? value;
}

export function getTaskListEmptyText(statusFilter, matrixFilter, categoryFilter = 'all') {
  if (statusFilter === 'all' && matrixFilter === 'all' && categoryFilter === 'all') {
    return '还没有任务，先在左侧新增一条安排。';
  }

  return '没有符合当前筛选的任务，可以换个状态或程度看看。';
}

export function filterTasks(tasks, statusFilter = 'all', matrixFilter = 'all', categoryFilter = 'all') {
  return tasks.filter((task) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unfinished' && task.status !== 'completed') ||
      task.status === statusFilter;
    const matchesMatrix = matrixFilter === 'all' || task.matrix_category === matrixFilter;
    const matchesCategory = categoryFilter === 'all' || (task.category || '生活') === categoryFilter;

    return matchesStatus && matchesMatrix && matchesCategory;
  });
}

export function isTaskOverdue(task) {
  if (!task.task_date || task.status === 'completed') return false;

  const dueDate = getTaskDueDate(task);
  const today = getToday();
  if (dueDate < today) return true;
  if (dueDate > today) return false;
  if (!task.task_time) return false;

  return new Date(`${dueDate}T${task.task_time}`).getTime() < Date.now();
}

export function getTaskTimingInfo(task) {
  const timeText = formatTime(task.task_time);
  const dueDate = getTaskDueDate(task);
  const isCrossDayTask = dueDate > task.task_date;
  const dateRangeText = isCrossDayTask ? `${formatDate(task.task_date)} 至 ${formatDate(dueDate)}` : formatDate(task.task_date);

  if (isTaskOverdue(task)) {
    const dateText = dueDate === getToday() ? '今天' : formatDate(dueDate);
    return {
      className: 'tag timing-overdue',
      label: `${dateText}${timeText ? ` ${timeText}` : ''} · 已逾期`,
    };
  }

  if (task.status !== 'completed' && task.task_date <= getToday() && dueDate >= getToday()) {
    return {
      className: 'tag timing-today',
      label: isCrossDayTask ? `进行中 · 至 ${formatDate(dueDate)}` : `今天${timeText ? ` · ${timeText}` : ''}`,
    };
  }

  return {
    className: 'tag',
    label: `${dateRangeText}${timeText ? ` ${timeText}` : ''}`,
  };
}

function getTaskDueDate(task) {
  return task.end_date && task.end_date >= task.task_date ? task.end_date : task.task_date;
}

export function sortTasks(a, b) {
  const priorityA = getTaskSortPriority(a);
  const priorityB = getTaskSortPriority(b);
  if (priorityA !== priorityB) return priorityA - priorityB;

  return `${a.task_date}${a.task_time ?? ''}`.localeCompare(`${b.task_date}${b.task_time ?? ''}`);
}

function getTaskSortPriority(task) {
  if (task.status === 'completed') return 4;
  if (isTaskOverdue(task)) return 1;
  if (task.task_date === getToday()) return 2;
  return 3;
}
