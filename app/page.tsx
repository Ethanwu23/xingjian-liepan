import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import { FavoriteButton } from "./favorite-button";
import { HistorySelector } from "./history-selector";
import { getHistoricalReports, getUserFavorites } from "../lib/cpi/report-store";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function tone(value: number) {
  return value > 0 ? "hot" : value < 0 ? "cool" : "flat";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const requestedMonth = (await searchParams).month;
  const history = await getHistoricalReports();
  const selectedSnapshot =
    history.reports.find((item) => item.releaseMonth === requestedMonth) ?? history.reports[0];
  const cpiReport = selectedSnapshot.report;
  const maxBar = Math.max(...cpiReport.components.map((item) => Math.abs(item.mom)));
  const user = await getChatGPTUser();
  let favorites = [] as typeof history.reports;
  let storageAvailable = history.storageAvailable;
  if (user && storageAvailable) {
    try {
      favorites = await getUserFavorites(user.email);
    } catch {
      storageAvailable = false;
    }
  }
  const favoriteMonths = new Set(favorites.map((item) => item.releaseMonth));
  const returnTo = `/?month=${selectedSnapshot.releaseMonth}#report`;
  const signInPath = chatGPTSignInPath(returnTo);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="星舰猎盘首页">
          <span className="brand-mark">星</span>
          <span>
            <strong>星舰猎盘</strong>
            <small>STARSHIP MARKET INTELLIGENCE</small>
          </span>
        </a>
        <nav aria-label="主导航">
          <a className="active" href="#report">CPI 研究舱</a>
          <a href="/fomc">FOMC Radar</a>
          <a href="/jobs">Jobs Monitor</a>
          <a href="/liquidity">Liquidity Map</a>
          <a href="#roadmap">模块航图</a>
          <span className="status"><i /> BLS 数据已同步</span>
          {user ? (
            <span className="account">
              {user.isSimulated ? <b className="local-account-badge">本地模拟</b> : null}
              {user.displayName}
              <a href="/database">数据后台</a>
              {!user.isSimulated ? <a href={chatGPTSignOutPath(returnTo)}>退出</a> : null}
            </span>
          ) : (
            <a className="account-link" href={signInPath}>登录收藏</a>
          )}
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">MISSION 01 · CPI RESEARCH</p>
          <h1>把宏观数据，转译成<br /><em>可交易的信号。</em></h1>
          <p className="hero-note">
            星舰猎盘的第一座研究舱：用确定性计算锁定事实，用结构化分析解释通胀，
            把每月 CPI 发布变成一份清晰、可追溯的交易备忘录。
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#report">进入研究舱 <span>↘</span></a>
            <span className="stamp">BLS 数据快照 · {cpiReport.releaseMonth}</span>
          </div>
        </div>
        <div className="radar-card" aria-label="通胀雷达摘要">
          <div className="radar-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="radar-center">
            <span>CORE CPI</span>
            <strong>{formatPercent(cpiReport.metrics[1].value)}</strong>
            <small>月环比</small>
          </div>
          <span className="radar-label label-a">能源冲击</span>
          <span className="radar-label label-b">住房粘性</span>
          <span className="radar-label label-c">服务降温</span>
        </div>
      </section>

      <section className="report-shell" id="report">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INFLATION BRIEFING</p>
            <h2>美国 CPI 分项跟踪</h2>
          </div>
          <div className="report-actions">
            <HistorySelector
              selected={selectedSnapshot.releaseMonth}
              months={history.reports.map((item) => ({
                value: item.releaseMonth,
                label: item.report.releaseMonth,
                favorite: favoriteMonths.has(item.releaseMonth),
              }))}
            />
            <FavoriteButton
              month={selectedSnapshot.releaseMonth}
              initialFavorite={favoriteMonths.has(selectedSnapshot.releaseMonth)}
              isAuthenticated={Boolean(user)}
              signInPath={signInPath}
              storageAvailable={storageAvailable}
            />
            <div className="release-meta">
              <span>报告期 {cpiReport.releaseMonth}</span>
              <span className="demo-tag">自动更新</span>
            </div>
          </div>
        </div>

        <article className="verdict">
          <span className="verdict-index">01 / 核心判断</span>
          <h3>{cpiReport.headline}</h3>
          <p>{cpiReport.summary}</p>
          <div className="confidence"><span style={{ width: `${cpiReport.confidence}%` }} /> </div>
          <small>信号置信度 {cpiReport.confidence}% · 基于规则引擎，不代表投资建议</small>
        </article>

        <div className="metric-grid">
          {cpiReport.metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong className={tone(metric.value)}>{formatPercent(metric.value)}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </div>

        <div className="analysis-grid">
          <article className="panel bar-panel">
            <div className="panel-title">
              <div><span>02</span><h3>分项环比变化</h3></div>
              <small>单位：%</small>
            </div>
            <div className="bar-chart" role="img" aria-label="CPI各分项环比变化条形图">
              {cpiReport.components.map((item) => (
                <div className="bar-row" key={item.name}>
                  <span className="bar-name">{item.name}</span>
                  <div className="bar-track">
                    <span
                      className={`bar ${tone(item.mom)}`}
                      style={{ width: `${Math.max(3, Math.abs(item.mom) / maxBar * 100)}%` }}
                    />
                  </div>
                  <strong className={tone(item.mom)}>{formatPercent(item.mom)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel signal-panel">
            <div className="panel-title">
              <div><span>03</span><h3>交易信号矩阵</h3></div>
              <small>规则引擎输出</small>
            </div>
            <div className="signal-list">
              {cpiReport.signals.map((signal) => (
                <div className="signal-item" key={signal.title}>
                  <span className={`signal-light ${signal.level}`} />
                  <div><strong>{signal.title}</strong><p>{signal.evidence}</p></div>
                  <b>{signal.tag}</b>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="panel trader-panel">
          <div className="panel-title">
            <div><span>04</span><h3>交易员最关注的分项</h3></div>
            <small>事实 → 含义 → 风险</small>
          </div>
          <div className="trader-table">
            <div className="table-head"><span>分项</span><span>环比</span><span>交易含义</span></div>
            {cpiReport.focus.map((row) => (
              <div className="table-row" key={row.name}>
                <strong>{row.name}</strong>
                <b className={tone(row.value)}>{formatPercent(row.value)}</b>
                <p>{row.meaning}</p>
              </div>
            ))}
          </div>
        </article>

        {user ? (
          <article className="panel favorites-panel" id="favorites">
            <div className="panel-title">
              <div><span>05</span><h3>我的 CPI 收藏</h3></div>
              <small>{user.displayName}</small>
            </div>
            {!storageAvailable ? (
              <p className="empty-state">收藏数据库暂不可用，历史报告浏览不受影响。</p>
            ) : favorites.length ? (
              <div className="favorite-list">
                {favorites.map((favorite) => (
                  <a
                    className={favorite.releaseMonth === selectedSnapshot.releaseMonth ? "active" : ""}
                    href={`/?month=${favorite.releaseMonth}#report`}
                    key={favorite.releaseMonth}
                  >
                    <strong>{favorite.report.releaseMonth}</strong>
                    <span>{favorite.report.headline}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="empty-state">还没有收藏。点击“收藏本期”，就能在这里快速返回。</p>
            )}
          </article>
        ) : null}
      </section>

      <section className="asset-section">
        <div className="section-heading inverse">
          <div><p className="eyebrow">CROSS-ASSET TRANSLATION</p><h2>从通胀读数到资产路径</h2></div>
          <p>不是预测价格，而是梳理影响链条。</p>
        </div>
        <div className="asset-grid">
          {cpiReport.assets.map((asset, index) => (
            <article key={asset.name}>
              <span>0{index + 1}</span>
              <h3>{asset.name}</h3>
              <strong>{asset.bias}</strong>
              <p>{asset.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="roadmap" id="roadmap">
        <div className="section-heading">
          <div><p className="eyebrow">STARSHIP MODULE MAP</p><h2>星舰猎盘 · 模块航图</h2></div>
          <p>统一数据协议，每个研究舱独立演进。</p>
        </div>
        <div className="module-grid">
          <article className="module-card current"><span>01 · ONLINE</span><h3>CPI Research</h3><p>通胀分项、趋势判断、跨资产影响</p><b>进入研究舱 →</b></article>
          <a className="module-card current" href="/fomc"><span>02 · ONLINE</span><h3>FOMC Radar</h3><p>利率路径、点阵图与政策语言变化</p><b>进入雷达舱 →</b></a>
          <a className="module-card current" href="/jobs"><span>03 · ONLINE</span><h3>Jobs Monitor</h3><p>非农、失业率、工资与劳动力再平衡</p><b>进入就业舱 →</b></a>
          <a className="module-card current" href="/liquidity"><span>04 · ONLINE</span><h3>Liquidity Map</h3><p>美元流动性、财政账户与风险偏好</p><b>进入流动性舱 →</b></a>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">星</span><span><strong>星舰猎盘</strong><small>MACRO INTELLIGENCE PLATFORM</small></span></div>
        <p>数据有源，计算可验，观点可追溯。</p>
        <small>
          数据来源：<a href={selectedSnapshot.sourceUrl}>U.S. Bureau of Labor Statistics</a>
          {" · "}不构成投资建议
        </small>
      </footer>
    </main>
  );
}
