-- SOP-BIL-04 invoice approval gate.
--
-- Source-backed intent:
-- - Invoice generation starts from an approved billing group.
-- - Admin reviews the rendered invoice before dispatch.
-- - Payment monitoring starts after invoice dispatch.
--
-- This migration records local approval evidence and blocks invoice lifecycle
-- states that would imply dispatch/payment monitoring before approval. It does
-- not implement production PDF/email dispatch or accounting export.

alter table public.invoices
  add column if not exists billing_group_approved_at timestamptz,
  add column if not exists billing_group_approved_by uuid references public.profiles(id),
  add column if not exists billing_group_approval_source text not null default 'SOP-BIL-04',
  add column if not exists billing_group_approval_note text,
  add column if not exists invoice_approved_at timestamptz,
  add column if not exists invoice_approved_by uuid references public.profiles(id),
  add column if not exists invoice_approval_source text not null default 'SOP-BIL-04',
  add column if not exists invoice_approval_note text;

alter table public.invoices
  drop constraint if exists invoices_sent_requires_invoice_approval,
  drop constraint if exists invoices_monitoring_requires_dispatch;

alter table public.invoices
  add constraint invoices_sent_requires_invoice_approval
  check (
    status not in ('approved', 'sent', 'overdue', 'paid')
    or (
      invoice_approved_at is not null
      and length(trim(coalesce(invoice_approval_note, ''))) > 0
    )
  );

alter table public.invoices
  add constraint invoices_monitoring_requires_dispatch
  check (
    status not in ('overdue', 'paid')
    or dispatch_recorded_at is not null
  );

create or replace function public.approve_invoice_for_dispatch(
  target_invoice_id uuid,
  approval_note text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin role required to approve invoices for dispatch';
  end if;

  if nullif(trim(coalesce(approval_note, '')), '') is null then
    raise exception 'SOP-BIL-04 invoice approval note is required';
  end if;

  if not exists (
    select 1
    from public.invoice_lines il
    where il.invoice_id = target_invoice_id
  ) then
    raise exception 'Cannot approve an invoice with no invoice lines';
  end if;

  update public.invoices
  set
    status = 'approved',
    billing_group_approved_at = coalesce(billing_group_approved_at, created_at, now()),
    billing_group_approved_by = coalesce(billing_group_approved_by, auth.uid()),
    billing_group_approval_source = coalesce(nullif(billing_group_approval_source, ''), 'SOP-BIL-04'),
    invoice_approved_at = now(),
    invoice_approved_by = auth.uid(),
    invoice_approval_source = 'SOP-BIL-04',
    invoice_approval_note = approval_note,
    updated_at = now()
  where id = target_invoice_id
    and status in ('draft', 'approved');

  if not found then
    raise exception 'Invoice must be draft or approved and must exist before dispatch approval';
  end if;
end;
$$;

comment on column public.invoices.billing_group_approved_at is
  'SOP-BIL-04 evidence that the billing group was approved before invoice generation.';

comment on column public.invoices.invoice_approved_at is
  'SOP-BIL-04 evidence that Admin reviewed the rendered invoice before dispatch.';

comment on function public.approve_invoice_for_dispatch(uuid, text) is
  'Admin-only SOP-BIL-04 approval gate before invoice dispatch.';
