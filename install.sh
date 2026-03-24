#!/usr/bin/env bash
set -euo pipefail

REPO="notlabel/notlabel-cli"
BIN_NAME="notlabel"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  arm64|aarch64) ARCH="arm64" ;;
  x86_64|amd64) ARCH="x64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

ASSET="${BIN_NAME}-${OS}-${ARCH}.tar.gz"
CHECKSUMS="checksums.txt"
BASE_URL="https://github.com/${REPO}/releases/latest/download"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Installing ${BIN_NAME} for ${OS}/${ARCH}..."
curl --proto '=https' --tlsv1.2 --retry 3 --retry-delay 1 -fsSL "${BASE_URL}/${ASSET}" -o "${TMP_DIR}/${ASSET}"
curl --proto '=https' --tlsv1.2 --retry 3 --retry-delay 1 -fsSL "${BASE_URL}/${CHECKSUMS}" -o "${TMP_DIR}/${CHECKSUMS}"

if command -v shasum >/dev/null 2>&1; then
  ACTUAL_SHA="$(shasum -a 256 "${TMP_DIR}/${ASSET}" | awk '{print $1}')"
elif command -v sha256sum >/dev/null 2>&1; then
  ACTUAL_SHA="$(sha256sum "${TMP_DIR}/${ASSET}" | awk '{print $1}')"
else
  echo "No SHA256 tool found (shasum/sha256sum)."
  exit 1
fi

EXPECTED_SHA="$(awk -v asset="$ASSET" '$2 == asset {print $1}' "${TMP_DIR}/${CHECKSUMS}")"
if [ -z "$EXPECTED_SHA" ]; then
  echo "Checksum not found for ${ASSET}"
  exit 1
fi
if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "Checksum mismatch for ${ASSET}"
  exit 1
fi

FOUND_BIN="false"
while IFS= read -r entry; do
  if [ "$entry" = "${BIN_NAME}" ]; then
    FOUND_BIN="true"
    break
  fi
done < <(tar -tzf "${TMP_DIR}/${ASSET}")
if [ "$FOUND_BIN" != "true" ]; then
  echo "Archive does not contain expected binary: ${BIN_NAME}"
  exit 1
fi
tar -xzf "${TMP_DIR}/${ASSET}" -C "${TMP_DIR}" "${BIN_NAME}"
if [ ! -x "${TMP_DIR}/${BIN_NAME}" ]; then
  echo "Extracted binary is missing or not executable."
  exit 1
fi

INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
USE_SUDO=""
if [ ! -w "$INSTALL_DIR" ]; then
  if [ -d "$HOME/.local/bin" ] || mkdir -p "$HOME/.local/bin"; then
    INSTALL_DIR="$HOME/.local/bin"
  else
    USE_SUDO="sudo"
  fi
fi

if [ ! -w "$INSTALL_DIR" ] && [ -z "$USE_SUDO" ]; then
  USE_SUDO="sudo"
fi

echo "Installing to ${INSTALL_DIR}/${BIN_NAME}"
$USE_SUDO mkdir -p "$INSTALL_DIR"
$USE_SUDO install -m 755 "${TMP_DIR}/${BIN_NAME}" "${INSTALL_DIR}/${BIN_NAME}"

echo "Installed ${BIN_NAME} successfully."
echo "Run: ${BIN_NAME} --version"
if ! command -v "$BIN_NAME" >/dev/null 2>&1; then
  echo "Note: ${INSTALL_DIR} is not in PATH for this shell session."
  echo "Add it to PATH and restart shell if needed."
fi
