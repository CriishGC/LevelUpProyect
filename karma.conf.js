const WebpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
        '/src/**/*.test.js',
        '/src/**/*.test.jsx',
        '/src/**/*.test.ts',
        '/src/**/*.test.tsx'
    ],
    preprocessors: {
      './src/**/*.test.js': ['webpack'],
      './src/**/*.test.jsx': ['webpack'],
      './src/**/*.test.ts': ['webpack'],
      './src/**/*.test.tsx': ['webpack']
    },
    webpack: WebpackConfig,
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity
  });
};
