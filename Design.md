---
name: Grove
colors:
  primary: "#4a6741"
  secondary: "#d97757"
  success: "#5c9e42"
  warning: "#d4a017"
  danger: "#dc3545"
  info: "#4a90e2"
  background: "#faf8f5"
  surface: "#ffffff"
  foreground: "#374151"
  border: "#f3f4f6"
  overlay: "rgba(0, 0, 0, 0.5)"
colors-dark:
  primary: "#6b8a60"
  secondary: "#e08a6d"
  success: "#72b855"
  warning: "#e6b422"
  danger: "#f05365"
  info: "#6aa8f0"
  background: "#1a1915"
  surface: "#252320"
  foreground: "#e8e4dc"
  border: "#3a3730"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.25
  h1:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.3
  h2:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.35
  h3:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-xs:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
rounded:
  sm: 0.125rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
---

## Overview

Grove creates a **supportive digital space for fathers** — a place where the mood is "around the campfire" rather than "in the boardroom." Warm earth tones, gentle greens, and terracotta accents create an environment that feels safe for sharing, asking questions, and being vulnerable. Every design choice reinforces: "You're doing great, Dad."

## Colors

The palette is anchored by #4a6741 as the primary accent, with #6b8a60 for dark mode.

### Foundation

Grove's color story centers on **forest tranquility** (#4a6741) — a muted green that evokes trees, nature, stability, and growth. This is paired with **terracotta warmth** (#d97757) for accent moments, creating visual warmth without fire.

### The Nature Palette

**Primary — Grove Green (#4a6741)**: The signature forest green — muted, calming, stable. Used for primary actions and key interactive elements.

**Secondary — Terracotta (#d97757)**: A warm, earthy accent — like a sunset over the treeline. Used for highlights, notifications, and community-focused moments.

### Surface Hierarchy

| Level | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| Canvas | #faf8f5 | #1a1915 | Warm cream background |
| Surface | #ffffff | #252320 | Cards, elevated elements |
| Muted | #f3f1ed | #252320 | Subtle backgrounds |
| Subtle | #eae7e0 | #302d28 | Dividers, separators |

### Dark Mode: "Campfire After Dark"

Dark mode transforms Grove into a cozy nighttime space — deep charcoal backgrounds let the warm cream and forest green feel like a secure, firelit space.

**Core Principles:**

1. **Warm Darkness**: Not pure black — #1a1915 has warmth that feels like night sky, not void
2. **Green Remains Grounding**: Forest green maintains its calming presence even in dark mode
3. **Terracotta Glow**: The accent color becomes even more precious in the dark — warmth in darkness

**Dark Mode Token Mapping:**

| Light Mode | Dark Mode | Rationale |
|------------|-----------|-----------|
| #4a6741 (Primary) | #6b8a60 | Softer green for dark backgrounds |
| #faf8f5 (Canvas) | #1a1915 | Deep charcoal feels secure |
| #ffffff (Surface) | #252320 | Elevated surfaces in darkness |
| #d97757 (Secondary) | #e08a6d | Warmer terracotta in dark |

### Semantic Colors

| Token | Light | Dark |
|-------|-------|------|
| Background | #faf8f5 | #1a1915 |
| Surface | #ffffff | #252320 |
| Foreground | #374151 | #e8e4dc |
| Border | #f3f4f6 | #3a3730 |
| Primary | #4a6741 | #6b8a60 |
| Secondary | #d97757 | #e08a6d |
| Success | #5c9e42 | #72b855 |
| Warning | #d4a017 | #e6b422 |
| Danger | #dc3545 | #f05365 |
| Info | #4a90e2 | #6aa8f0 |

### Signature Details

- **Warm Cream Canvas**: #faf8f5 is the foundation — not stark white, not gray, but warm cream that feels like natural light through trees
- **Terracotta Accent**: Used sparingly for community moments, notifications, warmth highlights
- **Muted Green Primary**: The forest green is deliberately not vibrant — stability over excitement

## Typography

### Font Stack

**System Stack** — `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` for universal readability. Clean but not cold.

### Type Scale

| Role | Size | Weight | Line Height | Character |
|------|------|--------|-------------|-----------|
| Display | 32px | 700 | 1.25 | Welcome messages |
| H1 | 28px | 600 | 1.3 | Section headers |
| H2 | 22px | 600 | 1.35 | Card titles |
| H3 | 18px | 600 | 1.4 | Subsection headers |
| Body | 16px | 400 | 1.5 | Content, comments |
| Small | 14px | 400 | 1.5 | Secondary text |
| Micro | 12px | 500 | 1.33 | Badges, labels |

### The Warm Type Rule

Body text uses #374151 (a soft gray) rather than pure black — readable but not harsh. Headlines use the forest green for brand reinforcement.

## Layout & Spacing

The spacing system follows a 4px grid scale based on 0.25rem increments:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 0.25rem | Micro spacing within components |
| sm | 0.5rem | Standard element gaps |
| md | 1rem | Card padding, section spacing |
| lg | 1.5rem | Major section gaps |
| xl | 2rem | Page section separation |

The consistent 4px base creates comfortable breathing room throughout the interface. Cards use 1rem (16px) internal padding with 1.5rem (24px) between sections, maintaining the warm, unhurried feel of the community space.

## Elevation & Depth

### Shadow Philosophy

Grove uses **soft, natural shadows** — elevation that feels like morning mist rather than sharp edges. Shadows are tinted with the primary green, suggesting natural growth rather than industrial depth.

| Level | Treatment | Use |
|-------|-----------|-----|
| Level 0 | none | Flat elements, text |
| Level 1 | 0 1px 3px rgba(74,103,65,0.08), 0 1px 2px rgba(74,103,65,0.06) | Subtle hover |
| Level 2 | 0 4px 6px rgba(74,103,65,0.1), 0 2px 4px rgba(74,103,65,0.06) | Cards, dropdowns |
| Level 3 | 0 10px 25px rgba(74,103,65,0.15), 0 6px 10px rgba(74,103,65,0.08) | Modals, elevated cards |
| Level 4 | 0 20px 50px rgba(74,103,65,0.2), 0 10px 20px rgba(74,103,65,0.1) | Maximum elevation |

### Border Usage

Grove uses **very subtle borders** — #f3f4f6 for default borders, creating soft definition without hard edges. The overall feel is of elements floating on the warm cream canvas.

## Shapes

The shape language uses 0.125rem as the base corner radius, keeping elements friendly without being overly playful:

| Token | Value | Usage |
|-------|-------|-------|
| sm | 0.125rem | Subtle rounding |
| md | 0.5rem | Buttons, inputs |
| lg | 0.75rem | Cards |
| xl | 1rem | Larger containers |
| full | 9999px | Pills, badges |

The 0.5rem md radius gives buttons a friendly, approachable feel. Cards use 0.75rem lg radius, creating the soft, welcoming silhouette that matches the community tone. Pill shapes (9999px) are reserved for badges and tags.

## Components

### Buttons & Interaction

**Primary CTA**: Grove Green (#4a6741) background, white text, 8px rounded corners. On hover: darkens to #3d5535. On press: further darkens to #324828. The grounding, stable action.

**Secondary**: Terracotta (#d97757) background for community-focused actions — replies, reactions, sharing. Warm and inviting.

**Ghost Buttons**: Transparent with subtle green border — for tertiary actions.

### Cards & Containers

**Cards**: White surface, very subtle border (#f3f4f6), soft shadow. The card feels like a floating island of safety on the warm canvas.

**Post Cards**: Content-first layout with generous padding. Title, author info, preview text, engagement metrics.

**Comment Cards**: Nested with left indent, subtle left border (terracotta or green based on context).

### Inputs & Selection

**Text Inputs**: White background, subtle border, 8px radius. Focus state: green border with soft glow. Warm placeholder text (#d1d5db).

**Select Dropdowns**: Consistent styling with input, chevron indicator. Dropdown uses soft shadow.

**Checkboxes**: Custom styled with green check when active.

**Switches**: iOS-style toggle — green track when active, subtle gray when inactive.

### Feedback Components

**Toasts**: Floating panel with soft shadow, warm tint based on semantic color, icon + message.

**Badges**: Pill-shaped, warm colors for categories and tags.

## Do's and Don'ts

### Do

- **Use Grove Green for primary CTAs** — the forest green is calming, grounding, trustworthy
- **Apply the warm cream canvas** — #faf8f5 feels like natural light, not clinical white
- **Use terracotta for community moments** — warmth, not just another blue link
- **Keep shadows soft and diffused** — natural softness over sharp edges
- **Maintain green primary in dark mode** — grounding even after dark
- **Use soft gray text** — #374151 not harsh black — readable but warm

### Don't

- **Don't use vibrant colors** — Grove's palette is muted, stable, natural
- **Don't use aggressive shadows** — keep elevation soft, like morning mist
- **Don't use stark white backgrounds** — warm cream is foundational to the identity
- **Don't use pure black text** — soft gray maintains the warm, approachable tone
- **Don't use sharp corner radii** — 8px is the maximum, keep elements friendly
- **Don't make interactions feel transactional** — this is a community space, not a commerce site
