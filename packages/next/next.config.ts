import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@bonterratech/stitch-tokens',
    '@bonterratech/stitch-extension',
  ],

  // Configure webpack for StyleX (Stitch requires v0.12.0 - see package.json)
  webpack: (config, { dev }) => {
    const stylexConfig = {
      dev: dev,
      test: process.env.NODE_ENV === 'test',
      runtimeInjection: false,
      genConditionalClasses: true,
      treeshakeCompensation: true,
      aliases: {
        '@/*': [path.join(__dirname, '*')],
      },
      unstable_moduleResolution: {
        type: 'commonJS',
      },
    };

    // Process app source files with StyleX
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      include: [path.resolve(__dirname, 'src')],
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            parserOpts: {
              plugins: ['typescript', 'jsx'],
            },
            plugins: [['@stylexjs/babel-plugin', stylexConfig]],
          },
        },
      ],
    });

    // Process @bonterratech Stitch packages with StyleX
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx|mjs)$/,
      include: [
        /node_modules[\\\/]@bonterratech[\\\/]stitch-tokens/,
        /node_modules[\\\/]@bonterratech[\\\/]stitch-extension/,
      ],
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            parserOpts: {
              plugins: ['typescript', 'jsx'],
            },
            plugins: [['@stylexjs/babel-plugin', stylexConfig]],
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;

