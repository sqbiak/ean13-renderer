# EAN-13 Renderer

Lightweight, professional-quality EAN-13 barcode renderer with GS1-compliant digit placement.

## Features

- Pure JavaScript, no dependencies
- GS1-compliant digit placement
- Extended guard bars for professional appearance
- Configurable dimensions, colors, and fonts
- UMD support (Browser, Node.js, AMD)
- Canvas-based rendering
- Data URL and Blob export

## Installation

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/sqbiak/ean13-renderer@1.0.0/ean13-renderer.min.js"></script>
```

### Download

Download `ean13-renderer.min.js` and include it in your project:

```html
<script src="ean13-renderer.min.js"></script>
```

## Usage

### Basic

```javascript
// Render to canvas element
EAN13Renderer.render('#my-canvas', '978020137962');

// Or pass canvas element directly
const canvas = document.getElementById('barcode');
EAN13Renderer.render(canvas, '978020137962');
```

### With Options

```javascript
EAN13Renderer.render(canvas, '978020137962', {
    moduleWidth: 2,      // Width of single bar module (px)
    height: 70,          // Main bar height (px)
    guardExtend: 10,     // How much guard bars extend (px)
    fontSize: 14,        // Digit font size (px)
    textMargin: 2,       // Gap between bars and text (px)
    quietZone: 12,       // Space for first digit (px)
    sideDigitGap: 2,     // Gap between side digit and bars (px)
    background: '#FFFFFF',
    foreground: '#000000',
    font: '"OCR-B", "Courier New", monospace'
});
```

### Export as Data URL

```javascript
const dataUrl = EAN13Renderer.toDataURL('978020137962');
// Use in img src or download
```

### Export as Blob (async)

```javascript
const blob = await EAN13Renderer.toBlob('978020137962');
// Use with FormData, save, etc.
```

### Validation

```javascript
// Validate EAN-13 code
EAN13Renderer.validate('9780201379624'); // true
EAN13Renderer.validate('1234567890123'); // false (invalid checksum)

// Calculate checksum for 12-digit code
EAN13Renderer.calculateChecksum('978020137962'); // 4
```

## API Reference

### `EAN13Renderer.render(canvas, code, options?)`

Renders barcode to canvas element.

- `canvas` - Canvas element or CSS selector
- `code` - 12 or 13 digit EAN code (12 digits: checksum auto-calculated)
- `options` - Optional rendering options

Returns the canvas element.

### `EAN13Renderer.toDataURL(code, options?)`

Returns barcode as PNG data URL.

### `EAN13Renderer.toBlob(code, options?)`

Returns Promise that resolves to PNG Blob.

### `EAN13Renderer.validate(code)`

Returns `true` if code is valid EAN-13.

### `EAN13Renderer.calculateChecksum(code12)`

Returns check digit (0-9) for 12-digit code.

### `EAN13Renderer.encode(code)`

Returns `{ encoding: string, fullCode: string }` with binary encoding.

### `EAN13Renderer.DEFAULTS`

Object containing default option values.

## License

**Proprietary License** - Copyright (c) 2024 ZenBlock. All Rights Reserved.

### Permitted Use (Free)
- Personal, non-commercial use
- Educational and evaluation purposes

### Requires Commercial License
- Commercial use of any kind
- Redistribution or resale
- Modification for commercial purposes
- Inclusion in commercial products or services

For commercial licensing inquiries, contact: sebastian.qbiak+license@gmail.com
