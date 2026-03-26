module.exports = function (api) {
  api.cache(process.env.NODE_ENV === 'production');
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src'
          }
        }
      ]
    ]
  };
};
