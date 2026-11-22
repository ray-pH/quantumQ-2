#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' "Usage: bash scripts/build-native.sh {android|linux|windows|all}"
}

case "${1:-}" in
  android|linux|windows|all) target=$1 ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

if [[ "$target" == android || "$target" == all ]]; then
  if [[ -n "${QUANTUMQ_ANDROID_ENV:-}" ]]; then
    source "$QUANTUMQ_ANDROID_ENV"
  fi
fi

project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project_dir"
output_dir=${QUANTUMQ_ARTIFACT_DIR:-"$project_dir/artifacts/native"}
mkdir -p -- "$output_dir"

cargo_target_dir() {
  (cd src-tauri && cargo metadata --locked --format-version 1 --no-deps) |
    node -p 'JSON.parse(require("node:fs").readFileSync(0, "utf8")).target_directory'
}

build_android() {
  local build_outputs=src-tauri/gen/android/app/build/outputs
  local targets=(--target aarch64 --target x86_64)

  cargo tauri android build --ci --debug --apk "${targets[@]}" -- --locked
  cp -p -- "$build_outputs/apk/universal/debug/app-universal-debug.apk" \
    "$output_dir/QuantumQ-android-debug.apk"

  cargo tauri android build --ci --aab "${targets[@]}" -- --locked
  cp -p -- "$build_outputs/bundle/universalRelease/app-universal-release.aab" \
    "$output_dir/QuantumQ-android-release.aab"
}

build_linux() (
  local target_dir version
  target_dir=$(cargo_target_dir)
  version=$(node -p 'require("./src-tauri/tauri.conf.json").version')

  if [[ ! -c /dev/fuse ]]; then
    export APPIMAGE_EXTRACT_AND_RUN=1
  fi
  cargo tauri build --ci --bundles appimage -- --locked
  local appimages=( "$target_dir/release/bundle/appimage/QuantumQ_${version}_"*.AppImage )
  if [[ ${#appimages[@]} -ne 1 || ! -f "${appimages[0]}" ]]; then
    printf '%s\n' "Expected one AppImage for version $version in $target_dir." >&2
    return 1
  fi
  cp -p -- "${appimages[0]}" "$output_dir/"
)

build_windows() {
  local rust_target target_dir release_dir portable_dir
  case "$(uname -s)" in
    Linux) rust_target=x86_64-pc-windows-gnu ;;
    MINGW*|MSYS*|CYGWIN*) rust_target=x86_64-pc-windows-msvc ;;
    *) printf '%s\n' "Use Linux or Windows with Bash to build the Windows executable." >&2; return 1 ;;
  esac
  target_dir=$(cargo_target_dir)
  release_dir="$target_dir/$rust_target/release"

  cargo tauri build --ci --no-bundle --target "$rust_target" -- --locked
  if [[ "$rust_target" == x86_64-pc-windows-gnu ]]; then
    portable_dir="$output_dir/windows-portable"
    mkdir -p -- "$portable_dir"
    cp -p -- "$release_dir/quantumq.exe" "$portable_dir/QuantumQ.exe"
    cp -p -- "$release_dir/WebView2Loader.dll" "$portable_dir/"
    (cd "$portable_dir" && zip -q -FS ../QuantumQ-windows-portable.zip QuantumQ.exe WebView2Loader.dll)
  else
    cp -p -- "$release_dir/quantumq.exe" "$output_dir/QuantumQ-windows-x86_64.exe"
  fi
}

case "$target" in
  android) build_android ;;
  linux) build_linux ;;
  windows) build_windows ;;
  all)
    build_linux
    build_windows
    build_android
    ;;
esac

printf '\nArtifacts are in %s\n' "$output_dir"
