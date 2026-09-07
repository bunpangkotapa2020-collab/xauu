module.exports = {
  apps: [
    {
      name: "dara-m1-ea",
      script: "dist/server.cjs",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      watch: false,
      max_memory_restart: "1G",
      autorestart: true,
      exp_backoff_restart_delay: 100,
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      time: true
    }
  ]
};

