#!/bin/bash

set -Eeuxo pipefail

fetch v8
pushd v8
git checkout 568979f4d891bafec875fab20f608ff9392f4f29
gclient sync
./tools/dev/gm.py x64.release
popd
