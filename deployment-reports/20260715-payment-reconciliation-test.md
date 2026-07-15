# 测试环境部署报告：全站支付运营与每日交易对账

- 部署日期：2026-07-15
- 目标环境：test
- 目标地址：`http://8.149.140.115`
- 结果：成功

## 本次交付

- 管理员支付订单改为全站订单视角，不按当前管理员账号过滤。
- 支持按订单号、银联订单号、用户名和邮箱检索全站支付记录。
- 新增每日交易对账批次和逐笔对账明细。
- 新增异常订单、失败支付通知、长时间处理中退款和过期待支付订单统计。
- 新增异常订单“复核并修复”入口，必须由管理员显式确认。
- 新增异常订单人工确认和处理备注入口。
- 每日定时对前一个完整自然日执行一次对账，也支持管理员选择日期立即执行。

## 数据库与配置

- 新增迁移：`20260715173000_add_payment_reconciliation`
- 新增表：`PaymentReconciliationRun`、`PaymentReconciliationItem`
- 迁移执行结果：成功
- `prisma migrate status`：Database schema is up to date
- 已启用：`PAYMENT_RECONCILIATION_ENABLED=true`
- 定时执行小时：`PAYMENT_RECONCILIATION_HOUR=2`（北京时间）
- 单批处理数量：`PAYMENT_RECONCILIATION_BATCH_SIZE=100`

## 运行环境验证

- `API_ENV_FILE=/opt/quiz/api/.env npm run validate:runtime`：成功
- 数据库连接：成功
- SMTP 登录：成功
- PM2 进程 `quiz-api`：online
- `/api/health`：200
- `/api/payment/config`：成功，银联通道已就绪
- `/api/admin/payment-reconciliation/overview` 未登录访问：401，管理员权限隔离正常
- 公网页面：200
- 测试价格保持不变：首次月价 7800 分、月价 7900 分、年价 39800 分

## 真实订单对账验证

- 2026-07-14：定时批次自动完成，0 笔订单、0 异常。
- 2026-07-15：手动批次完成，共 2 笔全站订单。
- 已关闭订单：本地 `closed`，银联 `CLOSED`，金额 1 分，匹配。
- 已退款订单：本地 `refunded`，银联 `REFUND`，金额 1 分，匹配。
- 本批匹配 2 笔、自动修复 0 笔、异常 0 笔、错误 0 笔。

## 管理员手动处理策略验证

- 普通对账模拟本地 `pending`、银联 `CLOSED`：本地订单保持 `pending`，仅生成 `anomaly/open` 异常。
- 管理员 `test22` 显式执行“复核并修复”后：订单变为 `closed`，明细变为 `corrected/manually_resolved`。
- 已验证保存管理员 ID 和处理时间。
- 验证完成后已恢复原订单和原对账明细，不保留模拟异常数据。

## 支付订单详情与审计时间线

- 全站订单列表新增“查看详情”，使用右侧抽屉展示订单与用户、银联标识、支付状态和关键时间。
- 时间线按时间倒序聚合订单、脱敏异步通知、退款、关联权益、对账及管理员操作。
- 银联响应、异步通知、退款和对账原始记录放在可折叠审计区域。
- AppKey、通信密钥、支付人信息和签名不返回前端。
- 真实已退款订单验证：10 个时间线事件、2 条通知、1 条退款、1 条关联权益、1 条对账记录、2 份渠道响应摘要。
- 现有会员表未保存来源订单，详情已将会员信息标记为按用户和考试类型关联的权益快照。

## 安全边界（2026-07-15 管理策略调整）

- 定时对账和立即对账只记录异常，不自动修改订单、退款或会员状态。
- 只有管理员点击“复核并修复”后，才接受银联主动查询得到且金额一致的 `PAID`、`CLOSED`、`REFUND` 状态并执行修复。
- 后台不提供“手工强制改为已支付”，避免无真实资金流水却开通会员。
- 当前对账以本地订单为清单逐笔查询银联；银联侧存在但本地完全不存在的交易，需要开通银联完整账单/下载接口后再做第二阶段覆盖。

## 服务器备份

- `/opt/quiz/backups/config/api.env.before-20260715-payment-reconciliation`
- `/opt/quiz/backups/source/api-before-20260715-payment-reconciliation.tgz`
- `/opt/quiz/backups/api/dist-before-20260715-payment-reconciliation`
- `/opt/quiz/backups/web/dist-before-20260715-payment-reconciliation`
- `/opt/quiz/api/dist.previous-20260715-payment-reconciliation`
- `/opt/quiz/web/dist.previous-20260715-payment-reconciliation`
- `/opt/quiz/backups/config/api.env.before-20260715-payment-reconciliation-manual-only`
- `/opt/quiz/backups/source/api-before-20260715-payment-reconciliation-manual-only.tgz`
- `/opt/quiz/backups/api/dist-before-20260715-payment-reconciliation-manual-only`
- `/opt/quiz/backups/web/dist-before-20260715-payment-reconciliation-manual-only`
- `/opt/quiz/api/dist.previous-20260715-payment-reconciliation-manual-only`
- `/opt/quiz/web/dist.previous-20260715-payment-reconciliation-manual-only`
- `/opt/quiz/backups/config/api.env.before-20260715-payment-order-audit-detail`
- `/opt/quiz/backups/source/api-before-20260715-payment-order-audit-detail.tgz`
- `/opt/quiz/backups/api/dist-before-20260715-payment-order-audit-detail`
- `/opt/quiz/backups/web/dist-before-20260715-payment-order-audit-detail`
- `/opt/quiz/api/dist.previous-20260715-payment-order-audit-detail`
- `/opt/quiz/web/dist.previous-20260715-payment-order-audit-detail`
