// PM2設定ファイル（本番環境用）
module.exports = {
  apps: [{
    name: 'only-u',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    // 自動再起動設定
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    // クラスター設定（複数インスタンスを起動する場合）
    // instances: 'max', // CPUコア数に応じて自動設定
  }]
};
