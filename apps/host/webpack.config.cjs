const createConfig = require('../../config/webpack.cjs');

module.exports = createConfig('host', 3000, {
  remotes: {
    review: `review@${process.env.REVIEW_REMOTE_URL ?? 'http://127.0.0.1:3001/remoteEntry.js'}`,
  },
});
