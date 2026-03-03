// PM2 配置文件 - 集群模式
module.exports = {
  apps: [{
    name: 'simplenote-api',
    script: './server.js',
    instances: 2, // 2核CPU，使用2个进程
    exec_mode: 'cluster', // 集群模式
    max_memory_restart: '400M', // 内存超过400M自动重启
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
