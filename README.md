# Terrazzo Tailwind Plugin

A plugin for Terrazzo CLI that transforms DTCG (Design Tokens Community Group) tokens into Tailwind CSS custom properties with standardized naming conventions.

## Prerequisites

Terrazzo CLI is required to use this plugin. Install it using your preferred package manager:

```bash
# npm
npm install -D @terrazzo/cli

# pnpm
pnpm install -D @terrazzo/cli

# bun
bun install -D @terrazzo/cli
```

## Installation

1. Initialize your Terrazzo project if you haven't already:
```bash
npx tz init
```

2. Create a `plugins` directory and add the `plugin-tailwind-v4.mjs` file:
```bash
mkdir plugins
# Copy the plugin file to your plugins directory
```

3. Update your `terrazzo.config.js`:
```javascript
import pluginTailwindV4 from './plugins/plugin-tailwind-v4.mjs';

export default {
  source: ['tokens/**/*.json'], // Your token source files
  plugins: [
    pluginTailwindV4({
      fileName: 'theme.css' // Optional: default is "theme.css"
    })
  ]
}
```

## Features

### 1. DTCG Token Support
The plugin is designed to work with the DTCG token format, ensuring standardization across:
- Colors
- Typography
- Spacing
- Border radius
- Shadows
- And more

### 2. Standardized Variable Naming
Converts DTCG tokens into CSS custom properties following these conventions:

```css
/* Typography */
--font-{name}

/* Border Radius */
--radius-{size}

/* Colors */
--color-text-{variant}
--color-bg-{variant}
--color-border-{variant}
--color-icon-{variant}
--color-link-{variant}
```

### 3. Theme Support
Automatically generates theme variations from token modes:

```css
@theme {
  --color-text-primary: #000000;
}

[data-theme='dark'] {
  --color-text-primary: #ffffff;
}
```

## Usage

### 1. Token Structure
Create your tokens following the DTCG format:

```json
{
  "color": {
    "text": {
      "primary": {
        "$value": "#000000",
        "$extensions": {
          "mode": {
            "dark": "#ffffff"
          }
        }
      }
    }
  }
}
```

### 2. Build Your Tokens
Use the Terrazzo CLI to build your tokens:

```bash
npx tz build
```

For debugging, you can use the DEBUG environment variable:
```bash
DEBUG=plugin:* tz build
```

### 3. Integration with Your Project
Import the generated theme file in your CSS:

```css
@import 'path/to/theme.css';
```

### 4. Theme Switching
Use the `data-theme` attribute to switch themes:

```html
<body data-theme="dark">
  <!-- Your content -->
</body>
```

## Plugin Options

```javascript
pluginTailwindV4({
  fileName: 'theme.css' // Custom output filename
})
```

## Debugging

When encountering issues, use Terrazzo's debug mode:
- `DEBUG=* tz build`: Debug all scopes
- `DEBUG=plugin:* tz build`: Debug plugins only
- `DEBUG=parser:* tz build`: Debug core parser

## Contributing

For issues, suggestions, or contributions, please visit our repository.

## Resources

- [Terrazzo CLI Documentation](https://terrazzo.app/docs/cli/)
- [DTCG Token Specification](https://design-tokens.github.io/community-group/format/)

## License

MIT License