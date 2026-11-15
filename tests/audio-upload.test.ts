import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { POST, PUT } from "../app/api/admin/devotionals/[date]/audio/route";
import { GET } from "../app/api/devotionals/[date]/audio/route";
import { GET as getMentions } from "../app/api/users/mentions/route";
import { GET as getStreaks } from "../app/api/streaks/route";

const userId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const date = "2026-11-09";
const context = { params: Promise.resolve({ date }) };

test("recording upload is confirmed in Storage and published with its duration", async (t) => {
  let metadata: Record<string, unknown> | null = null;
  let storedPath = "";
  let metadataFails = false;
  let lookupFails = false;
  let signingFails = false;
  let adminReads = 0;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://test");
    const path = decodeURIComponent(url.pathname);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    res.setHeader("Content-Type", "application/json");
    if (path === "/auth/v1/user") {
      res.end(JSON.stringify({ id: userId, user_metadata: {}, aud: "authenticated", role: "authenticated" }));
    } else if (path === "/auth/v1/admin/users") {
      adminReads++;
      res.end(JSON.stringify({ users: [{ id: userId }, { id: otherId, email: "private@example.test", user_metadata: { full_name: "Precious Test", avatar_url: "https://example.test/avatar.png" } }] }));
    } else if (path.startsWith("/storage/v1/object/upload/sign/")) {
      if (signingFails) { res.statusCode = 404; res.end(JSON.stringify({ message: "Bucket not found" })); return; }
      if (req.method === "POST") res.end(JSON.stringify({ url: path.replace("/storage/v1", "") + "?token=test-token" }));
      else { storedPath = path.split("/devotional-audio/")[1]; res.end(JSON.stringify({ Key: storedPath })); }
    } else if (path.startsWith("/storage/v1/object/info/")) {
      const expected = path.split("/devotional-audio/")[1];
      if (storedPath !== expected) { res.statusCode = 404; res.end(JSON.stringify({ message: "Object not found" })); return; }
      res.end(JSON.stringify({ name: storedPath, size: 2048, content_type: "audio/webm" }));
    } else if (path === "/rest/v1/user_streaks") {
      const dates = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
      res.end(JSON.stringify([{
        user_id: userId, current_streak: 0, best_streak: 4, last_visit_date: "2026-11-08", unlocked_medal_ids: ["legacy-earned"],
        completed_devotionals: dates,
        attendance_history: { ...Object.fromEntries(dates.map(date => [date, { date, completed: true }])), "2026-11-04": { date: "2026-11-04", completed: false } },
      }]));
    } else if (path === "/rest/v1/devotional_audio") {
      if (metadataFails || lookupFails) { res.statusCode = 500; res.end(JSON.stringify({ message: "Database unavailable" })); return; }
      if (req.method === "POST") { metadata = JSON.parse(raw); res.statusCode = 201; res.end(); }
      else res.end(JSON.stringify(metadata ? [metadata] : []));
    } else { res.statusCode = 404; res.end(JSON.stringify({ message: "Unexpected mock endpoint" })); }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = base;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-key";
  process.env.ADMIN_USER_IDS = userId;
  t.after(() => { server.closeAllConnections(); server.close(); });
  const request = (method: string, body: unknown, authorised = true) => new NextRequest("http://app.test/api/admin/audio", {
    method, headers: { "Content-Type": "application/json", ...(authorised ? { Authorization: "Bearer mock-token" } : {}) }, body: JSON.stringify(body),
  });
  const prepare = () => POST(request("POST", { contentType: "audio/webm;codecs=opus", size: 6 * 1024 * 1024 }), context);
  let storagePath = "";

  await t.test("unsigned users cannot upload", async () => {
    const response = await POST(request("POST", {}, false), context);
    assert.equal(response.status, 401);
  });
  await t.test("a six-megabyte recording uses a small signed-upload request", async () => {
    const response = await prepare();
    assert.equal(response.status, 200);
    const body = await response.json();
    storagePath = body.storagePath;
    assert.ok(storagePath.startsWith(`${date}/${userId}/`));
    const client = createClient(base, "mock-anon-key", { auth: { persistSession: false } });
    const result = await client.storage.from(body.bucket).uploadToSignedUrl(storagePath, body.uploadToken, new Blob(["recording"], { type: "audio/webm" }), { contentType: "audio/webm" });
    assert.equal(result.error, null);
    assert.equal(metadata, null, "upload alone does not publish the devotional link");
    const completed = await PUT(request("PUT", { storagePath, durationSeconds: 300 }), context);
    assert.equal(completed.status, 200);
    const published = await completed.json();
    assert.equal(published.durationSeconds, 300);
    assert.ok(published.audioUrl.includes(storagePath));
    const publicResponse = await GET(new NextRequest("http://app.test/audio"), context);
    const audio = await publicResponse.json();
    assert.equal(audio.durationSeconds, 300);
    assert.equal(audio.audioUrl, published.audioUrl);
    assert.equal(publicResponse.headers.get("Cache-Control"), "no-store");
  });
  await t.test("missing files and another user's paths cannot be published", async () => {
    const other = await PUT(request("PUT", { storagePath: storagePath.replace(userId, otherId), durationSeconds: 300 }), context);
    assert.equal(other.status, 400);
    storedPath = "";
    const missing = await PUT(request("PUT", { storagePath, durationSeconds: 300 }), context);
    assert.equal(missing.status, 409);
    storedPath = storagePath;
  });
  await t.test("database and bucket failures are errors, not empty recordings or success", async () => {
    metadataFails = true;
    const complete = await PUT(request("PUT", { storagePath, durationSeconds: 300 }), context);
    assert.equal(complete.status, 500);
    metadataFails = false;
    lookupFails = true;
    const read = await GET(new NextRequest("http://app.test/audio"), context);
    assert.equal(read.status, 500);
    lookupFails = false;
    signingFails = true;
    assert.equal((await prepare()).status, 500);
    signingFails = false;
  });
  await t.test("mention suggestions work without follow or streak tables and expose no email", async () => {
    const response = await getMentions(new NextRequest("http://app.test/mentions", { headers: { Authorization: "Bearer mock-token" } }));
    assert.equal(response.status, 200);
    const { users } = await response.json();
    assert.equal(adminReads, 1);
    assert.equal(users.length, 1);
    assert.equal(users[0].name, "Precious Test");
    assert.equal(users[0].email, undefined);
    assert.equal((await getMentions(new NextRequest("http://app.test/mentions"))).status, 401);
  });
  await t.test("returning members receive restored progress and medals while missed dates stay missed", async () => {
    const response = await getStreaks(new NextRequest(`http://app.test/streaks?userId=${userId}&today=2026-11-15`, { headers: { Authorization: "Bearer mock-token" } }));
    assert.equal(response.status, 200);
    const { streakData } = await response.json();
    assert.equal(streakData.currentStreak, 7);
    assert.ok(streakData.unlockedMedalIds.includes("legacy-earned"));
    assert.ok(streakData.unlockedMedalIds.includes("streak_7"));
    assert.equal(streakData.attendanceHistory["2026-11-04"].completed, false);
    assert.equal(streakData.attendanceHistory["2026-11-09"], undefined);
  });
});
