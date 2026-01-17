# GitGud Extension - Icon Guide

The extension requires PNG icons in the following sizes:

- 16x16 pixels (`icon16.png`)
- 32x32 pixels (`icon32.png`)
- 48x48 pixels (`icon48.png`)
- 128x128 pixels (`icon128.png`)

## Generating Icons

### Option 1: Online Converters (Easiest)

1. Use the `icon128.svg` file in this directory
2. Upload to an online converter:
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
3. Export in all required sizes (16, 32, 48, 128)
4. Save them in this `assets/` directory

### Option 2: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert SVG to PNG in different sizes
convert icon128.svg -resize 16x16 icon16.png
convert icon128.svg -resize 32x32 icon32.png
convert icon128.svg -resize 48x48 icon48.png
convert icon128.svg -resize 128x128 icon128.png
```

### Option 3: Using Inkscape (Command Line)

If you have Inkscape installed:

```bash
inkscape icon128.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon128.svg --export-filename=icon32.png --export-width=32 --export-height=32
inkscape icon128.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon128.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

### Option 4: Design Your Own

Use any graphic design tool:

- Figma
- Sketch
- Adobe Illustrator
- GIMP
- Canva

Design tips:

- Use the fire emoji 🔥 or create a flame icon
- Use the gradient colors: #667eea → #764ba2
- Keep it simple and recognizable at small sizes
- Export as PNG with transparent background

## Quick Note

The extension will still load and function without icons, but they won't display in:

- Chrome toolbar
- Extensions page
- Context menus

For testing purposes, you can continue without icons and add them later.
