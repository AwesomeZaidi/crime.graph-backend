module.exports = {
    apps: [
      {
        name: 'CrimeGraph',
        script: 'fetch_arrests.js',
        cron_restart: '0 0 * * *', // Run the script at midnight every day
        autorestart: false,
      },
    ],
  };
  