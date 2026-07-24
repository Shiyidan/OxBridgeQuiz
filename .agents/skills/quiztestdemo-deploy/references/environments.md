# QuizTestDemo Deployment Environments

Store all environment-specific values in the git-ignored project-root `.env.deploy.local`. Start from `.env.deploy.local.example`.

Use exactly one column for each deployment:

| Setting | `test` key | `prod` key |
|---|---|---|
| ECS host | `QUIZ_TEST_SSH_HOST` | `QUIZ_PROD_SSH_HOST` |
| SSH user | `QUIZ_TEST_SSH_USER` | `QUIZ_PROD_SSH_USER` |
| SSH private-key path | `QUIZ_TEST_SSH_KEY` | `QUIZ_PROD_SSH_KEY` |
| Public URL | `QUIZ_TEST_PUBLIC_URL` | `QUIZ_PROD_PUBLIC_URL` |
| Expected RDS database | `QUIZ_TEST_DATABASE` | `QUIZ_PROD_DATABASE` |
| Expected `API_RUNTIME_ENV` | `test` | `prod` |
| Frontend build | `npm run build-only:test` | `npm run build-only` |
| Deployment document | `文档/5. 部署方案/5.3 测试环境部署记录.md` | `文档/5. 部署方案/5.6 线上环境部署记录.md` |
| Report prefix | `quiztestdemo-test-deploy-` | `quiztestdemo-prod-deploy-` |

Shared server paths:

- repository: `/opt/quiz/repo`
- API runtime: `/opt/quiz/api`
- frontend runtime: `/opt/quiz/web/dist`
- backups: `/opt/quiz/backups`
- PM2 process: `quiz-api`
- Nginx site: detect the existing environment file; production currently uses `/etc/nginx/sites-available/quiztestdemo`, while older environments may use `/etc/nginx/sites-available/quiz`

Rules:

- Never commit `.env.deploy.local`, SSH keys, credentials, real infrastructure addresses, database names, or report recipients.
- The selected environment controls the whole column.
- Never deploy to one host while validating another URL or database.
- Never infer `prod` from `main`, or `test` from a feature branch.
- Missing private configuration is a hard stop; do not use public example placeholders.
- If the server runtime profile or database differs from the selected column, stop before Git, build, migration, or runtime changes.
