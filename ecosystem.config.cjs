module.exports = {
  apps: [{
    name: 'dara-m1-ea',
    script: 'server.ts',
    interpreter: 'node_modules/.bin/tsx',
    cwd: '/root/dara-m1-ea',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
