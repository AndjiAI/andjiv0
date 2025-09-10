#!/bin/bash
# Build script for Render deployment of web app

# Install Bun dependencies for the entire monorepo
echo "Installing monorepo dependencies with Bun..."
bun install

# Build the web app (Bun will handle workspace dependencies)
echo "Building web app..."
cd web && bun run build