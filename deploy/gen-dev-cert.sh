#!/bin/sh
# Self-signed certificate for the development nginx: ssl_certificates/labmango.{crt,key}.
set -eu
dir="$(dirname "$0")/../ssl_certificates"
name="${1:-labmango}"
mkdir -p "$dir"
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    -keyout "$dir/$name.key" -out "$dir/$name.crt"
echo "written: $dir/$name.crt and $dir/$name.key"
