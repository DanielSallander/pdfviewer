const path = require("path");
const webpack = require("webpack");
const { PowerBICustomVisualsWebpackPlugin, LocalizationLoader } = require('powerbi-visuals-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");
const powerbiApi = require("powerbi-visuals-api");

const pbivizPath = "./pbiviz.json";
const pbivizFile = require("./pbiviz.json");
const capabilitiesPath = "./capabilities.json";
const capabilities = require("./capabilities.json");

const pluginLocation = "./.tmp/precompile/visualPlugin.ts";
const visualSourceLocation = "../../src/visual";
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
        "visual.js": pluginLocation,
        "pdf.worker.min.js": "pdfjs-dist/build/pdf.worker.mjs"
    },
    target: "web",
    devtool: "source-map",
    mode: isProduction ? "production" : "development",
    optimization: {
        minimize: isProduction,
    },
    performance: {
        maxEntrypointSize: 2000000, // Increase to 2MB
        maxAssetSize: 2000000,      // Increase to 2MB
        hints: false                 // Or set to 'warning' or 'error' as needed
    },
    module: {
        rules: [
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
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules\/(?!(pdfjs-dist)\/).*/,
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
        ],
    },
    externals: { "powerbi-visuals-api": "null" },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".mjs"],
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/"),
            "process": false,
            "path": false,
            "fs": false,
            "util": false
        },
        alias: {
            'process/browser': require.resolve('process/browser.js')
        }
    },
    output: {
        clean: true,
        path: path.join(__dirname, ".tmp", "drop"),
        publicPath: 'assets/',
        filename: "[name]",
        library: pbivizFile.visual.guid,
        libraryTarget: "var",
    },
    devServer: {
        static: {
            directory: path.join(__dirname, ".tmp", "drop"),
            publicPath: '/assets/'
        },
        compress: true,
        port: 8080,
        hot: false,
        server: {
            type: "https",
            options: {}
        },
        headers: {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=0",
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: require.resolve('process/browser.js'),
            Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(isProduction ? 'production' : 'development')
            }
        }),
        new MiniCssExtractPlugin({
            filename: "visual.css",
            chunkFilename: "[id].css"
        }),
        new BundleAnalyzerPlugin({
            reportFilename: statsLocation,
            openAnalyzer: false,
            analyzerMode: `static`
        }),
        new PowerBICustomVisualsWebpackPlugin({
            ...pbivizFile,
            capabilities,
            visualSourceLocation,
            pluginLocation,
            apiVersion: powerbiApi.version,
            capabilitiesSchema: powerbiApi.schemas.capabilities,
            dependenciesSchema: powerbiApi.schemas.dependencies,
            devMode: false,
            generatePbiviz: true,
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
        })
    ],
};