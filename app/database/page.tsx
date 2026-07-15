import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { getDatabaseDashboard } from "../../lib/cpi/report-store";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function DatabasePage() {
  const user = await requireChatGPTUser("/database");
  let dashboard: Awaited<ReturnType<typeof getDatabaseDashboard>> | null = null;
  try {
    dashboard = await getDatabaseDashboard(user.email);
  } catch {
    // The page remains useful as a clear database-status screen when D1 is unavailable.
  }

  return (
    <main className="database-page">
      <header className="database-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">星</span>
          <span><strong>星舰猎盘</strong><small>DATABASE CONSOLE</small></span>
        </Link>
        <div className="database-account">
          {user.isSimulated ? <b>本地模拟账号</b> : null}
          <span>{user.displayName}</span>
          <Link href="/">返回研究舱</Link>
          {!user.isSimulated ? <a href={chatGPTSignOutPath("/")}>退出</a> : null}
        </div>
      </header>

      <section className="database-content">
        <div className="database-heading">
          <div>
            <p className="eyebrow">CPI RESEARCH · D1 CONSOLE</p>
            <h1>数据管理后台</h1>
            <p>查看 D1 中保存的历史报告，以及当前账号自己的收藏记录。后台为只读模式。</p>
          </div>
          <span className={`database-status ${dashboard ? "online" : "offline"}`}>
            <i /> {dashboard ? "D1 已连接" : "D1 暂不可用"}
          </span>
        </div>

        {dashboard ? (
          <>
            <div className="database-stats">
              <article><span>历史报告</span><strong>{dashboard.reports.length}</strong><small>cpi_reports</small></article>
              <article><span>我的收藏</span><strong>{dashboard.favorites.length}</strong><small>当前登录账号</small></article>
              <article><span>全部收藏</span><strong>{dashboard.totalFavorites}</strong><small>仅显示数量，不公开他人身份</small></article>
            </div>

            <article className="database-panel">
              <div className="database-panel-title">
                <div><span>01</span><h2>CPI 历史报告</h2></div>
                <small>cpi_reports · {dashboard.reports.length} 条</small>
              </div>
              <div className="database-table" role="table" aria-label="CPI 历史报告数据库记录">
                <div className="database-row database-table-head" role="row">
                  <span>月份</span><span>报告标题</span><span>写入时间</span><span>操作</span>
                </div>
                {dashboard.reports.map((report) => (
                  <div className="database-row" role="row" key={report.month}>
                    <strong>{report.month}</strong>
                    <span><b>{report.title}</b><small>{report.source}</small></span>
                    <time>{formatTime(report.createdAt)}</time>
                    <a href={`/?month=${report.month}#report`}>查看报告</a>
                  </div>
                ))}
              </div>
            </article>

            <article className="database-panel">
              <div className="database-panel-title">
                <div><span>02</span><h2>我的收藏记录</h2></div>
                <small>user_favorites · 当前账号</small>
              </div>
              {dashboard.favorites.length ? (
                <div className="database-table compact" role="table" aria-label="当前账号收藏记录">
                  {dashboard.favorites.map((favorite) => (
                    <div className="database-row" role="row" key={favorite.month}>
                      <strong>{favorite.month}</strong>
                      <span><b>{favorite.title}</b><small>收藏于 {formatTime(favorite.createdAt)}</small></span>
                      <a href={`/?month=${favorite.month}#report`}>查看收藏</a>
                    </div>
                  ))}
                </div>
              ) : <p className="database-empty">当前账号还没有收藏任何报告。</p>}
            </article>
          </>
        ) : (
          <article className="database-panel database-error">
            <h2>暂时无法连接数据库</h2>
            <p>请确认本地开发服务已经启用 D1，或稍后重新打开页面。研究舱的 JSON 历史浏览不受影响。</p>
          </article>
        )}
      </section>
    </main>
  );
}
