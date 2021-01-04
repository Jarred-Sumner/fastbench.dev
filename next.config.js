module.exports = {
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.output.globalObject = "this";
    config.module.rules.push({
      test: /\.worker\.(js|ts|tsx|jsx)$/,
      use: { loader: "worker-loader" },
    });

    return config;
  },
};