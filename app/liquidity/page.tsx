import type { Metadata } from "next";
import Link from "next/link";
import { liquiditySnapshot as report } from "../../lib/liquidity/latest-data";

export const metadata: Metadata = {
  title: "Liquidity Map · 星舰猎盘",
  description: "跟踪美联储资产负债表、财政账户、美元流动性与风险偏好。",
  openGraph: {
    title: "Liquidity Map · 星舰猎盘",
    description: "美联储资产负债表、TGA、ON RRP 与风险偏好的可追溯流动性地图。",
    type: "website",
    images: [{ url: "/og-liquidity.png", width: 1733, height: 907, alt: "星舰猎盘四座宏观研究舱" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquidity Map · 星舰猎盘",
    description: "看资产底盘，也看资金被谁吸收。",
    images: ["/og-liquidity.png"],
  },
};

function formatValue(value: number, unit: string) {
  if (unit === "T") return `$${value.toFixed(3)}T`;
  if (unit === "B") return `$${value < 1 ? value.toFixed(3) : value.toFixed(1)}B`;
  if (unit === "%") return `${value.toFixed(1)}%`;
  return value > 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
}

function formatChange(change?: number, unit?: string) {
  if (change === undefined) return "结构指标";
  const billions = unit === "T" ? change * 1000 : change;
  return `本周 ${billions > 0 ? "+" : "−"}$${Math.abs(billions).toFixed(1)}B`;
}

export default function LiquidityMapPage() {
  return (
    <main className="liquidity-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="星舰猎盘首页">
          <span className="brand-mark">星</span>
          <span><strong>星舰猎盘</strong><small>STARSHIP MARKET INTELLIGENCE</small></span>
        </Link>
        <nav aria-label="研究舱导航">
          <Link href="/">CPI Research</Link>
          <Link href="/fomc">FOMC Radar</Link>
          <Link href="/jobs">Jobs Monitor</Link>
          <Link className="active" href="/liquidity">Liquidity Map</Link>
          <a href="#risk">风险偏好</a>
          <span className="status"><i /> 流动性数据已同步</span>
        </nav>
      </header>

      <section className="liquidity-hero">
        <div>
          <p className="eyebrow">MISSION 04 · LIQUIDITY MAP</p>
          <h1>追踪美元水位，定位<br /><em>风险资产的流动性底盘。</em></h1>
          <p className="liquidity-hero-note">把美联储资产负债表、财政部现金账户和货币基金停泊资金串成一张地图，再用金融条件验证市场风险偏好。</p>
          <div className="hero-actions">
            <a className="primary-btn" href="#map">进入流动性舱 <span>↘</span></a>
            <span className="stamp">FED + NY FED + CHICAGO FED · {report.reportDate}</span>
          </div>
        </div>
        <div className="liquidity-orbit" aria-label="净流动性代理值约5.986万亿美元">
          <div className="liquidity-ring" />
          <span>NET LIQUIDITY PROXY</span>
          <strong>$5.986T</strong>
          <b>TGA 本周释放 $58.1B</b>
          <small>研究代理指标 · 非官方口径</small>
        </div>
      </section>

      <section className="liquidity-shell" id="map">
        <div className="section-heading">
          <div><p className="eyebrow">DOLLAR LIQUIDITY BRIEFING</p><h2>美元流动性总览</h2></div>
          <div className="release-meta"><span>{report.reportDate}</span><span className="liquidity-tag">H.4.1 + ON RRP + NFCI</span></div>
        </div>

        <article className="liquidity-verdict">
          <span>01 / 核心判断</span><h3>{report.headline}</h3><p>{report.summary}</p>
        </article>

        <div className="liquidity-metric-grid">
          {report.metrics.map((metric) => (
            <article key={metric.label} className={metric.tone}>
              <span>{metric.label}</span><strong>{formatValue(metric.value, metric.unit)}</strong>
              <small>{metric.note}</small><b>{formatChange(metric.change, metric.unit)}</b>
            </article>
          ))}
        </div>

        <article className="liquidity-panel flow-panel">
          <div className="liquidity-panel-title"><div><span>02</span><h3>净流动性传导图</h3></div><small>资产底盘 − 资金吸收项</small></div>
          <div className="liquidity-flow" role="img" aria-label="美联储总资产减去财政部TGA和隔夜逆回购得到净流动性代理值">
            {report.flow.map((item, index) => (
              <article key={item.label} className={item.operator}>
                <span>{item.operator === "base" ? "起点" : item.operator === "subtract" ? "减去" : "结果"}</span>
                <strong>{formatValue(item.value, item.unit)}</strong><h4>{item.label}</h4><small>{item.note}</small>
                {index < report.flow.length - 1 ? <i>→</i> : null}
              </article>
            ))}
          </div>
          <p className="proxy-note">代理公式用于观察方向，不等同于美联储定义的“净流动性”，也不能单独预测资产价格。</p>
        </article>

        <div className="liquidity-analysis-grid">
          <article className="liquidity-panel">
            <div className="liquidity-panel-title"><div><span>03</span><h3>美联储资产负债表</h3></div><small>7月8日 · 周三水平</small></div>
            <div className="balance-sheet-bars">
              {report.balanceSheet.map((item) => (
                <div key={item.label} className="balance-sheet-row">
                  <div><strong>{item.label}</strong><small>{item.note}</small></div>
                  <div><i style={{ width: `${item.share}%` }} /></div>
                  <b>{formatValue(item.value, item.unit)}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="liquidity-panel treasury-panel">
            <div className="liquidity-panel-title"><div><span>04</span><h3>财政账户雷达</h3></div><small>Treasury General Account</small></div>
            <div className="treasury-gauge"><span>TGA</span><strong>$749.2B</strong><small>前一周 $807.4B</small><i style={{ width: "74.9%" }} /></div>
            <div className="treasury-grid">
              {report.treasury.slice(1).map((item) => (
                <article key={item.label} className={item.tone}><span>{item.label}</span><strong>{formatValue(item.value, item.unit)}</strong><small>{item.note}</small></article>
              ))}
            </div>
          </article>
        </div>

        <article className="liquidity-panel risk-panel" id="risk">
          <div className="liquidity-panel-title"><div><span>05</span><h3>风险偏好与金融条件</h3></div><small>Chicago Fed NFCI · 周度</small></div>
          <div className="risk-scale"><span>更宽松 / 风险偏好更强</span><i /><span>更紧张 / 风险压力更高</span></div>
          <div className="risk-grid">
            {report.riskAppetite.map((item) => (
              <article key={item.label} className={item.tone}>
                <span>{item.label}</span><strong>{formatValue(item.value, "INDEX")}</strong>
                <div><i style={{ left: `${Math.max(4, Math.min(96, 50 + item.value * 50))}%` }} /></div>
                <small>{item.interpretation}</small><b>前值 {item.previous.toFixed(3)}</b>
              </article>
            ))}
          </div>
        </article>

        <article className="liquidity-panel liquidity-signals-panel">
          <div className="liquidity-panel-title"><div><span>06</span><h3>流动性信号矩阵</h3></div><small>事实 → 传导 → 风险</small></div>
          <div className="liquidity-signals">
            {report.signals.map((signal) => (
              <article key={signal.title} className={signal.tone}><i /><div><strong>{signal.title}</strong><p>{signal.evidence}</p><small>{signal.implication}</small></div><b>{signal.tone === "supportive" ? "支持" : signal.tone === "watch" ? "观察" : "中性"}</b></article>
            ))}
          </div>
        </article>
      </section>

      <section className="liquidity-sources">
        <div><p className="eyebrow">SOURCE CONTROL</p><h2>三个资金池，一张流动性地图</h2><p>每个数字保留官方来源；代理值和市场含义属于星舰猎盘的结构化分析。</p></div>
        <div className="source-links">{report.sources.map((source) => <a key={source.label} href={source.url}>{source.label}<span>↗</span></a>)}</div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">星</span><span><strong>星舰猎盘</strong><small>LIQUIDITY MAP</small></span></div>
        <p>看资产底盘，也看资金被谁吸收。</p>
        <small>数据来源：Federal Reserve System · 不构成投资建议</small>
      </footer>
    </main>
  );
}
