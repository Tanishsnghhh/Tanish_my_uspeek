#!/usr/bin/env bash
# Install PortAudio (system dependency for pyaudio)
# Usage: sh ./scripts/install_portaudio.sh

set -euo pipefail

OS_NAME="$(uname -s)"

if [ "$OS_NAME" = "Darwin" ]; then
  # macOS (Homebrew)
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Install Homebrew first: https://brew.sh/"
    exit 1
  fi
  echo "Installing portaudio via Homebrew..."
  brew install portaudio
  echo "Done. You can now (inside your venv) run: python -m pip install pyaudio"
  exit 0
fi

if [ -f /etc/debian_version ]; then
  echo "Detected Debian/Ubuntu. Installing portaudio19-dev and libportaudio2..."
  sudo apt-get update
  sudo apt-get install -y libportaudio2 portaudio19-dev
  echo "Done. You can now (inside your venv) run: python -m pip install pyaudio"
  exit 0
fi

echo "Unsupported OS. Please install PortAudio manually. See https://portaudio.com/"
exit 1
