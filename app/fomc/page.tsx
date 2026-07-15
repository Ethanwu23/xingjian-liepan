import type { Metadata } from "next";
import Link from "next/link";
import { fomcSnapshot as report } from "../../lib/fomc/latest-data";

export const metadata: Metadata = {
  title: "FOMC Radar · 星舰猎盘",
  description: "跟踪美联储利率路径、点阵图与政策语言变化。",
};

function formatRate(value: number) {
  const decimals = Number.isInteger(value * 4) ? 2 : Number.isInteger(value * 8) ? 3 : 1;
  return `${value.toFixed(decimals)}%`;
}

function change(value: number, previous: number) {
  const difference = value - previous;
  if (Math.abs(difference) < 0.001) return "持平";
  return `${difference > 0 ? "+" : ""}${difference.toFixed(1)}pct`;
}

function dotsAt(period: string, rate: number) {
  const item = report.dots.find((column) => column.period === period);
  return item?.values.find((value) => value.rate === rate)?.count ?? 0;
}

const dotRates = Array.from(
  new Set(report.dots.flatMap((column) => column.values.map((value) => value.rate))),
).sort((a, b) => b - a);

export default function FomcRadarPage() {
  return (
    <main className="fomc-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="星舰猎盘首页">
          <span className="brand-mark">星</span>
          <span><strong>星舰猎盘</strong><small>STARSHIP MARKET INTELLIGENCE</small></span>
        </Link>
        <nav aria-label="研究舱导航">
          <Link href="/">CPI Research</Link>
          <Link className="active" href="/fomc">FOMC Radar</Link>
          <Link href="/jobs">Jobs Monitor</Link>
          <a href="#language">政策语言</a>
          <span className="status"><i /> FED 数据已同步</span>
        </nav>
      </header>

      <section className="fomc-hero">
        <div>
          <p className="eyebrow">MISSION 02 · FOMC RADAR</p>
          <h1>穿透声明措辞，定位<br /><em>利率路径的偏移。</em></h1>
          <p className="fomc-hero-note">把政策决定、SEP 点阵图和声明变化放进同一个坐标系，判断委员会是在等待、转鹰，还是为下一次行动铺路。</p>
          <div className="hero-actions">
            <a className="primary-btn" href="#path">扫描最新会议 <span>↘</span></a>
            <span className="stamp">FED 官方快照 · {report.meetingLabel}</span>
          </div>
        </div>
        <div className="rate-orbit" aria-label="当前联邦基金利率目标区间">
          <span>CURRENT TARGET RANGE</span>
          <strong>{report.targetRange.lower.toFixed(2)}—{report.targetRange.upper.toFixed(2)}%</strong>
          <b>{report.decision}</b>
          <small>{report.vote.for}–{report.vote.against} 全票通过</small>
        </div>
      </section>

      <section className="fomc-shell" id="path">
        <div className="section-heading">
          <div><p className="eyebrow">POLICY PATH BRIEFING</p><h2>利率路径雷达</h2></div>
          <div className="release-meta"><span>{report.meetingLabel}</span><span className="demo-tag">官方 SEP</span></div>
        </div>

        <article className="fomc-verdict">
          <span>01 / 核心判断</span>
          <h3>{report.headline}</h3>
          <p>{report.summary}</p>
        </article>

        <div className="fomc-macro-grid">
          {report.macro.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value.toFixed(1)}{item.unit}</strong>
              <small>3月 {item.previous.toFixed(1)}{item.unit} · {change(item.value, item.previous)}</small>
            </article>
          ))}
        </div>

        <article className="fomc-panel path-panel">
          <div className="fomc-panel-title">
            <div><span>02</span><h3>SEP 利率中值路径</h3></div>
            <small>6月预测 vs 3月预测</small>
          </div>
          <div className="rate-path-chart" role="img" aria-label="美联储6月和3月利率路径中值对比">
            {report.ratePath.map((point) => (
              <div className="rate-path-column" key={point.period}>
                <div className="path-scale">
                  <span className="path-current" style={{ bottom: `${(point.current - 2.5) / 2 * 100}%` }}><b>{formatRate(point.current)}</b></span>
                  <span className="path-previous" style={{ bottom: `${(point.previous - 2.5) / 2 * 100}%` }}><b>{formatRate(point.previous)}</b></span>
                </div>
                <strong>{point.period}</strong>
                <small>{change(point.current, point.previous)}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend"><span><i className="current" />6月中值</span><span><i />3月中值</span></div>
        </article>

        <article className="fomc-panel dot-panel">
          <div className="fomc-panel-title">
            <div><span>03</span><h3>点阵图分布</h3></div>
            <small>每个圆点 = 1位 FOMC 参与者</small>
          </div>
          <div className="dot-plot" role="img" aria-label="2026年6月FOMC点阵图">
            <div className="dot-header"><span>利率</span>{report.dots.map((column) => <strong key={column.period}>{column.period}</strong>)}</div>
            {dotRates.map((rate) => (
              <div className="dot-row" key={rate}>
                <span>{rate.toFixed(3)}</span>
                {report.dots.map((column) => (
                  <div className="dot-cell" key={column.period}>
                    {Array.from({ length: dotsAt(column.period, rate) }, (_, index) => <i key={index} />)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="data-note">点阵图代表参与者对“适当政策”的个人判断，不是委员会承诺，也不是市场利率预测。</p>
        </article>

        <article className="fomc-panel language-panel" id="language">
          <div className="fomc-panel-title">
            <div><span>04</span><h3>政策语言变化</h3></div>
            <small>6月声明 vs 4月声明</small>
          </div>
          <div className="language-list">
            {report.languageChanges.map((item) => (
              <article key={item.topic}>
                <div className="language-topic"><strong>{item.topic}</strong><b className={item.tone}>{item.tone === "hawkish" ? "偏鹰" : item.tone === "dovish" ? "偏鸽" : "中性"}</b></div>
                <div className="language-copy"><span>4月</span><p>{item.previous}</p></div>
                <div className="language-copy current"><span>6月</span><p>{item.current}</p></div>
                <small>{item.interpretation}</small>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="fomc-sources">
        <div><p className="eyebrow">SOURCE CONTROL</p><h2>所有判断都能回到原文</h2></div>
        <div className="source-links">
          <a href={report.statementUrl}>6月 FOMC 声明 <span>↗</span></a>
          <a href={report.projectionUrl}>6月 SEP 与点阵图 <span>↗</span></a>
          <a href={report.previousStatementUrl}>4月 FOMC 声明 <span>↗</span></a>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">星</span><span><strong>星舰猎盘</strong><small>FOMC RADAR</small></span></div>
        <p>政策有原文，路径有分布，变化有证据。</p>
        <small>数据来源：Board of Governors of the Federal Reserve System · 不构成投资建议</small>
      </footer>
    </main>
  );
}
