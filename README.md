# 星舰猎盘

模块化宏观交易研究平台。当前已上线 `cpi-research`、`fomc-radar`、`jobs-monitor` 与 `liquidity-map` 四个研究模块。

## 当前版本

- CPI 交易研究仪表板。
- 数据驱动的指标卡、分项图表、规则信号与跨资产路径。
- 环比、同比、三个月年化的确定性计算函数。
- 计算引擎单元测试。
- Python 定时任务从 BLS Public Data API 更新版本化数据快照。
- 历史月份选择与月度快照归档。
- ChatGPT 登录后的个人报告收藏。
- Cloudflare D1 保存 CPI 历史报告和用户收藏。
- 本地开发环境自动模拟登录账号。
- 独立的只读 D1 数据管理后台。
- FOMC Radar 利率路径、SEP 点阵图和政策语言变化追踪。
- Jobs Monitor 非农、失业、工资与劳动力供需再平衡分析。
- Liquidity Map 美联储资产负债表、财政账户、美元流动性与风险偏好分析。

## 本地运行

需要 Node.js `>=22.13.0`。使用 nvm 时可在项目目录执行：

```bash
nvm install
nvm use
```

使用 Homebrew 安装的 `node@22` 时，请确保 `/opt/homebrew/opt/node@22/bin` 位于 `PATH` 前部。

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

本地开发时会自动显示“本地模拟用户”，可以直接测试收藏和数据后台，无需真实登录。默认账号只在开发模式生效，正式线上环境不会启用。

如需修改模拟姓名和邮箱，复制示例配置：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 中的 `LOCAL_AUTH_NAME` 和 `LOCAL_AUTH_EMAIL`。如需恢复匿名状态，将 `LOCAL_AUTH_ENABLED` 改成 `false`。

## 验证

```bash
npm run lint
npm test
```

## 更新 CPI 数据

```bash
npm run data:update
```

更新器默认使用 BLS 未注册额度；如已申请 API Key，可通过环境变量 `BLS_API_KEY` 提升查询额度。
GitHub Actions 在工作日 UTC 15:30（北京时间 23:30）自动运行，只有官方数据发生变化时才会提交新快照，也支持手动触发。

## FOMC Radar

访问 `/fomc` 查看第二座研究舱。当前快照使用美联储 2026 年 6 月官方声明和 SEP：

- 对比 6 月与 3 月 SEP 的联邦基金利率中值路径；
- 展示 2026、2027、2028 和长期利率点阵分布；
- 对比 6 月与 4 月声明中的政策指引、通胀、增长就业和委员会共识；
- 每个页面结论都提供美联储声明与预测材料的原文链接。

## Jobs Monitor

访问 `/jobs` 查看第三座研究舱。当前快照使用 BLS 2026 年 6 月就业报告和 2026 年 5 月 JOLTS：

- 跟踪非农新增、前值修订和主要行业贡献；
- 联合观察 U-3、U-6、劳动参与率和就业人口比，避免只看失业率；
- 展示平均时薪的环比、同比、绝对水平与平均工时；
- 用职位空缺、招聘、主动离职、裁员和空缺/失业者比率判断供需再平衡；
- 页面结论均可回到对应 BLS 官方发布核对。

## Liquidity Map

访问 `/liquidity` 查看第四座研究舱。当前快照联合美联储 H.4.1、纽约联储 ON RRP 与芝加哥联储 NFCI：

- 展示美联储总资产、持有证券和银行准备金；
- 跟踪财政部 TGA 余额及其一周、一年变化；
- 观察 ON RRP 这个货币基金流动性缓冲池；
- 用“美联储总资产 − TGA − ON RRP”构造研究代理值，并明确标注它不是官方统计；
- 用 NFCI 及风险、信用、杠杆分项检查金融条件和风险偏好。

## 历史、登录与收藏

- 历史月份会同时保存在 `lib/cpi/data/history.json` 和部署后的 D1 数据库中。
- 公开访问者可以查看全部历史月份。
- 正式线上环境的收藏操作必须通过部署平台的 ChatGPT 登录。
- 本地 `npm run dev` 会使用带明显标识的模拟账号代替真实登录，方便测试收藏。
- 收藏和历史数据库使用 `.openai/hosting.json` 中的 D1 逻辑绑定 `DB`。
- 登录后可访问 `/database` 数据后台；用户只能查看历史报告、自己的收藏和匿名汇总数量，不会看到其他用户邮箱。

详细路线见 `docs/ROADMAP.md`。

项目目录、模块边界和新增研究舱的约定见 `docs/ARCHITECTURE.md`。

零基础读者可以从 `docs/BEGINNER_GUIDE.md` 开始，它完整讲解业务、目录、数据流、核心代码和本地操作。

## 目录速览

```text
app/          页面、布局与全局样式
lib/cpi/      cpi-research 的类型、计算与 BLS 数据快照
lib/fomc/     fomc-radar 的类型与美联储官方快照
lib/jobs/     jobs-monitor 的类型与 BLS 就业/JOLTS 快照
lib/liquidity/ liquidity-map 的类型与联储官方快照
tests/        计算单元测试与构建产物验收测试
db/           平台数据库连接与共享 schema
worker/       Cloudflare Worker 运行入口
docs/         架构说明与产品路线图
examples/     独立示例，不属于产品运行主链路
```

## 数据原则

- Python/TypeScript 计算事实，LLM 不负责计算数值。
- 环比使用季调指数，同比使用非季调指数。
- 原始数据、计算结果和 AI 报告分别保存并保留版本。
- 页面内容不构成投资建议。
