create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  code text not null check (length(btrim(code)) > 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  starts_on date,
  ends_on date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_dates_order check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint groups_course_code_unique unique (course_id, code)
);

create table public.group_teachers (
  group_id uuid not null references public.groups (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (group_id, teacher_id)
);

create table public.group_students (
  group_id uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  position integer not null default 0 check (position >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  position integer not null default 0 check (position >= 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  kind text not null check (kind in ('document', 'image', 'video_link', 'external_link')),
  storage_path text,
  external_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_source_present check (storage_path is not null or external_url is not null),
  constraint materials_source_matches_kind check (
    (kind in ('document', 'image') and storage_path is not null and external_url is null)
    or (kind in ('video_link', 'external_link') and external_url is not null and storage_path is null)
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (length(btrim(action)) > 0),
  entity_type text not null check (length(btrim(entity_type)) > 0),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index groups_course_id_idx on public.groups (course_id);
create index group_teachers_teacher_id_idx on public.group_teachers (teacher_id);
create index group_students_student_id_idx on public.group_students (student_id);
create index modules_course_id_idx on public.modules (course_id);
create index sessions_module_id_idx on public.sessions (module_id);
create index materials_session_id_idx on public.materials (session_id);
create index materials_status_idx on public.materials (status);
create index audit_logs_actor_created_at_idx on public.audit_logs (actor_id, created_at desc);

create function public.require_profile_role(expected_role text)
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.teacher_id
      and role = expected_role
  ) then
    raise exception 'profile % must have role %', new.teacher_id, expected_role;
  end if;
  return new;
end;
$$;

create trigger group_teachers_role_check
before insert or update on public.group_teachers
for each row execute function public.require_profile_role('teacher');

create function public.require_student_profile_role()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.student_id
      and role = 'student'
  ) then
    raise exception 'profile % must have role student', new.student_id;
  end if;
  return new;
end;
$$;

create trigger group_students_role_check
before insert or update on public.group_students
for each row execute function public.require_student_profile_role();

alter table public.courses enable row level security;
alter table public.groups enable row level security;
alter table public.group_teachers enable row level security;
alter table public.group_students enable row level security;
alter table public.modules enable row level security;
alter table public.sessions enable row level security;
alter table public.materials enable row level security;
alter table public.audit_logs enable row level security;
