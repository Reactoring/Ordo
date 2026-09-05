const createConfig = require('../../config/webpack.cjs');

module.exports = createConfig('review', 3001, {
  exposes: { './ReviewModule': './src/ReviewModule.tsx' },
});
