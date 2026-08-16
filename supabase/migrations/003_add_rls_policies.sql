-- RLS Policies to allow public (Anon Key) operations since we are using the Anon Key for client/server connection

-- Policies for devotionals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotionals' AND policyname = 'Allow public read devotionals') THEN
    CREATE POLICY "Allow public read devotionals" ON devotionals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotionals' AND policyname = 'Allow public insert devotionals') THEN
    CREATE POLICY "Allow public insert devotionals" ON devotionals FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotionals' AND policyname = 'Allow public update devotionals') THEN
    CREATE POLICY "Allow public update devotionals" ON devotionals FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for devotional_comments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comments' AND policyname = 'Allow public read comments') THEN
    CREATE POLICY "Allow public read comments" ON devotional_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_comments' AND policyname = 'Allow public insert comments') THEN
    CREATE POLICY "Allow public insert comments" ON devotional_comments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Policies for devotional_views
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_views' AND policyname = 'Allow public read views') THEN
    CREATE POLICY "Allow public read views" ON devotional_views FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_views' AND policyname = 'Allow public insert views') THEN
    CREATE POLICY "Allow public insert views" ON devotional_views FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_views' AND policyname = 'Allow public update views') THEN
    CREATE POLICY "Allow public update views" ON devotional_views FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for devotional_view_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_view_sessions' AND policyname = 'Allow public read view sessions') THEN
    CREATE POLICY "Allow public read view sessions" ON devotional_view_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_view_sessions' AND policyname = 'Allow public insert view sessions') THEN
    CREATE POLICY "Allow public insert view sessions" ON devotional_view_sessions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Policies for devotional_likes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_likes' AND policyname = 'Allow public read likes') THEN
    CREATE POLICY "Allow public read likes" ON devotional_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_likes' AND policyname = 'Allow public insert likes') THEN
    CREATE POLICY "Allow public insert likes" ON devotional_likes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_likes' AND policyname = 'Allow public update likes') THEN
    CREATE POLICY "Allow public update likes" ON devotional_likes FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for devotional_like_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_like_sessions' AND policyname = 'Allow public read like sessions') THEN
    CREATE POLICY "Allow public read like sessions" ON devotional_like_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_like_sessions' AND policyname = 'Allow public insert like sessions') THEN
    CREATE POLICY "Allow public insert like sessions" ON devotional_like_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devotional_like_sessions' AND policyname = 'Allow public delete like sessions') THEN
    CREATE POLICY "Allow public delete like sessions" ON devotional_like_sessions FOR DELETE USING (true);
  END IF;
END $$;
