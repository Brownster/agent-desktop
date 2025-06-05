#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-staging}

pnpm nx deploy:$ENVIRONMENT aws-cdk
