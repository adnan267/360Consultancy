-- Wizard purposes now include business and holy tours.
do $$
declare r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl
    from pg_constraint c
    where c.contype = 'check'
      and c.conrelid in ('public.landing_pages'::regclass, 'public.wizard_questions'::regclass)
      and pg_get_constraintdef(c.oid) ilike '%purpose%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.landing_pages add constraint landing_pages_purpose_check
  check (purpose in ('study','work','visit','business','spiritual','unsure'));
alter table public.wizard_questions add constraint wizard_questions_purpose_check
  check (purpose is null or purpose in ('study','work','visit','business','spiritual','unsure'));
