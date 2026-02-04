# Stitch Design System Setup

This project uses the [Stitch Design System](https://github.com/bonterratech/stitch), which requires private package access.

## Quick Setup

**Add tokens to your home directory `~/.npmrc` (recommended):**

```bash
# Add these lines to ~/.npmrc (NOT the project .npmrc)
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE
//npm.fontawesome.com/:_authToken=YOUR_FONTAWESOME_TOKEN_HERE
```

Then run:

```bash
npm install
```

## Getting Your Tokens

**GitHub Token** (for `@bonterratech/stitch-*` packages):

1. Go to <https://github.com/settings/tokens>
2. Generate new token (classic) with `read:packages` scope
3. Add to `~/.npmrc`: `//npm.pkg.github.com/:_authToken=TOKEN`

**Font Awesome Token** (for `@fortawesome/*` packages):

1. Obtain Font Awesome token from your team lead
2. Add to `~/.npmrc`: `//npm.fontawesome.com/:_authToken=TOKEN`

## Why Home Directory?

Using `~/.npmrc` instead of project `.npmrc`:

- ✅ Works across all projects
- ✅ Zero risk of committing secrets to git
- ✅ Easier to manage and rotate tokens

## Cursor AI Integration

Running `npm install` automatically copies Stitch documentation to `stitch-ai-assets/` for Cursor IDE integration.

Reference components in Cursor:

```text
@Button - show me how to create a primary button
@Stack - help me layout these components
```

## Resources

- [Storybook: Component API & Examples](https://main.d2txqofa7g657p.amplifyapp.com/)
- [Design System Guidelines](https://zeroheight.com/635ad7a5d/p/0424a6-stitch-design-system)
- [Stitch Slack Channel](https://bonterra.enterprise.slack.com/archives/C070GH413L3)

## Troubleshooting

**401 Unauthorized during `npm install`:**

- Verify tokens in `~/.npmrc` are correct and not expired
- Ensure GitHub token has `read:packages` scope
- Check Font Awesome Pro subscription is active
