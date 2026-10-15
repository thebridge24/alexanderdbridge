-- Rebuild streak numbers from each user's attendance_history. Run in the Supabase SQL editor.
-- Only helps rows whose attendance_history still holds the completed days. Rows that were
-- overwritten with a single day need a database backup (see the note at the bottom).

-- STEP 1: preview what would change (nothing is modified)
with days as (
  select s.user_id, e.key::date as d
  from public.user_streaks s, jsonb_each(s.attendance_history) e
  where (e.value->>'completed')::boolean is true
),
grp as (
  select user_id, d, d - (row_number() over (partition by user_id order by d))::int as g from days
),
runs as (
  select user_id, count(*) as len, max(d) as end_d from grp group by user_id, g
),
calc as (
  select user_id,
         max(len) as longest,
         (array_agg(len order by end_d desc))[1] as latest_run
  from runs group by user_id
)
select s.user_id, s.display_name, s.current_streak as now_current, c.latest_run as rebuilt_current,
       s.best_streak as now_best, greatest(s.best_streak, c.longest) as rebuilt_best
from public.user_streaks s join calc c using (user_id)
where c.latest_run > s.current_streak or c.longest > s.best_streak
order by rebuilt_current desc;

-- STEP 2: apply it (uncomment after checking the preview)
-- with days as (
--   select s.user_id, e.key::date as d
--   from public.user_streaks s, jsonb_each(s.attendance_history) e
--   where (e.value->>'completed')::boolean is true
-- ),
-- grp as (
--   select user_id, d, d - (row_number() over (partition by user_id order by d))::int as g from days
-- ),
-- runs as (
--   select user_id, count(*) as len, max(d) as end_d from grp group by user_id, g
-- ),
-- calc as (
--   select user_id, max(len) as longest, (array_agg(len order by end_d desc))[1] as latest_run
--   from runs group by user_id
-- ),
-- dates as (
--   select user_id, jsonb_agg(to_char(d, 'YYYY-MM-DD') order by d) as all_days from days group by user_id
-- )
-- update public.user_streaks s
-- set current_streak = greatest(s.current_streak, c.latest_run),
--     best_streak = greatest(s.best_streak, c.longest),
--     completed_devotionals = dt.all_days,
--     updated_at = now()
-- from calc c join dates dt using (user_id)
-- where s.user_id = c.user_id;

-- NOTE: users whose history was overwritten need a backup. In Supabase go to Database > Backups,
-- restore the latest backup from before the wipe into a separate project (or use point-in-time
-- recovery), export user_streaks from it, then load it into a table named user_streaks_backup
-- and merge it back with the same logic.
