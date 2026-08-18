---
task: esat-weakness-detection
phase: "6"
status: "等待评审"
current_experiment: "robustness-v6"
baseline_score: 4.1
best_score: 9.9
created: "2026-08-18"
updated: "2026-08-18"
---

# ESAT/TMUA 短板判定优化

目标是统一确定性统计、DeepSeek 提示词与 V2 首页结论的短板口径：ESAT 适应非标准和不均衡题量，TMUA 适应两个标准等题量模块，并从模块、难度和知识点多个层级识别有证据的短板，同时保留小样本边界。

Phase 6 技术验收已完成：5 组鲁棒性用例平均 9.91 分、标准差 0.092、最低 9.80 分；15 个确定性行为场景、后端构建和前端类型检查通过。当前等待用户最终确认，确认后将状态标记为“已完成”。
