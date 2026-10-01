-- 普通任务跨天：开始日期继续使用 task_date，结束日期可留空。
alter table public.tasks
  add column if not exists end_date date;

-- 日历事件编辑卡：开始时间继续使用 task_time，补充可选结束时间。
alter table public.tasks
  add column if not exists end_time time;

alter table public.tasks
  drop constraint if exists tasks_end_date_after_start;

alter table public.tasks
  add constraint tasks_end_date_after_start
  check (end_date is null or end_date >= task_date);
