// eslint-disable-next-line
const fs = require('fs');
// eslint-disable-next-line
const path = require('path');

const projectRoot = __dirname;

// Helper function to get include paths for Stitch packages
function getPackageIncludePaths(packageName, nodeModulePaths) {
  let packagePath = null;

  for (const nodeModulePath of nodeModulePaths) {
    const packageJsonPath = path.resolve(
      nodeModulePath,
      packageName,
      'package.json',
    );
    if (fs.existsSync(packageJsonPath)) {
      packagePath = path.dirname(packageJsonPath);
      break;
    }
  }
  if (!packagePath) {
    throw new Error(`Could not find package ${packageName}`);
  }

  // Always use forward slashes for globs
  const normalizedPackagePath = packagePath.replace(/\\/g, '/');
  return [
    `${normalizedPackagePath}/**/*.{js,mjs}`,
    `!${normalizedPackagePath}/node_modules/**/*.{js,mjs}`,
  ];
}

// Get include paths for Stitch packages
// Check both local node_modules and workspace root node_modules (monorepo)
const nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(projectRoot, '..', '..', 'node_modules'), // Monorepo root
];

const stitchTokensIncludePaths = getPackageIncludePaths(
  '@bonterratech/stitch-tokens',
  nodeModulesPaths,
);

const stitchExtensionIncludePaths = getPackageIncludePaths(
  '@bonterratech/stitch-extension',
  nodeModulesPaths,
);

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      // Narrowed file patterns to process
      include: [
        'src/app/**/*.{js,jsx,ts,tsx}',
        'src/components/**/*.{js,jsx,ts,tsx}',
        ...stitchTokensIncludePaths,
        ...stitchExtensionIncludePaths,
      ],
      babelConfig: {
        babelrc: false,
        parserOpts: {
          plugins: ['typescript', 'jsx'],
        },
        plugins: [
          [
            '@stylexjs/babel-plugin',
            {
              dev: dev,
              runtimeInjection: false,
              genConditionalClasses: true,
              treeshakeCompensation: true,
              aliases: {
                '@/*': [path.join(__dirname, '*')],
              },
              unstable_moduleResolution: {
                type: 'commonJS',
              },
            },
          ],
        ],
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};

