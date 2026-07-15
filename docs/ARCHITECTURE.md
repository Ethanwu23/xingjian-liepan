# 星舰猎盘架构与仓库约定

## 1. 当前定位

星舰猎盘是模块化宏观交易研究平台，当前仓库以单个 Next/Vinext 应用承载平台外壳和研究模块。
`cpi-research` 是第一个业务模块，目前通过 Python 定时任务同步 BLS 官方数据。

## 2. 目录边界

```text
.
├── app/                  # Web 页面、布局、认证适配与全局样式
├── lib/
│   └── cpi/              # cpi-research 领域代码
│       ├── calculator.ts # 确定性指标计算
│       ├── data/         # 版本化 BLS 数据快照
│       ├── latest-data.ts# 前端数据适配
│       ├── report-store.ts# D1 历史报告与收藏存储
│       └── types.ts      # CPI 报告领域类型
├── python/cpi_research/  # BLS 客户端、计算与快照生成
├── scripts/              # 数据更新命令入口
├── .github/workflows/    # 定时更新任务
├── tests/                # 单元测试与构建后 HTML 验收测试
├── db/                   # 平台共享数据库连接和 schema
├── drizzle/              # 数据库迁移元数据
├── worker/               # Cloudflare Worker 入口
├── build/                # 构建期插件源码，并非构建产物
├── public/               # 静态资源
├── docs/                 # 架构和产品文档
└── examples/             # D1 等独立示例，不进入产品主链路
```

以下目录是本地依赖或生成物，已通过 `.gitignore` 排除，不应提交：

- `node_modules/`：npm 依赖。
- `dist/`、`.next/`、`.vinext/`：构建产物和构建缓存。
- `.wrangler/`：Cloudflare 本地状态和日志。
- `coverage/`：测试覆盖率产物。
- `.env*`：本地环境变量和密钥。

## 3. CPI Research 的调用链

```text
BLS API ─> python/cpi_research ─> latest.json + history.json ─> D1 历史报告
                                                 │                 │
lib/cpi/types.ts ────────────────────────────────┼─> app/page.tsx ─┼─> worker/index.ts
lib/cpi/calculator.ts ─> TS 单元测试  └─> Python 快照测试
                                              dist 输出 ─> HTML 验收测试
```

计算函数保持无副作用，由测试锁定公式；页面只消费结构化结果，不承担宏观指标计算。
Python 更新器只在数据发生变化时原子替换 JSON，避免定时任务产生无意义提交。环比使用季调序列，同比使用未季调序列。
公开页面按 `month` 查询参数选择历史报告；D1 不可用时退回版本化文件。收藏 API 必须在服务端读取 ChatGPT 用户身份，不能信任浏览器提交的邮箱。本地开发模式可生成明确标识的模拟用户，生产构建会强制关闭该回退。`/database` 是登录后可访问的只读管理台，只查询当前用户收藏，不返回其他用户身份。

## 4. 后续模块约定

新研究舱优先沿用以下边界：

```text
lib/<module>/types.ts       领域类型
lib/<module>/calculator.ts  确定性计算
lib/<module>/data-source.ts 外部数据适配
lib/<module>/signals.ts     规则信号
tests/<module>-*.test.ts    模块测试
```

当页面复杂度增长后，再将 `app/page.tsx` 中的 CPI 展示组件迁入 `app/modules/cpi/`；在此之前保留单页面结构，避免过早拆分。
平台级能力（数据库连接、任务调度、报告渲染、版本追踪）不得放入某个研究模块目录。

## 5. 提交与验证

提交前至少运行：

```bash
npm run lint
npm test
```

推荐使用面向变更意图的提交前缀：

- `feat:` 新功能或新研究模块。
- `fix:` 缺陷修复。
- `test:` 测试新增或调整。
- `docs:` 文档和维护约定。
- `refactor:` 不改变外部行为的结构调整。
- `chore:` 工具链、依赖和仓库维护。

每笔提交应只表达一个主要意图。生成物、本地日志、环境变量和密钥不得进入 Git 历史。
