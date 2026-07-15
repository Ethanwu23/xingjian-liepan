import type { CpiReport } from "./types";

export const cpiReport: CpiReport = {
  releaseMonth: "2026年6月",
  headline: "通胀回落得到确认，但尚未进入“风险解除”区间",
  summary: "总项回落主要受能源与汽油拖累；更值得交易员关注的是核心环比接近持平、核心服务代理继续降温。住房仍为正增长，说明通胀粘性正在减弱，但尚未完全消失。",
  confidence: 78,
  metrics: [
    { label: "总 CPI 环比", value: -0.42, note: "能源拖累明显" },
    { label: "核心 CPI 环比", value: -0.02, note: "本次最关键鸽派信号" },
    { label: "核心 CPI 同比", value: 2.59, note: "趋势继续降温" },
    { label: "住房环比", value: 0.12, note: "粘性仍在，但边际缓和" },
    { label: "核心服务代理", value: -0.18, note: "服务去住房继续降温" },
  ],
  components: [
    { name: "汽油", mom: -9.69 }, { name: "能源", mom: -5.71 }, { name: "机动车保险", mom: -2.01 },
    { name: "服装", mom: -0.55 }, { name: "CPI 总项", mom: -0.42 }, { name: "二手车", mom: -0.23 },
    { name: "核心服务", mom: -0.18 }, { name: "住房", mom: 0.12 }, { name: "租金", mom: 0.15 }, { name: "食品", mom: 0.21 },
  ],
  signals: [
    { title: "核心通胀确认降温", evidence: "核心 CPI 环比 −0.02%，核心服务代理 −0.18%。", level: "cooling", tag: "鸽派" },
    { title: "住房粘性边际缓和", evidence: "住房环比 +0.12%，仍为正但明显低于高粘性区间。", level: "cooling", tag: "改善" },
    { title: "能源反弹风险", evidence: "能源环比 −5.71%，本月拖累可能在未来发生逆转。", level: "watch", tag: "观察" },
    { title: "总项信号不可外推", evidence: "总项降幅显著大于核心，说明一次性冲击占比较高。", level: "watch", tag: "谨慎" },
  ],
  focus: [
    { name: "核心 CPI", value: -0.02, meaning: "接近持平，是本次最关键的降温证据，有利于降低短端利率预期。" },
    { name: "住房 / OER", value: 0.12, meaning: "粘性仍存在但边际缓和，需要连续数月确认，而不是只看单月读数。" },
    { name: "核心服务代理", value: -0.18, meaning: "服务去住房为负，削弱“服务通胀再加速”的叙事。" },
    { name: "机动车保险", value: -2.01, meaning: "高贡献粘性项目继续回落，改善核心服务的结构。" },
    { name: "能源 / 汽油", value: -5.71, meaning: "是总项降温主因，但高度可逆；需监测油价是否重新抬升通胀预期。" },
  ],
  assets: [
    { name: "美债利率", bias: "前端偏下行", reason: "核心环比降温首先影响降息概率与短端定价；能源反弹会限制长端下行空间。" },
    { name: "美元", bias: "边际偏弱", reason: "低于预期的核心和服务读数通常压低美元利差优势，但仍取决于全球相对增长。" },
    { name: "权益 / 黄金", bias: "流动性友好", reason: "实际利率回落通常有利于成长资产与黄金，需防范能源重新推升通胀预期。" },
    { name: "下一验证点", bias: "等待连续证据", reason: "结合 PPI、零售销售、初请与下一期 CPI，判断降温是趋势还是一次性冲击。" },
  ],
};
