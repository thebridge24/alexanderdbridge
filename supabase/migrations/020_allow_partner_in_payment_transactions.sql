-- Migration 020: the Partner plan was rejected by the payment ledger's plan check, so Partner
-- payments were recorded as "supporter" or failed to save. Allow it.
alter table public.support_payment_transactions
  drop constraint if exists support_payment_transactions_plan_type_check;
alter table public.support_payment_transactions
  add constraint support_payment_transactions_plan_type_check
  check (plan_type in ('reader', 'supporter', 'sponsor', 'partner', 'patron'));
