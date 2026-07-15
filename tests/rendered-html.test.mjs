import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("server-renders the FOMC Radar module", async () => {
  const response = await render("/fomc");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /MISSION 02 · FOMC RADAR/);
  assert.match(html, /利率路径雷达/);
  assert.match(html, /SEP 利率中值路径/);
  assert.match(html, /点阵图分布/);
  assert.match(html, /政策语言变化/);
  assert.match(html, /CURRENT TARGET RANGE/);
  assert.match(html, /3\.50/);
  assert.match(html, /3\.75/);
  assert.match(html, /2026年6月 FOMC/);
  assert.match(html, /federalreserve\.gov/);
});

test("keeps the official June dot-plot participant counts", async () => {
  const dataUrl = new URL("../lib/fomc/data/latest.json", import.meta.url);
  const snapshot = JSON.parse(await readFile(dataUrl, "utf8"));
  const totals = snapshot.dots.map((column) =>
    column.values.reduce((sum, value) => sum + value.count, 0),
  );

  assert.deepEqual(totals, [18, 18, 17, 18]);
  assert.deepEqual(snapshot.vote, { for: 12, against: 0 });
});

test("server-renders the Jobs Monitor module", async () => {
  const response = await render("/jobs");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /MISSION 03 · JOBS MONITOR/);
  assert.match(html, /非农新增趋势/);
  assert.match(html, /失业与劳动供给/);
  assert.match(html, /工资压力仪表/);
  assert.match(html, /劳动力供需再平衡/);
  assert.match(html, /57K/);
  assert.match(html, /bls\.gov/);
});

test("keeps the official Jobs Monitor snapshot values", async () => {
  const dataUrl = new URL("../lib/jobs/data/latest.json", import.meta.url);
  const snapshot = JSON.parse(await readFile(dataUrl, "utf8"));

  assert.deepEqual(
    snapshot.payrollTrend.map(({ value }) => value),
    [148, 129, 57],
  );
  assert.equal(snapshot.metrics.find(({ label }) => label === "失业率 U-3").value, 4.2);
  assert.equal(snapshot.metrics.find(({ label }) => label === "劳动参与率").value, 61.5);
  assert.equal(snapshot.wages.find(({ label }) => label === "时薪同比").value, 3.5);
  assert.equal(
    snapshot.rebalancing.find(({ label }) => label === "空缺/失业者").value,
    1.04,
  );
});

test("server-renders the Liquidity Map module", async () => {
  const response = await render("/liquidity");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /MISSION 04 · LIQUIDITY MAP/);
  assert.match(html, /美元流动性总览/);
  assert.match(html, /净流动性传导图/);
  assert.match(html, /财政账户雷达/);
  assert.match(html, /风险偏好与金融条件/);
  assert.match(html, /5\.986/);
  assert.match(html, /federalreserve\.gov/);
});

test("keeps the official Liquidity Map snapshot and proxy calculation", async () => {
  const dataUrl = new URL("../lib/liquidity/data/latest.json", import.meta.url);
  const snapshot = JSON.parse(await readFile(dataUrl, "utf8"));
  const [fed, tga, rrp, proxy] = snapshot.flow;
  const calculated = fed.value - tga.value / 1000 - rrp.value / 1000;

  assert.ok(Math.abs(calculated - proxy.value) < 0.001);
  assert.equal(snapshot.metrics.find(({ label }) => label === "银行准备金").value, 3.137);
  assert.equal(snapshot.metrics.find(({ label }) => label === "财政部 TGA").value, 749.2);
  assert.equal(snapshot.riskAppetite.find(({ label }) => label === "NFCI 综合").value, -0.515);
  assert.equal(snapshot.riskAppetite.find(({ label }) => label === "风险分项").value, -0.594);
});

test("ships production metadata without starter preview markers", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:title" content="星舰猎盘 · CPI Research"/);
  assert.match(html, /property="og:image" content="\/og-liquidity.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});
