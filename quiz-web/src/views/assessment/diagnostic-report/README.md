# 诊断报告前端版本结构

考试路由页仍保留在 `EsatDiagnosticReportView/index.vue` 和 `TmuaDiagnosticReportView.vue`。它们只负责加载报告、升级历史报告、跳转题目解析和练习创建，并根据服务端返回的 `productVersion` 选择版本渲染器。

## v1

`v1/` 保存历史报告展示组件。它们只消费已持久化的 V1 快照，不能推导或覆盖 V2 分析结论。

## v2

`v2/DiagnosticReportV2.vue` 是 ESAT/TMUA 当前统一报告。新交卷和用户主动升级后的报告都进入此渲染器。

## shared

`shared/` 只存放不会改变版本业务含义的可视化组件。类型契约继续统一引用 `quiz-web/src/api/exam.ts`，页面不得自行定义另一套报告响应结构。

版本判断必须使用接口返回的 `productVersion`，不要根据字段是否存在或报告创建时间猜测版本。
