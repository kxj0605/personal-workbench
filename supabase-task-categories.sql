-- 任务分类：默认“生活”，允许每位用户填写任意自定义分类。
alter table public.tasks
  add column if not exists category text;

update public.tasks
set category = '生活'
where category is null or btrim(category) = '';

alter table public.tasks
  alter column category set default '生活';

alter table public.tasks
  alter column category set not null;

alter table public.tasks
  drop constraint if exists tasks_category_length;

alter table public.tasks
  add constraint tasks_category_length
  check (char_length(btrim(category)) between 1 and 16);
