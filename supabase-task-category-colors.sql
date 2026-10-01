-- 任务分类配置：每位用户最多 4 个；颜色用于日历筛选和日程标记。
alter table public.tasks
  add column if not exists category text;

update public.tasks
set category = '生活'
where category is null or btrim(category) = '';

with ranked_categories as (
  select user_id, category, dense_rank() over (partition by user_id order by count(*) desc, category) as category_rank
  from public.tasks
  group by user_id, category
)
update public.tasks as task
set category = '其他'
from ranked_categories
where task.user_id = ranked_categories.user_id
  and task.category = ranked_categories.category
  and ranked_categories.category_rank > 3;

create table if not exists public.task_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 16),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order smallint not null default 0,
  unique (user_id, name)
);

with ranked_categories as (
  select user_id, category, row_number() over (partition by user_id order by category) - 1 as sort_order
  from (select distinct user_id, category from public.tasks) as categories
)
insert into public.task_categories (user_id, name, color, sort_order)
select user_id,
  category,
  case sort_order when 0 then '#12b76a' when 1 then '#2f80ed' when 2 then '#f2b200' else '#9b51e0' end,
  sort_order
from ranked_categories
on conflict (user_id, name) do nothing;

alter table public.task_categories enable row level security;

drop policy if exists "Users can manage their task categories" on public.task_categories;
create policy "Users can manage their task categories"
  on public.task_categories for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.enforce_task_category_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.task_categories where user_id = new.user_id) >= 4 then
    raise exception '每位用户最多只能创建 4 个任务分类';
  end if;
  return new;
end;
$$;

drop trigger if exists task_category_limit on public.task_categories;
create trigger task_category_limit
  before insert on public.task_categories
  for each row execute function public.enforce_task_category_limit();
