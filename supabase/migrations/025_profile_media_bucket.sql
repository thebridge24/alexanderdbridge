-- Public bucket for profile banners. Uploads go through the server (service role),
-- so no per-user storage policies are needed.
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;
