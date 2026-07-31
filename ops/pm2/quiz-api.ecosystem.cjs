// QuizTestDemo API process definition used by test and production deployments.
module.exports = {
  apps: [
    {
      name: 'quiz-api',
      script: '/opt/quiz/api/dist/index.js',
      cwd: '/opt/quiz/api',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '384M',
      env: {
        NODE_ENV: 'production',
        API_ENV_FILE: '/opt/quiz/api/.env',
      },
      out_file: '/var/log/quiz/quiz-api-out.log',
      error_file: '/var/log/quiz/quiz-api-error.log',
      merge_logs: true,
      time: true,
    },
  ],
}
