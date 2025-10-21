export default {
  // Lint and format JavaScript/TypeScript files
  '*.{js,jsx,ts,tsx}': [
    'npm run lint -- --fix',
    'npm run prettier -- --write'
  ],

  // Format other files
  '*.{json,md,css,scss,yaml,yml}': [
    'npm run prettier -- --write'
  ]
};