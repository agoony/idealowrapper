# IdealoWrapper

IdealoWrapper is a Stream Deck plugin that displays a product image and current price from an Idealo product page. It periodically refreshes the product information and alerts when the price or currency changes.

## Features

- Displays the product image and formatted price on a Stream Deck key.
- Opens the configured Idealo page when the key is pressed.
- Checks for price changes and displays the Stream Deck alert indicator when the price or currency changes.
- Supports refresh choices of 1, 15, and 30 minutes, and 1, 3, and 12 hours.
- Restricts configured links to HTTPS Idealo domains.

The action currently enforces a minimum refresh interval of 2 minutes. Therefore, choosing the 1-minute option still refreshes every 2 minutes.

## Install

Install the included `com.jordi-bargans.idealowrapper.streamDeckPlugin` package by opening it with Stream Deck. After installation, add the **Producto Idealo** action to a key, enter an Idealo product URL, and choose a refresh interval in the action settings.

The plugin manifest requires Stream Deck 7.1 or later. It declares support for Windows 10 or later and macOS 12 or later.

## Build from source

Requirements: Node.js and npm.

```sh
npm install
npm run build
```

Rollup writes the compiled plugin to `com.jordi-bargans.idealowrapper.sdPlugin/bin/plugin.js`.

For development, run:

```sh
npm run watch
```

The watch script rebuilds the plugin and attempts to restart it through the Stream Deck CLI.

## Project layout

- `src/idealo.ts` fetches product metadata and formats prices.
- `src/actions/idealo-product.ts` implements the Stream Deck action, refresh timer, and price-change alert.
- `com.jordi-bargans.idealowrapper.sdPlugin/manifest.json` defines the plugin and action metadata.
- `com.jordi-bargans.idealowrapper.sdPlugin/ui/product.html` defines the action settings.