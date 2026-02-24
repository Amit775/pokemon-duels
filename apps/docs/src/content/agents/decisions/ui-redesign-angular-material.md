---
title: "UI/UX Redesign with Angular Material"
description: "Complete UI overhaul using Angular Material M3 dark theme"
date: 2026-02-24
---

# UI/UX Redesign with Angular Material

## Context

The original client UI was built with custom CSS and emoji-based icons. The design was inconsistent between pages (light theme on game board, dark on multiplayer) and lacked a professional, cohesive look. A complete overhaul was needed.

## Decision

Adopt **Angular Material (M3)** with a **dark violet theme** as the design system for the entire client application.

## Key Choices

| Choice | Selected | Rationale |
|--------|----------|-----------|
| Component library | Angular Material 21.x | Official Angular UI library, M3 support, built-in accessibility |
| Theme | Dark with violet palette | Gaming aesthetic, consistent across pages |
| Icons | Material Icons | Replace emojis with professional icon set |
| Customization | CSS custom properties (`--mat-sys-*`) | Theme-aware colors, no hardcoded values |
| Responsive approach | No media queries | Material components + flexbox handle mobile naturally |

## Implementation

### Theme Configuration (`styles.scss`)
```scss
@use '@angular/material' as mat;

html {
  color-scheme: dark;
  @include mat.theme((
    color: (primary: mat.$violet-palette, theme-type: dark),
    typography: Roboto,
    density: 0,
  ));
}
```

### Components Used
- `mat-toolbar` - App navigation bar
- `mat-card` - Lobby create/join cards, waiting room
- `mat-button` / `mat-flat-button` / `mat-icon-button` - All buttons
- `mat-form-field` + `matInput` - Room code input
- `mat-chip` - Player badges, turn indicators
- `mat-icon` - All icons (replaced emojis)
- `mat-spinner` - Loading states

### Color Strategy
- UI chrome: Material CSS variables (`--mat-sys-surface`, `--mat-sys-primary`, etc.)
- Game elements (player colors, element types): Keep explicit colors for gameplay clarity
  - Player 1: `#42a5f5` (blue)
  - Player 2: `#ef5350` (red)
  - Water: `#42a5f5`, Fire: `#ef5350`, Grass: `#66bb6a`

## Files Modified

All component `.ts`, `.html`, and `.scss` files in `apps/client/src/app/` were updated. Key additions:
- `styles.scss` - Material theme configuration
- `index.html` - Roboto font + Material Icons CDN

## Trade-offs

- **Bundle size**: Angular Material adds to bundle, but tree-shaking keeps it manageable
- **Style budgets**: Game board/multiplayer SCSS files slightly exceed 4KB budget due to game rendering styles
- **Board canvas**: Kept custom CSS for game rendering (container queries, absolute positioning) as Material components don't apply to game mechanics
