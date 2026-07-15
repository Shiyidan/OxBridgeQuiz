# 测试环境部署报告：支付生命周期任务

- 部署日期：2026-07-15
- 目标环境：test
- 目标地址：`http://8.149.140.115`
- 结果：成功

## 部署内容

- 支付订单主动查询补偿
- 超时订单查询后自动关闭银联商务二维码
- 处理中退款主动查询补偿
- 会员到期自动转为 `expired`
- 用户无其他有效会员时同步旧版付款状态
- `BackgroundJobLease` 跨进程任务租约

## 数据库

- 新增迁移：`20260715163000_add_background_job_lease`
- 迁移执行结果：成功
- `prisma migrate status`：Database schema is up to date

## 配置与运行验证

- 已备份 `/opt/quiz/api/.env`
- 已合并并启用 `PAYMENT_LIFECYCLE_*` 配置
- `API_ENV_FILE=/opt/quiz/api/.env npm run validate:runtime`：成功
- PM2 进程：`quiz-api` 重载成功
- `/api/health`：成功
- `/api/payment/config`：成功，通道已就绪
- 正式价格保持：首次月付 7800 分、月付 7900 分、年付 39800 分

## 端到端验证

- 创建未付款的 1 分测试二维码
- Worker 扫描到 1 笔过期订单并成功关闭
- 银联商务主动查询状态：`CLOSED`
- 临时到期会员：`active -> expired`
- 临时用户付款状态：`paid -> expired`
- 错误计数：支付查询 0、关单 0、退款查询 0
- 临时用户、订单和通知记录已清理

## 服务器备份

- `/opt/quiz/backups/config/api.env.before-20260715-payment-lifecycle`
- `/opt/quiz/backups/source/api-before-20260715-payment-lifecycle.tgz`
- `/opt/quiz/backups/api/dist-before-20260715-payment-lifecycle`
- `/opt/quiz/api/dist.previous-20260715-payment-lifecycle`
