-- 深教考通 P7 迁移：复习书架与可编辑思维导图
-- 依赖 0001_init.sql 中已创建的 public.touch_updated_at() 触发器函数。

create table public.books (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    title text not null,
    author text,
    cover_color text not null default '#0f766e',
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.book_nodes (
    id uuid primary key default gen_random_uuid(),
    book_id uuid not null references public.books(id) on delete cascade,
    parent_id uuid references public.book_nodes(id) on delete cascade,
    title text not null,
    subtitle text,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_books_workspace on public.books(workspace_id, order_index);
create index idx_book_nodes_parent on public.book_nodes(book_id, parent_id, order_index);

create trigger trg_books_touch
before update on public.books
for each row execute function public.touch_updated_at();

create trigger trg_book_nodes_touch
before update on public.book_nodes
for each row execute function public.touch_updated_at();

alter table public.books enable row level security;
alter table public.book_nodes enable row level security;

create policy "book owner can manage" on public.books
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "book node owner can manage" on public.book_nodes
for all using (
    exists (
        select 1
        from public.books b
        where b.id = book_id and b.user_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.books b
        where b.id = book_id and b.user_id = auth.uid()
    )
);
