const path = require("path");

// webpack
const webpack = require("webpack");
const { PowerBICustomVisualsWebpackPlugin, LocalizationLoader } = require('powerbi-visuals-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

// api configuration
const powerbiApi = require("powerbi-visuals-api");

// visual configuration json path
const pbivizPath = "./pbiviz.json";
const pbivizFile = require('./pbiviz.json');

// the visual capabilities content
const capabilitiesPath = './capabilities.json';
const capabilities = require('./capabilities.json');

const pluginLocation = "./.tmp/precompile/visualPlugin.ts"; // Path to visual plugin file
const visualSourceLocation = "../../src/visual"; // Path used inside generated plugin
const statsLocation = "../../webpack.statistics.html";

const babelOptions = {
    presets: [
        [
            require.resolve('@babel/preset-env'),
            {
                "targets": {
                    "ie": "11"
                },
                useBuiltIns: "entry",
                corejs: 3,
                modules: false
            }
        ],
        "@babel/preset-react"
    ],
    sourceType: "unambiguous",
    cacheDirectory: path.join(".tmp", "babelCache")
};

const isProduction = true;

module.exports = {
    entry: {
        "visual.js": pluginLocation
    },
    target: "web",
    devtool: "source-map",
    mode: isProduction ? "production" : "development",
    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: false,
                        drop_debugger: false
                    },
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
        splitChunks: {
            chunks: 'async',
            minSize: 20000,
            minRemainingSize: 0,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 50000,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                pdfjs: {
                    test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
                    name: 'pdfjs',
                    chunks: 'async',
                    priority: 20,
                    enforce: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    performance: {
        maxEntrypointSize: 3072000,
        maxAssetSize: 3072000,
        hints: 'warning'
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                include: /powerbi-visuals-|src|precompile(\\|\/)visualPlugin.ts/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: babelOptions
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: false,
                            experimentalWatchApi: false
                        }
                    }
                ],
            },
            {
                test: /pdf\.worker\.mjs$/,
                type: 'asset/resource',
                generator: {
                    filename: 'pdf.worker.js'
                }
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
                resolve: {
                    fullySpecified: false
                },
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: babelOptions
                    }
                ]
            },
            {
                test: /(\.js)x|\.js$/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: babelOptions
                    }
                ]
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
                type: "javascript/auto"
            },
            {
                test: /(\.less)|(\.css)$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                paths: [path.resolve(__dirname, 'node_modules')]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp|gif|svg|eot)$/i,
                type: 'asset/inline'
            },
            {
                test: /powerbiGlobalizeLocales\.js$/,
                loader: LocalizationLoader
            }
        ]
    },
    externals: { "powerbi-visuals-api": "null" },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".css"],
        fallback: {
            "path": false,
            "stream": require.resolve("stream-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer/"),
            "process": require.resolve("process"),
            "fs": false
        }
    },
    output: {
        clean: true,
        path: path.join(__dirname, ".tmp", "drop"),
        publicPath: '/assets/',
        filename: "[name]",
        chunkFilename: '[name].[chunkhash].js',
        library: pbivizFile.visual.guid,
        libraryTarget: "var",
        globalObject: 'this'
    },
    devServer: {
        static: {
            directory: path.join(__dirname, ".tmp", "drop"),
            publicPath: '/assets/'
        },
        compress: true,
        port: 8080,
        hot: false, // Already disabled
        server: {
            type: "https",
            options: {}
        },
        headers: {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=0",
            "Content-Security-Policy": "default-src https: http: data: blob: 'unsafe-inline' 'unsafe-eval' ws: wss:;",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        allowedHosts: ['app.powerbi.com', 'localhost'],
        client: false, // Completely disable the client overlay and WebSocket connection
        webSocketServer: false // Explicitly disable WebSocket server
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "visual.css",
            chunkFilename: "[id].css"
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process',
        }),
        new BundleAnalyzerPlugin({
            reportFilename: statsLocation,
            openAnalyzer: false,
            analyzerMode: 'disabled',
            generateStatsFile: false
        }),
        new PowerBICustomVisualsWebpackPlugin({
            ...pbivizFile,
            capabilities,
            visualSourceLocation,
            pluginLocation,
            apiVersion: powerbiApi.version,
            capabilitiesSchema: powerbiApi.schemas.capabilities,
            dependenciesSchema: powerbiApi.schemas.dependencies,
            devMode: !isProduction,
            generatePbiviz: isProduction,
            generateResources: isProduction,
            modules: true,
            packageOutPath: path.join(__dirname, "dist"),
        }),
        new ExtraWatchWebpackPlugin({
            files: [pbivizPath, capabilitiesPath],
        }),
        new webpack.WatchIgnorePlugin({
            paths: [
                path.join(__dirname, pluginLocation),
                "./.tmp/**/*.*",
                "./.tmp/**/**/*.*"
            ]
        }),
        new webpack.ProvidePlugin({
            define: "fakeDefine",
        }),
    ],
};