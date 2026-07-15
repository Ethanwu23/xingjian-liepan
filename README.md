# 星舰猎盘

模块化宏观交易研究平台。当前第一个功能模块为 `cpi-research`。

## 当前版本

- CPI 交易研究仪表板。
- 数据驱动的指标卡、分项图表、规则信号与跨资产路径。
- 环比、同比、三个月年化的确定性计算函数。
- 计算引擎单元测试。
- Python 定时任务从 BLS Public Data API 更新版本化数据快照。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

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

详细路线见 `docs/ROADMAP.md`。

项目目录、模块边界和新增研究舱的约定见 `docs/ARCHITECTURE.md`。

## 目录速览

```text
app/          页面、布局与全局样式
lib/cpi/      cpi-research 的类型、计算与演示数据
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
