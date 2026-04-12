#!/usr/bin/env bash

set -euo pipefail

if [ ! -f "credentials/teeup-upload.jks" ]; then
  echo "Missing keystore: credentials/teeup-upload.jks" >&2
  exit 1
fi

cleanup() {
  stty echo
}

trap cleanup EXIT

printf 'ANDROID_UPLOAD_STORE_PASSWORD: '
stty -echo
read -r ANDROID_UPLOAD_STORE_PASSWORD
stty echo
printf '\n'

printf 'ANDROID_UPLOAD_KEY_PASSWORD: '
stty -echo
read -r ANDROID_UPLOAD_KEY_PASSWORD
stty echo
printf '\n'

export ANDROID_UPLOAD_STORE_PASSWORD
export ANDROID_UPLOAD_KEY_ALIAS='teeup-upload'
export ANDROID_UPLOAD_KEY_PASSWORD

EAS_BUILD_PLATFORM=android expo prebuild --platform android
cd android
EAS_BUILD_PLATFORM=android ./gradlew :app:bundleRelease
