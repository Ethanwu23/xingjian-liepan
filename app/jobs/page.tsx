import type { Metadata } from "next";
import Link from "next/link";
import { jobsSnapshot as report } from "../../lib/jobs/latest-data";

export const metadata: Metadata = {
  title: "Jobs Monitor · 星舰猎盘",
  description: "跟踪美国非农、失业率、工资与劳动力市场再平衡。",
};

function formatted(value: number, unit: string) {
  if (unit === "$") return `$${value.toFixed(2)}`;
  if (unit === "K") return `${Math.round(value)}K`;
  if (unit === "M") return `${value.toFixed(value < 5 ? 1 : 3)}M`;
  if (unit === "H") return `${value.toFixed(1)}h`;
  if (unit === "X") return `${value.toFixed(2)}x`;
  return `${value.toFixed(1)}${unit}`;
}

function delta(value: number, previous?: number) {
  if (previous === undefined) return null;
  const change = value - previous;
  if (Math.abs(change) < 0.001) return "持平";
  return `${change > 0 ? "+" : ""}${change.toFixed(value > 10 ? 1 : 2)}`;
}

export default function JobsMonitorPage() {
  const maxPayroll = Math.max(...report.payrollTrend.map((item) => item.value));
  const maxIndustry = Math.max(...report.industries.map((item) => Math.abs(item.value)));

  return (
    <main className="jobs-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="星舰猎盘首页">
          <span className="brand-mark">星</span>
          <span><strong>星舰猎盘</strong><small>STARSHIP MARKET INTELLIGENCE</small></span>
        </Link>
        <nav aria-label="研究舱导航">
          <Link href="/">CPI Research</Link>
          <Link href="/fomc">FOMC Radar</Link>
          <Link className="active" href="/jobs">Jobs Monitor</Link>
          <a href="#balance">劳动力再平衡</a>
          <span className="status"><i /> BLS 就业数据已同步</span>
        </nav>
      </header>

      <section className="jobs-hero">
        <div>
          <p className="eyebrow">MISSION 03 · JOBS MONITOR</p>
          <h1>拆开就业表象，识别<br /><em>劳动力市场的真实温度。</em></h1>
          <p className="jobs-hero-note">把企业新增岗位、家庭调查、工资和职位流动放在一起，判断就业是在有序再平衡，还是正在滑向更快的需求收缩。</p>
          <div className="hero-actions">
            <a className="primary-btn" href="#payroll">进入就业舱 <span>↘</span></a>
            <span className="stamp">BLS 官方快照 · {report.reportMonth}</span>
          </div>
        </div>
        <div className="labor-pulse" aria-label="6月非农就业摘要">
          <div className="pulse-ring" />
          <span>NONFARM PAYROLLS</span>
          <strong>+57K</strong>
          <b>失业率 4.2%</b>
          <small>新增就业继续降温</small>
        </div>
      </section>

      <section className="jobs-shell" id="payroll">
        <div className="section-heading">
          <div><p className="eyebrow">LABOR MARKET BRIEFING</p><h2>美国就业全景监测</h2></div>
          <div className="release-meta"><span>{report.reportMonth}</span><span className="demo-tag">Employment Situation + JOLTS</span></div>
        </div>

        <article className="jobs-verdict">
          <span>01 / 核心判断</span>
          <h3>{report.headline}</h3>
          <p>{report.summary}</p>
        </article>

        <div className="jobs-metric-grid">
          {report.metrics.map((metric) => (
            <article key={metric.label} className={metric.tone}>
              <span>{metric.label}</span>
              <strong>{formatted(metric.value, metric.unit)}</strong>
              <small>{metric.note}{metric.previous !== undefined ? ` · 前值 ${formatted(metric.previous, metric.unit)}` : ""}</small>
            </article>
          ))}
        </div>

        <div className="jobs-analysis-grid">
          <article className="jobs-panel payroll-panel">
            <div className="jobs-panel-title"><div><span>02</span><h3>非农新增趋势</h3></div><small>单位：千人</small></div>
            <div className="payroll-bars" role="img" aria-label="4月至6月非农新增就业趋势">
              {report.payrollTrend.map((item) => (
                <div className="payroll-column" key={item.month}>
                  <strong>{item.value}K</strong>
                  <div><i className={item.status} style={{ height: `${item.value / maxPayroll * 100}%` }} /></div>
                  <span>{item.month}</span>
                  <small>{item.status === "revised" ? "已修订" : "初值"}</small>
                </div>
              ))}
              <div className="revision-callout"><strong>−74K</strong><span>4月与5月合计下修</span><p>新增岗位不仅放慢，历史读数也在向下修正。</p></div>
            </div>
          </article>

          <article className="jobs-panel industry-panel">
            <div className="jobs-panel-title"><div><span>03</span><h3>行业就业贡献</h3></div><small>6月环比 · 千人</small></div>
            <div className="industry-bars">
              {report.industries.map((item) => (
                <div className="industry-row" key={item.name}>
                  <span>{item.name}</span>
                  <div><i className={item.value < 0 ? "negative" : "positive"} style={{ width: `${Math.abs(item.value) / maxIndustry * 100}%` }} /></div>
                  <strong className={item.value < 0 ? "negative" : "positive"}>{item.value > 0 ? "+" : ""}{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="jobs-panel unemployment-panel">
          <div className="jobs-panel-title"><div><span>04</span><h3>失业与劳动供给</h3></div><small>家庭调查 · 季调</small></div>
          <div className="labor-metrics">
            {report.unemployment.map((metric) => (
              <article key={metric.label} className={metric.tone}>
                <span>{metric.label}</span>
                <strong>{formatted(metric.value, metric.unit)}</strong>
                <small>{metric.note}</small>
                <b>{delta(metric.value, metric.previous) ?? "结构指标"}</b>
              </article>
            ))}
          </div>
          <p className="jobs-note">失业率下降并不等于就业全面转强：6月劳动力减少72万人，参与率与就业人口比同时下降，因此需要结合供给侧指标判断。</p>
        </article>

        <div className="jobs-analysis-grid wage-balance-grid" id="balance">
          <article className="jobs-panel wage-panel">
            <div className="jobs-panel-title"><div><span>05</span><h3>工资压力仪表</h3></div><small>私人非农全体员工</small></div>
            <div className="wage-grid">
              {report.wages.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span><strong>{formatted(metric.value, metric.unit)}</strong><small>{metric.note}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="jobs-panel balance-panel">
            <div className="jobs-panel-title"><div><span>06</span><h3>劳动力供需再平衡</h3></div><small>5月 JOLTS</small></div>
            <div className="balance-flow">
              {report.rebalancing.map((item, index) => (
                <article key={item.label}>
                  <span>0{index + 1}</span><div><strong>{item.label}</strong><small>{item.note}</small></div><b>{formatted(item.value, item.unit)}</b>
                </article>
              ))}
            </div>
          </article>
        </div>

        <article className="jobs-panel signal-matrix">
          <div className="jobs-panel-title"><div><span>07</span><h3>就业信号矩阵</h3></div><small>事实 → 判断 → 政策含义</small></div>
          <div className="jobs-signals">
            {report.signals.map((signal) => (
              <article key={signal.title}>
                <i className={signal.tone} />
                <div><strong>{signal.title}</strong><p>{signal.evidence}</p><small>{signal.implication}</small></div>
                <b>{signal.tone === "cooling" ? "降温" : signal.tone === "watch" ? "观察" : "均衡"}</b>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="jobs-sources">
        <div><p className="eyebrow">SOURCE CONTROL</p><h2>两套调查，一张就业全景图</h2><p>非农与工资来自企业调查；失业率与参与率来自家庭调查；职位流动来自JOLTS。</p></div>
        <div className="source-links">
          <a href={report.employmentSituationUrl}>6月 Employment Situation <span>↗</span></a>
          <a href={report.joltsUrl}>5月 JOLTS <span>↗</span></a>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">星</span><span><strong>星舰猎盘</strong><small>JOBS MONITOR</small></span></div>
        <p>就业看增量，失业看供给，工资看黏性。</p>
        <small>数据来源：U.S. Bureau of Labor Statistics · 不构成投资建议</small>
      </footer>
    </main>
  );
}
