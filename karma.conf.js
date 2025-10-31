const webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
    config.set({
        framework: ['jasmine'],

        files: [
            'src/**/*.test.js',
            'src/**/*.test.jsx',
            'src/**/*.test.ts',
            'src/**/*.test.tsx'
        ],

        preprocessors: {
            'src/**/*.test.js' : ['webpack'],
            'src/**/*.test.jsx' : ['webpack'],
            'src/**/*.test.ts' : ['webpack'],
            'src/**/*.test.tsx' : ['webpack'],
        },

        webpack: {
            ...webpackConfig,
            mode: 'development',
            resolve: {
                ...webpackConfig.resolve,
                alias: {
                    ...webpackConfig.resolve.alias,
                }
            }
        },

        browsers: ['Chrome'],
        reporters: ['progress'],
        logLevel: config.LOG_INFO,
        autoWatch: true,
        singleRun: process.env.CI === 'true',
        concurrency: Infinity,
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-webpack'
        ]

    })
}