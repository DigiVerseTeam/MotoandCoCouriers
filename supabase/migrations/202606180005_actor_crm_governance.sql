alter table public.actors
  add column if not exists next_action text,
  add column if not exists next_action_owner text,
  add column if not exists next_action_due date,
  add column if not exists crm_reviewed_at timestamptz;

create index if not exists actors_crm_review_idx
on public.actors(actor_type, relationship_status, last_reviewed, next_action_due);
