# QuantumQ

QuantumQ is a puzzle game about quantum circuits and logic gates. This rewrite contains the 38 puzzles and four sandboxes from the original Godot app.

## Web development

Use Node.js 22.12+ or 24 LTS.

```sh
npm ci
npm run dev
npm run check
npm test
npm run format
npm run format:check
npm run build
```

Host the contents of `dist/` on a static server. Progress, custom packs, and the X/⊕ setting are stored locally in each browser. To test the production bundle in Chromium, run `npx playwright install chromium` and then `npm run test:e2e`.

## Native builds

Install Rust and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```sh
cargo install tauri-cli --version 2.8.4 --locked
npm ci
cargo tauri dev
cargo tauri build --ci
```

On Linux, the build produces an AppImage and a Debian package. Use a Linux build host as old as the oldest distribution you plan to support. On Windows, the build produces an NSIS setup executable. The **Build QuantumQ** GitHub Actions workflow can build both desktop packages and an Android test APK on demand.

For Android, install a full JDK 17, SDK platform 36, Android build tools, and the NDK. Set `JAVA_HOME`, `ANDROID_HOME`, and `NDK_HOME` to those installations. The generated Android project is included because it contains the app's landscape and Back behavior.

```sh
rustup target add aarch64-linux-android x86_64-linux-android
cargo tauri android dev
cargo tauri android build --ci --debug --apk --target aarch64 --target x86_64
```

For a Google Play build, set `QUANTUMQ_KEYSTORE` to the absolute path of the registered upload keystore and provide `QUANTUMQ_KEYSTORE_PASSWORD`, `QUANTUMQ_KEY_ALIAS`, and `QUANTUMQ_KEY_PASSWORD` in the environment. Verify the version code in `src-tauri/tauri.conf.json` against Play Console before building an update to `com.ph.quantumq`.

```sh
cargo tauri android build --ci --aab
```

## Custom level packs

Import ZIP packs below Sandbox. Each pack can define its own sections, puzzles, and gates. Start with the [example pack](examples/starter-pack/pack.json) and see the [custom pack guide](CUSTOM_PACKS.md) for authoring and import instructions.

## Game core and saves

`packages/core` exports `createGameApp({ storage })`, the puzzle catalog, and the pure circuit evaluator. It has no UI or native dependencies. Svelte subscribes to the state snapshot and calls the same game methods used by the Node tests. The parity tests compare state vectors against outputs captured from the original Godot evaluator across all 42 boards.

Run `npm run build:core` to compile the headless package for direct use in Node.

```js
import { createGameApp, createMemoryStorage } from "@quantumq/core";

const game = await createGameApp({ storage: createMemoryStorage() });
game.openLevel(0);
console.log(game.evaluate());
```

On first launch without a versioned save, the installed app checks for the original `savegame.save` and `optigame.save` in the Godot user directory. An Android upgrade requires the same app ID and an update-compatible signing certificate for the OS to retain those files. The importer leaves the original files in place.

The game and original assets are by Rayhan Alghiffari Azizi. See [the game license](LICENSE.txt) and the bundled font notices in `public/assets/licenses/`.
