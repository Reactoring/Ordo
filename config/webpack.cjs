const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = path.resolve(__dirname, '..');
const developmentOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);

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
    optimization: {
      splitChunks: {
        cacheGroups: {
          query: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'query',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    },
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
      new webpack.DefinePlugin({
        ORDO_HOST_URL: JSON.stringify(process.env.HOST_URL ?? 'http://localhost:3000'),
      }),
      new HtmlWebpackPlugin({
        template: path.join(root, 'config', 'index.html'),
        favicon: path.join(root, 'packages', 'ui', 'src', 'brand', 'ordo-mark.svg'),
        publicPath: '/',
      }),
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
      // Use the page's hostname for WebSockets while keeping each frontend's port.
      client: { webSocketURL: { hostname: '0.0.0.0', port } },
      historyApiFallback: true,
      headers: (request) => {
        const origin = request.headers.origin;
        return developmentOrigins.has(origin)
          ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
          : { Vary: 'Origin' };
      },
      proxy: name === 'host' ? [{ context: ['/api'], target: 'http://127.0.0.1:4000' }] : [],
    },
  });
};
