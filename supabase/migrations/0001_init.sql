-- 深教考通 Supabase 初始化迁移
-- 执行前请确认当前项目启用了 Supabase Auth。客户端只允许使用 anon key。

create extension if not exists pgcrypto;

create type public.node_status as enum ('locked', 'available', 'in_progress', 'done', 'archived');
create type public.schedule_mode as enum ('serial', 'parallel');
create type public.action_type as enum ('objective', 'recite', 'comprehensive', 'interview_checklist');
create type public.review_priority as enum ('P0', 'P1', 'P2');

create table public.catalog_options (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references public.catalog_options(id) on delete cascade,
    kind text not null check (kind in ('region', 'subject', 'exam_category')),
    title text not null,
    order_index integer not null default 0,
    created_at timestamptz not null default now()
);

create table public.workspaces (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    region text not null,
    subject text not null,
    exam_category text not null,
    start_date date not null,
    exam_date date not null,
    target_minutes_per_day integer not null default 180 check (target_minutes_per_day > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.templates (
    id uuid primary key default gen_random_uuid(),
    region text not null,
    subject text not null,
    exam_category text not null,
    title text not null,
    version integer not null default 1,
    is_official boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.template_nodes (
    id uuid primary key default gen_random_uuid(),
    template_id uuid not null references public.templates(id) on delete cascade,
    parent_id uuid references public.template_nodes(id) on delete cascade,
    level integer not null check (level between 1 and 7),
    title text not null,
    description text,
    is_leaf boolean not null default false,
    order_index integer not null default 0,
    allocated_days integer,
    estimated_minutes integer,
    schedule_mode public.schedule_mode not null default 'serial',
    frequency_weight numeric(6, 3) not null default 1.000,
    tags text[] not null default '{}',
    created_at timestamptz not null default now()
);

create table public.nodes (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    parent_id uuid references public.nodes(id) on delete cascade,
    template_node_id uuid references public.template_nodes(id) on delete set null,
    level integer not null check (level between 1 and 7),
    title text not null,
    description text,
    is_leaf boolean not null default false,
    status public.node_status not null default 'locked',
    order_index integer not null default 0,
    allocated_days integer,
    estimated_minutes integer,
    schedule_mode public.schedule_mode not null default 'serial',
    frequency_weight numeric(6, 3) not null default 1.000,
    trap_memo text,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.study_logs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    node_id uuid references public.nodes(id) on delete set null,
    user_id uuid not null references auth.users(id) on delete cascade,
    action_type public.action_type not null,
    payload jsonb not null default '{}',
    duration_minutes integer not null default 0 check (duration_minutes >= 0),
    score numeric(6, 3) not null default 0,
    mastery numeric(6, 3) not null default 0,
    trap_memo text,
    created_at timestamptz not null default now()
);

create table public.node_reviews (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    node_id uuid not null references public.nodes(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    interval_index integer not null default 0,
    next_review_at timestamptz not null,
    last_reviewed_at timestamptz,
    priority public.review_priority not null default 'P1',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (node_id)
);

create table public.daily_checkins (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    checkin_date date not null,
    streak_days integer not null default 1 check (streak_days > 0),
    memo text not null default '',
    image_url text,
    created_at timestamptz not null default now(),
    unique (workspace_id, checkin_date)
);

create table public.interview_sessions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    duration_minutes integer not null default 0,
    status public.node_status not null default 'available',
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create table public.interview_checklist_items (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.interview_sessions(id) on delete cascade,
    title text not null,
    is_passed boolean not null default false,
    order_index integer not null default 0,
    created_at timestamptz not null default now()
);

create index idx_catalog_options_parent on public.catalog_options(parent_id, order_index);
create index idx_template_nodes_parent on public.template_nodes(template_id, parent_id, order_index);
create index idx_nodes_parent on public.nodes(workspace_id, parent_id, order_index);
create index idx_nodes_status on public.nodes(workspace_id, status, level);
create index idx_study_logs_workspace_day on public.study_logs(workspace_id, created_at);
create index idx_node_reviews_due on public.node_reviews(workspace_id, next_review_at, priority);
create index idx_daily_checkins_workspace_day on public.daily_checkins(workspace_id, checkin_date);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_workspaces_touch
before update on public.workspaces
for each row execute function public.touch_updated_at();

create trigger trg_nodes_touch
before update on public.nodes
for each row execute function public.touch_updated_at();

create trigger trg_node_reviews_touch
before update on public.node_reviews
for each row execute function public.touch_updated_at();

create or replace function public.clone_template(p_template_id uuid, p_workspace_id uuid)
returns setof public.nodes
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_template_owner_ok boolean;
begin
    select exists (
        select 1
        from public.workspaces
        where id = p_workspace_id
          and user_id = v_user_id
    ) into v_template_owner_ok;

    if not v_template_owner_ok then
        raise exception 'workspace not found or permission denied';
    end if;

    create temp table if not exists pg_temp.clone_node_map (
        template_node_id uuid primary key,
        node_id uuid not null
    ) on commit drop;

    delete from pg_temp.clone_node_map;

    insert into pg_temp.clone_node_map (template_node_id, node_id)
    select id, gen_random_uuid()
    from public.template_nodes
    where template_id = p_template_id;

    insert into public.nodes (
        id,
        workspace_id,
        parent_id,
        template_node_id,
        level,
        title,
        description,
        is_leaf,
        status,
        order_index,
        allocated_days,
        estimated_minutes,
        schedule_mode,
        frequency_weight
    )
    select
        map.node_id,
        p_workspace_id,
        parent_map.node_id,
        tn.id,
        tn.level,
        tn.title,
        tn.description,
        tn.is_leaf,
        case
            when tn.parent_id is null then 'available'::public.node_status
            when not exists (
                select 1
                from public.template_nodes siblings
                where siblings.parent_id is not distinct from tn.parent_id
                  and siblings.template_id = tn.template_id
                  and siblings.order_index < tn.order_index
            ) then 'available'::public.node_status
            else 'locked'::public.node_status
        end,
        tn.order_index,
        tn.allocated_days,
        tn.estimated_minutes,
        tn.schedule_mode,
        tn.frequency_weight
    from public.template_nodes tn
    join pg_temp.clone_node_map map on map.template_node_id = tn.id
    left join pg_temp.clone_node_map parent_map on parent_map.template_node_id = tn.parent_id
    where tn.template_id = p_template_id
    order by tn.level, tn.order_index;

    return query
    select *
    from public.nodes
    where workspace_id = p_workspace_id
    order by level, order_index;
end;
$$;

create or replace function public.settle_node(
    p_node_id uuid,
    p_action_type public.action_type,
    p_payload jsonb,
    p_duration_minutes integer default 0,
    p_score numeric default 0,
    p_mastery numeric default 0,
    p_trap_memo text default null
)
returns public.nodes
language plpgsql
security definer
set search_path = public
as $$
declare
    v_node public.nodes%rowtype;
    v_user_id uuid := auth.uid();
    v_next_interval integer;
    v_next_review_at timestamptz;
    v_unlock_parent uuid;
begin
    select n.*
    into v_node
    from public.nodes n
    join public.workspaces w on w.id = n.workspace_id
    where n.id = p_node_id
      and w.user_id = v_user_id
    for update;

    if not found then
        raise exception 'node not found or permission denied';
    end if;

    if v_node.status = 'locked' then
        raise exception 'locked node cannot be settled';
    end if;

    insert into public.study_logs (
        workspace_id,
        node_id,
        user_id,
        action_type,
        payload,
        duration_minutes,
        score,
        mastery,
        trap_memo
    ) values (
        v_node.workspace_id,
        v_node.id,
        v_user_id,
        p_action_type,
        coalesce(p_payload, '{}'),
        greatest(coalesce(p_duration_minutes, 0), 0),
        coalesce(p_score, 0),
        coalesce(p_mastery, 0),
        p_trap_memo
    );

    update public.nodes
    set status = 'done',
        completed_at = now(),
        trap_memo = coalesce(nullif(p_trap_memo, ''), trap_memo)
    where id = v_node.id
    returning * into v_node;

    select coalesce(interval_index, 0) + 1
    into v_next_interval
    from public.node_reviews
    where node_id = v_node.id;

    v_next_interval := coalesce(v_next_interval, 1);
    v_next_review_at :=
        case least(v_next_interval, 6)
            when 1 then now() + interval '1 day'
            when 2 then now() + interval '2 days'
            when 3 then now() + interval '4 days'
            when 4 then now() + interval '7 days'
            when 5 then now() + interval '15 days'
            else now() + interval '30 days'
        end;

    insert into public.node_reviews (
        workspace_id,
        node_id,
        user_id,
        interval_index,
        next_review_at,
        last_reviewed_at,
        priority
    ) values (
        v_node.workspace_id,
        v_node.id,
        v_user_id,
        v_next_interval,
        v_next_review_at,
        now(),
        'P1'
    )
    on conflict (node_id) do update
    set interval_index = excluded.interval_index,
        next_review_at = excluded.next_review_at,
        last_reviewed_at = excluded.last_reviewed_at,
        priority = excluded.priority,
        updated_at = now();

    v_unlock_parent := v_node.parent_id;

    if v_unlock_parent is not null then
        with next_locked as (
            select n.id
            from public.nodes n
            where n.workspace_id = v_node.workspace_id
              and n.parent_id = v_unlock_parent
              and n.status = 'locked'
              and not exists (
                  select 1
                  from public.nodes previous
                  where previous.workspace_id = n.workspace_id
                    and previous.parent_id is not distinct from n.parent_id
                    and previous.order_index < n.order_index
                    and previous.status <> 'done'
              )
            order by n.order_index
            limit 1
        )
        update public.nodes
        set status = 'available'
        where id in (select id from next_locked);
    end if;

    return v_node;
end;
$$;

create or replace function public.complete_interview_session(p_session_id uuid)
returns public.interview_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
    v_session public.interview_sessions%rowtype;
    v_user_id uuid := auth.uid();
begin
    select *
    into v_session
    from public.interview_sessions
    where id = p_session_id
      and user_id = v_user_id
    for update;

    if not found then
        raise exception 'interview session not found or permission denied';
    end if;

    if exists (
        select 1
        from public.interview_checklist_items
        where session_id = p_session_id
          and is_passed = false
    ) then
        raise exception 'all checklist items must be green before closing';
    end if;

    update public.interview_sessions
    set status = 'done',
        completed_at = now()
    where id = p_session_id
    returning * into v_session;

    return v_session;
end;
$$;

alter table public.catalog_options enable row level security;
alter table public.workspaces enable row level security;
alter table public.templates enable row level security;
alter table public.template_nodes enable row level security;
alter table public.nodes enable row level security;
alter table public.study_logs enable row level security;
alter table public.node_reviews enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_checklist_items enable row level security;

create policy "catalog is public readable" on public.catalog_options
for select using (true);

create policy "templates are public readable" on public.templates
for select using (is_official = true);

create policy "template nodes are public readable" on public.template_nodes
for select using (
    exists (
        select 1 from public.templates t
        where t.id = template_id and t.is_official = true
    )
);

create policy "workspace owner can manage" on public.workspaces
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "node owner can manage" on public.nodes
for all using (
    exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.user_id = auth.uid()
    )
) with check (
    exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.user_id = auth.uid()
    )
);

create policy "study log owner can manage" on public.study_logs
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "review owner can manage" on public.node_reviews
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "daily checkin owner can manage" on public.daily_checkins
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "interview session owner can manage" on public.interview_sessions
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "interview checklist owner can manage" on public.interview_checklist_items
for all using (
    exists (
        select 1
        from public.interview_sessions s
        where s.id = session_id and s.user_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.interview_sessions s
        where s.id = session_id and s.user_id = auth.uid()
    )
);
