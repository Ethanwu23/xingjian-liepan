import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(path, "http://localhost"), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the 星舰猎盘 CPI research dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>星舰猎盘 · CPI Research<\/title>/);
  assert.match(html, /MISSION 01 · CPI RESEARCH/);
  assert.match(html, /美国 CPI 分项跟踪/);
  assert.match(html, /交易信号矩阵/);
  assert.match(html, /模块航图/);
  assert.match(html, /自动更新/);
  assert.match(html, /U\.S\. Bureau of Labor Statistics/);
  assert.match(html, /历史报告/);
  assert.match(html, /2026年5月/);
  assert.match(html, /登录后收藏/);
});

test("selects an archived CPI report by month", async () => {
  const response = await render("/?month=2026-05");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /能源推动总项升温/);
  assert.match(html, /value="2026-05" selected/);
});

test("protects the personal favorites API", async () => {
  const response = await render("/api/cpi/favorites");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required" });
});

test("protects the database console outside local development", async () => {
  const response = await render("/database");
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location") ?? "", "http://localhost");
  assert.equal(location.pathname, "/signin-with-chatgpt");
  assert.equal(location.searchParams.get("return_to"), "/database");
});

test("ships production metadata without starter preview markers", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:title" content="星舰猎盘 · CPI Research"/);
  assert.match(html, /property="og:image" content="\/og.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});
