#!/usr/bin/env bash
set -euo pipefail

echo "StoryGalore platform-native bootstrap"
echo ""
echo "1. Create the single Astro web application with the pinned Astro CLI version."
echo "   The canonical application root is apps/web."
echo ""
echo "2. Add Svelte using the official Astro integration."
echo ""
echo "3. Add @astrojs/node using the official Astro integration/package flow."
echo ""
echo "4. Initialize the Appwrite project and Site with the official Appwrite CLI."
echo "   The Site root is apps/web, framework is astro, and Site adapter is ssr."
echo ""
echo "5. Inspect generated output, register it, then implement StoryGalore contracts."
echo ""
echo "No platform-specific generated structure may be hand-authored."
