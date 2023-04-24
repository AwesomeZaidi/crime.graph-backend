module.exports = {
  apps: [
    {
      name: 'CrimeGraph',
      script: 'fetch_arrests.js',
      autorestart: false,
    },
  ],
};
