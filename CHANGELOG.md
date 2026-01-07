# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-07

### Added

- **Bundle Presets**: Introduced predefined schema collections for common use cases
  - Added `preset:css` - Modern CSS color types (CSS Color Level 4+) including hex-color, rgb-color, hsl-color, oklch-color, oklab-color, and css-color types with lighten, darken, saturate, desaturate, mix, and invert functions
  - New CLI command `presets` to list all available bundle presets
  - Support for combining presets with specific schemas (e.g., `bundle preset:css type:lab-color`)
  - Preset expansion system that automatically resolves `preset:name` to individual schema lists
