# 星舰猎盘架构与仓库约定

## 1. 当前定位

星舰猎盘是模块化宏观交易研究平台，当前仓库以单个 Next/Vinext 应用承载平台外壳和研究模块。
`cpi-research` 是第一个业务模块，目前处于 v0.1 演示数据阶段。

## 2. 目录边界

```text
.
├── app/                  # Web 页面、布局、认证适配与全局样式
├── lib/
│   └── cpi/              # cpi-research 领域代码
│       ├── calculator.ts # 确定性指标计算
│       ├── demo-data.ts  # 页面演示快照
│       └── types.ts      # CPI 报告领域类型
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
lib/cpi/demo-data.ts ─┐
lib/cpi/types.ts ─────┼─> app/page.tsx ─> Vinext 构建 ─> worker/index.ts
lib/cpi/calculator.ts └─> tests/cpi-calculator.test.ts
                              dist 输出 ─> tests/rendered-html.test.mjs
```

计算函数保持无副作用，由测试锁定公式；页面只消费结构化结果，不承担宏观指标计算。
接入 BLS API 后，原始快照、计算结果和报告应继续分层，避免演示数据、外部响应和展示模型相互耦合。

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
