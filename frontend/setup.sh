#!/usr/bin/env bash
cd .
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Running TypeScript check..."
npm run typecheck

echo "Building application..."
npm run build

echo "Frontend setup complete!"
