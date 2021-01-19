const path = require("path");

module.exports = {
  typescript: { ignoreBuildErrors: true },
  experimental: { modern: true },
  env: {
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
  },
  async rewrites() {
    return [
      {
        source: "/:id/:version.:format",
        destination: "/api/[id]/[version]/i/[format]",
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.output.globalObject = "this";
    if (!config.module.noParse) {
      config.module.noParse = [];
    }

    config.module.noParse.push(
      path.resolve("node_modules", "benchmark", "benchmark.js")
    );
    config.module.rules.push({
      test: /\.worker\.(js|ts|tsx|jsx)$/,
      use: { loader: "worker-loader" },
    });

    config.module.rules.push({
      test: /\.ttf$/,
      use: { loader: "url-loader" },
    });

    return config;
  },
};
