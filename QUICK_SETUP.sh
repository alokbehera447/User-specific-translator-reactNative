#!/bin/bash

# Quick Setup Script for User Translator Mobile App
# This script sets up the project on any system

set -e

echo "=========================================="
echo " User Translator Mobile App - Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

echo ""
echo "Installing dependencies..."
npm install

# Install worklets for reanimated
echo ""
echo "Installing react-native-worklets..."
npm install react-native-worklets

echo ""
echo "Setting up iOS (if on macOS)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v pod >/dev/null 2>&1; then
        cd ios
        pod install
        cd ..
        echo -e "${GREEN}✓ iOS dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠ CocoaPods not found. Skipping iOS setup.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not on macOS. Skipping iOS setup.${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "To run the app:"
echo "  Android: npm run android"
echo "  iOS:     npm run ios"
echo ""
echo "To start development server:"
echo "  npm start"
echo ""
