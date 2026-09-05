const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = path.resolve(__dirname, '..');

module.exports = function createConfig(name, port, federation) {
  return (_env, argv) => ({
    context: path.join(root, 'apps', name),
    mode: argv.mode ?? 'development',
    entry: './src/index.ts',
    output: {
      path: path.join(root, 'apps', name, 'dist'),
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      publicPath: 'auto',
      // Use CORS for federated scripts while preserving the remote's resource policy.
      crossOriginLoading: 'anonymous',
      uniqueName: `ordo-${name}`,
      clean: true,
    },
    resolve: { extensions: ['.tsx', '.ts', '.js'] },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.join(root, 'apps', name, 'tsconfig.json'),
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: { postcssOptions: { plugins: { '@tailwindcss/postcss': {} } } },
            },
          ],
        },
        { test: /\.(woff2?|png|jpe?g|svg)$/i, type: 'asset/resource' },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: path.join(root, 'config', 'index.html') }),
      new webpack.container.ModuleFederationPlugin({
        name,
        filename: 'remoteEntry.js',
        shared: {
          react: { singleton: true, requiredVersion: '^19.2.0' },
          'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
        },
        ...federation,
      }),
    ],
    devtool: argv.mode === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      host: '127.0.0.1',
      port,
      historyApiFallback: true,
      headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:3000' },
      proxy: name === 'host' ? [{ context: ['/api'], target: 'http://127.0.0.1:4000' }] : [],
    },
  });
};
