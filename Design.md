---
name: "Supabase"
colors:
  primary: "#3ecf8e"
  secondary: "#4d4d4d"
  success: "#3ecf8e"
  warning: "#f5c542"
  danger: "#e54d2e"
  info: "#667cdc"
  foreground: "#0f0f0f"
  background: "#fafafa"
  background-canvas: "#ffffff"
  background-bone: "#f5f5f5"
  surface: "#ffffff"
  surface-card: "#ffffff"
  surface-dark: "#f0f0f0"
  surface-deep: "#e8e8e8"
  ink: "#0f0f0f"
  body: "#171717"
  charcoal: "#424242"
  mute: "#525252"
  ash: "#737373"
  stone: "#a3a3a3"
  on-primary: "#ffffff"
  on-secondary: "#ffffff"
  on-background: "#0f0f0f"
  on-surface: "#0f0f0f"
  on-dark: "#fafafa"
  on-dark-mute: "rgba(250, 250, 250, 0.72)"
  link: "#00c573"
  ring-focus: "rgba(62, 207, 142, 0.4)"
  hero-warm: "#00c573"
  hero-glow: "#3ecf8e"
  hero-pink: "rgba(62, 207, 142, 0.3)"
  badge-success: "#3ecf8e"
  badge-warning: "#f5c542"
  badge-info: "#667cdc"
  hairline: "#f0f0f0"
  hairline-strong: "#d0d0d0"
  divider: "#e5e5e5"
  divider-dark: "#c0c0c0"
colors-dark:
  primary: "#3ecf8e"
  secondary: "#4d4d4d"
  success: "#3ecf8e"
  warning: "#f5c542"
  danger: "#e54d2e"
  info: "#667cdc"
  foreground: "#fafafa"
  background: "#171717"
  background-canvas: "#0f0f0f"
  background-bone: "#141414"
  surface: "#1a1a1a"
  surface-card: "#171717"
  surface-dark: "#141414"
  surface-deep: "#0f0f0f"
  ink: "#fafafa"
  body: "#fafafa"
  charcoal: "#b4b4b4"
  mute: "#b4b4b4"
  ash: "#898989"
  stone: "#4d4d4d"
  on-primary: "#ffffff"
  on-secondary: "#ffffff"
  on-background: "#fafafa"
  on-surface: "#fafafa"
  on-dark: "#fafafa"
  on-dark-mute: "rgba(250, 250, 250, 0.72)"
  link: "#00c573"
  ring-focus: "rgba(62, 207, 142, 0.5)"
  hero-warm: "#00c573"
  hero-glow: "#3ecf8e"
  hero-pink: "rgba(62, 207, 142, 0.3)"
  badge-success: "#3ecf8e"
  badge-warning: "#f5c542"
  badge-info: "#667cdc"
  hairline: "#1e1e1e"
  hairline-strong: "#393939"
  divider: "#242424"
  divider-dark: "#434343"
typography:
  display-xl:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "0"
  display-lg:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0"
  display-md:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "-0.16px"
  body-md:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-sm:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0"
  button-md:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.14
    letterSpacing: "0"
  caption:
    fontFamily: "Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0"
  code-md:
    fontFamily: "'Source Code Pro', 'Office Code Pro', Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "1.2px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "90px"
  section: "90px"
  band: "128px"
rounded:
  none: "0"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "16px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "8px 32px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "8px 32px"
    height: "40px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "8px 32px"
    height: "40px"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  checkbox:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
  radio:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
  switch:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: "24px"
  badge:
    backgroundColor: "{colors.badge-success}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code-md}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    height: "20px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "24px"
  progress-bar:
    backgroundColor: "{colors.border}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    height: "4px"
  alert-success:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  alert-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  tooltip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  navbar:
    backgroundColor: "{colors.background-canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
    height: "56px"
  tabs:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
  dropdown:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

## Overview

Born in a terminal window, Supabase is a dark-mode-native developer platform designed for builders who think in SQL queries and API endpoints. The visual identity channels the feel of a well-tuned command-line interface — information-dense, green-accented, and ruthlessly efficient.

The emerald green of `{colors.primary}` acts as a singular identity marker on near-black surfaces, appearing only where action is required. Every other interface element recedes into a hierarchy of dark grays defined by borders rather than shadows. This **border-defined depth** philosophy replaces traditional drop shadows with a system of hairline separators (`{colors.hairline}`), subtle outlines (`{colors.background-muted}`), and prominent dividers (`{colors.divider}`), creating depth through precision lines rather than atmospheric blur.

The emotional response is one of **controlled power** — the interface feels like a server rack: organized, capable, and quietly humming. There is no visual noise, no decorative flourishes, no unnecessary gradients. Every pixel earns its place through utility, and the green glow of `{colors.hero-glow}` on the hero section promises that this tool is alive, connected, and ready to build.


## Colors

### Brand & Accent

The palette is anchored by a single brand green `{colors.primary}` (`#3ecf8e`) — a cool, balanced emerald that reads as both technical and alive. Unlike consumer brands that saturate their interfaces with brand color, Supabase uses green **sparingly and deliberately**:

- **Primary CTAs**: Green fill `{colors.primary}` with white text `{colors.on-primary}`
- **Links**: A slightly deeper green `{colors.link}` (`#00c573`) for inline text links
- **Focus rings**: A translucent green `{colors.ring-focus}` wrapping interactive elements
- **Hero glow**: A gradient of `{colors.hero-warm}` to `{colors.hero-glow}` for the brand hero section
- **Brand backgrounds**: Subtle green at 10–15% opacity behind active states

The green never appears on large surface areas, never competes with content, and never overwhelms the dark canvas. When green appears, it commands attention.

### Surface

The surface hierarchy is a study in controlled contrast. In dark mode, surfaces step from deepest black to slightly lighter card tones:

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| background-canvas | `#ffffff` | `#0f0f0f` | Deepest page background |
| background | `#fafafa` | `#171717` | Page-level canvas |
| background-bone | `#f5f5f5` | `#141414` | Inset section groups |
| surface | `#ffffff` | `#1a1a1a` | Default element surface |
| surface-card | `#ffffff` | `#171717` | Card backgrounds |
| surface-dark | `#f0f0f0` | `#141414` | Secondary dark surface |
| surface-deep | `#e8e8e8` | `#0f0f0f` | Deepest surface (footer) |

The darkest value `{colors.background-canvas}` (`#0f0f0f`) is not pure black — it retains a whisper of near-black warmth that prevents eye strain during long coding sessions. Cards `{colors.surface-card}` sit one step lighter at `#171717`, creating separation through luminance contrast rather than shadow.

### Text

Text hierarchy follows a strict five-level contrast ladder against dark backgrounds:

| Token | Light Mode | Dark Mode | Role |
|-------|-----------|-----------|------|
| ink | `#0f0f0f` | `#fafafa` | Primary text, headings |
| body | `#171717` | `#fafafa` | Long-form body copy |
| charcoal | `#424242` | `#b4b4b4` | Secondary labels, metadata |
| mute | `#525252` | `#b4b4b4` | Supporting text, placeholders |
| ash | `#737373` | `#898989` | Tertiary information |
| stone | `#a3a3a3` | `#4d4d4d` | Disabled states |

The highest contrast level `{colors.ink}` (`#fafafa` in dark mode) is near-white rather than pure white, mirroring the interface's philosophy of avoiding extremes. Code and technical labels use `{colors.ink}` for maximum legibility, while secondary metadata in `{colors.charcoal}` (`#b4b4b4`) keeps the interface calm and readable.

### Semantic

Semantic colors follow Radix-inspired hues for clear, scannable communication:

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| success | Emerald green | `{colors.success}` | Positive states, completion |
| warning | Golden yellow | `{colors.warning}` (`#f5c542`) | Warnings, pending states |
| danger | Tomato red | `{colors.danger}` (`#e54d2e`) | Errors, destructive actions |
| info | Violet blue | `{colors.info}` (`#667cdc`) | Informational indicators |

Each semantic color maintains subtle background variants (at 10–15% opacity) and muted variants (at 15–25% opacity) for use in badges, alerts, and contextual indicators. Badges use `{colors.badge-success}`, `{colors.badge-warning}`, and `{colors.badge-info}` for scannable status labels.


## Typography

### Font Family

Supabase uses a dual-font system built for developer ergonomics:

**Circular** — The primary typeface for all UI text, headings, and body copy. A geometric sans-serif with warm, approachable letterforms that balance technical precision with human readability. Circular's uniform stroke weight and wide character spacing make it exceptionally legible at small sizes, critical for a data-dense developer interface.

**Source Code Pro** — The monospace companion for code blocks, technical labels, and system indicators. Its generous letter-spacing and distinctive character shapes (slashed zero, angled brackets) make code readable at small sizes.

**Font Stack & Substitutes:**
- Primary stack: `Circular, system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif`
- Monospace stack: `'Source Code Pro', 'Office Code Pro', Menlo, monospace`

When Circular is unavailable, `system-ui` provides a close system-native fallback with identical metrics.

### Hierarchy

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Use |
|-------|------------|------|--------|-------------|----------------|-----|
| display-xl | Circular | 4.5rem | 400 | 1.0 | 0 | Hero headlines, 72px brand statements |
| display-lg | Circular | 2.25rem | 400 | 1.25 | 0 | Section headings |
| display-md | Circular | 1.5rem | 400 | 1.33 | -0.16px | Card titles, feature headings |
| body-md | Circular | 1rem | 400 | 1.5 | 0 | Default body text |
| body-sm | Circular | 0.875rem | 400 | 1.43 | 0 | Captions, metadata, secondary text |
| button-md | Circular | 0.875rem | 500 | 1.14 | 0 | Button labels, navigation items |
| caption | Circular | 0.75rem | 400 | 1.33 | 0 | Footer, fine print, timestamps |
| code-md | Source Code Pro | 0.75rem | 400 | 1.33 | 1.2px | Code blocks, technical labels, badges |

### Principles

**Weight Restraint** — The type system uses only two weights: 400 (normal) for all body and display text, and 500 (medium) exclusively for interactive labels. There is no 600 or 700 in the default system. This restraint creates a calm, consistent texture across the interface — nothing screams for attention through boldness alone.

**The 1.00 Hero Leading** — `{typography.display-xl}` uses a precise 1.0 line-height, meaning the hero text occupies exactly the height of its glyphs. This creates a tight, architectural headline that feels engineered rather than typeset. The hero green glow `{colors.hero-glow}` backs this tight leading with atmospheric breathing room.

**Negative Tracking on Cards** — `{typography.display-md}` uses `-0.16px` letter-spacing, tightening card titles for a more composed, intentional feel. This mirrors the developer ethos of compact, information-dense layouts.

**Monospace as Ritual** — `{typography.code-md}` is rendered in Source Code Pro with `1.2px` wide letter-spacing — an unmistakable visual signal that "this is technical." Code blocks, SQL snippets, API endpoints, and badge labels all use this treatment, creating a consistent ritual around technical content.

### Note on Font Substitutes

Circular is a commercially licensed typeface (foundry: Lineto). It ships with Supabase via the design token system and is available to all internal applications. For third-party integrations or open-source derivatives, the fallback stack `system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif` provides a visually compatible alternative with similar geometric proportions and x-height. The monospace stack's `'Source Code Pro'` is available via Google Fonts as open-source, with `Menlo, monospace` as the macOS fallback.


## Layout & Spacing

The spacing system operates on an **8px base unit** (derived from the CSS `--spacing-5` token at `8px`), scaling from `{spacing.xxs}` (`4px`) up to `{spacing.band}` (`128px`).

### Semantic Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| {spacing.xxs} | 4px | Hairline gaps, icon padding |
| {spacing.xs} | 8px | Tight grouping, chip spacing |
| {spacing.sm} | 12px | Default inset, element pairs |
| {spacing.md} | 16px | Card padding, section internal |
| {spacing.lg} | 24px | Component groups, form spacing |
| {spacing.xl} | 32px | Section padding, modal content |
| {spacing.xxl} | 48px | Feature separation, hero inset |
| {spacing.xxxl} | 90px | Between major sections |
| {spacing.section} | 90px | Standard section vertical spacing |
| {spacing.band} | 128px | Maximum separation, page bands |

### Grid & Whitespace Philosophy

The spacing system follows a **additive scale** — each step represents a meaningful increase in spatial relationship rather than a strict mathematical progression. This means the distance between `{spacing.sm}` and `{spacing.md}` (12px to 16px) represents a relational shift from "tightly grouped" to "comfortably separated."

**Dramatic Section Spacing** — `{spacing.section}` (`90px`) and `{spacing.band}` (`128px`) provide generous breathing room between major page sections. This amplitude prevents dark-mode fatigue by giving the eyes rest zones between information-dense content blocks. The scale ensures that even on a dark canvas, the interface never feels claustrophobic.

**Whitespace as Information** — In a developer tool, spacing communicates hierarchy: tightly grouped elements (`{spacing.xs}` to `{spacing.sm}`) are related; widely separated elements (`{spacing.xxl}` to `{spacing.band}`) represent distinct functional zones. There is no decorative spacing — every gap serves an information architecture purpose.


## Elevation & Depth

### The No-Shadow Philosophy

Supabase rejects traditional CSS box-shadow elevation in favor of **border-defined depth**. Where other design systems create layers through blur and opacity, Supabase draws precision lines. This choice is deliberate: shadows feel atmospheric and imprecise; borders feel engineered and measurable.

### Level Table

| Level | Treatment (Dark Mode) | Use Case |
|-------|----------------------|----------|
| Level 0 | No border, no shadow | Page canvas `{colors.background-canvas}` |
| Level 1 | `0 0 0 1px #2e2e2e` — Single hairline | Standard cards, default surfaces |
| Level 2 | `0 0 0 1px #363636` — Stronger border | Hovered elements, elevated panels |
| Level 3 | `rgba(0,0,0,0.1) 0px 4px 12px, 0 0 0 1px #393939` — Border + subtle shadow | Modals, dropdowns, high-emphasis surfaces |
| Level 4 | `0 0 0 1px rgba(62,207,142,0.3)` — Green border glow | Focused, active, and brand-emphasis states |

**Border Colors:**
- `{colors.hairline}` (`#1e1e1e`) — Ultra-subtle edge definition, barely visible
- `{colors.border}` (`#2e2e2e`) — Standard element outline
- `{colors.border-hover}` (`#363636`) — Stronger separation on interaction
- `{colors.border-strong}` (`#393939`) — Maximum contrast border
- Green border `rgba(62, 207, 142, 0.3)` — Brand elevation, only on Level 4

### Decorative Depth

Beyond the elevation grid, Supabase uses **atmospheric green glow** on the hero section: `{colors.hero-warm}` (`#00c573`) blends into `{colors.hero-glow}` (`#3ecf8e`) with `{colors.hero-pink}` as a soft green fog. This is the only decorative depth in the system — a deliberate signal that the hero area is the "terminal window" through which users access the platform.

Scrollbar styling follows the border system: `{colors.scrollbar}` (`#2e2e2e`) at rest, `{colors.scrollbar-hover}` (`#363636`) on interaction — consistent with the border-defined depth language.


## Shapes

### Border Radius Scale

| Token | Value | Use Case |
|-------|-------|----------|
| {rounded.none} | 0 | Full-bleed sections, hero bands, nav bars |
| {rounded.xs} | 4px | Code blocks, inline tags, data table corners |
| {rounded.sm} | 6px | Ghost buttons, inputs, selects, tooltips |
| {rounded.md} | 8px | Cards, modals, alerts, standard containers |
| {rounded.lg} | 16px | Feature panels, hero sections, large containers |
| {rounded.full} | 9999px | Pills, badges, tabs, pagination, switches |

The radius language is intentionally **small and precise** — the system defaults to `{rounded.sm}` (`6px`) for interactive elements and `{rounded.md}` (`8px`) for containers. The `{rounded.lg}` value is reserved for large feature panels where geometric generosity signals importance. `{rounded.full}` creates pill shapes exclusively for status badges, tab indicators, and toggle controls.

### Photography Geometry

Supabase is a developer platform, not a media gallery. Images appear in limited contexts:

- **Avatar thumbnails**: Circular (border-radius: `{rounded.full}`), 32px × 32px
- **OG preview images**: 16:9 aspect ratio, `{rounded.md}` corners
- **Code snippet backgrounds**: Sharp corners `{rounded.none}`, full-bleed within cards
- **Hero gradient**: Full-width, `{rounded.lg}` bottom corners transitioning to page content

When images appear, they carry `{rounded.md}` corner radius to match the card container, creating a unified geometry language across visual and non-visual elements.


## Components

### Buttons & Interaction

**Primary Button** `{components.button-primary}`
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding 8px 32px, height 40px
- Hover: Lighter green background (opacity shift)
- Active/pressed: Deeper green `#2ea06b`
- Focus: `{colors.ring-focus}` ring outline

**Secondary Button** `{components.button-secondary}`
- Background transparent, text `{colors.ink}`, type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding 8px 32px, height 40px
- 1px border in `{colors.border}` at rest, `{colors.border-hover}` on interaction
- Focus: `{colors.ring-focus}` ring outline

### Inputs & Selection

**Text Input** `{components.text-input}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding 8px 12px, height 40px
- Border: 1px `{colors.border}` at rest, 1px `{colors.border-hover}` on hover
- Focus: `{colors.ring-focus}` ring outline + border shifts to green
- Placeholder: `{colors.foreground-placeholder}` (`#4d4d4d` in dark mode)

**Select** `{components.select}`
- Same spec as text input with custom chevron indicator
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding 8px 12px, height 40px

**Checkbox** `{components.checkbox}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.sm}` — square with subtle corner radius
- Checked: `{colors.primary}` fill with white checkmark indicator
- Checkbox indicator shape: `2px` stroke-width checkmark

**Radio** `{components.radio}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.full}` — perfect circle
- Selected: `{colors.primary}` fill with dot indicator

**Switch** `{components.switch}`
- Background track: `{colors.surface}`, thumb: `{colors.ink}`
- Rounded: `{rounded.full}`, height 24px
- Active: Track fills `{colors.primary}`, thumb shifts right

### Chips & Controls

**Badge** `{components.badge}`
- Background `{colors.badge-success}`, text `{colors.on-dark}`, type `{typography.code-md}`
- Rounded: `{rounded.full}`, padding 2px 8px, height 20px
- Uppercase styling with wide letter-spacing `1.2px` for technical labels
- Variants: `{colors.badge-warning}` (gold) and `{colors.badge-info}` (violet)

**Tabs** `{components.tabs}`
- Background transparent, text `{colors.charcoal}`, type `{typography.button-md}`
- Rounded: `{rounded.full}` — pill-shaped tab indicators
- Active tab: `{colors.primary}` text + green underline or fill background
- Hover tab: `{colors.charcoal}` → `{colors.ink}` text transition

### Data & Containers

**Card** `{components.card}`
- Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.md}`, padding 16px
- Border: 1px `{colors.border-subtle}` (`#242424` in dark mode)
- No shadow — depth comes from the border against the page canvas `{colors.background}`

**Modal** `{components.modal}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-md}`
- Rounded: `{rounded.md}`, padding 24px
- Overlay background: `{colors.overlay}` (`rgba(0, 0, 0, 0.7)` in dark mode)
- Elevation: Level 3 (border + subtle shadow `rgba(0,0,0,0.1) 0px 4px 12px, 0 0 0 1px #393939`)

**Progress Bar** `{components.progress-bar}`
- Track background `{colors.border}`, fill `{colors.primary}`
- Rounded: `{rounded.full}`, height 4px
- Indeterminate state: animated green gradient

### Feedback Components

**Alert (Success)** `{components.alert-success}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-sm}`
- Rounded: `{rounded.md}`, padding 12px 16px
- Left accent border: 3px `{colors.success}`
- Subtle green background at 10% opacity behind icon

**Alert (Danger)** `{components.alert-danger}`
- Background `{colors.surface}`, text `{colors.danger}`, type `{typography.body-sm}`
- Rounded: `{rounded.md}`, padding 12px 16px
- Left accent border: 3px `{colors.danger}`

**Tooltip** `{components.tooltip}`
- Background `{colors.surface-dark}`, text `{colors.on-dark}`, type `{typography.caption}`
- Rounded: `{rounded.sm}`, padding 4px 8px
- Appears on hover with `150ms` fast animation

### Navigation

**Navbar** `{components.navbar}`
- Background `{colors.background-canvas}`, text `{colors.ink}`, type `{typography.button-md}`
- Rounded: `{rounded.none}`, height 56px
- Bottom border: 1px `{colors.divider}` (`#242424` in dark mode)
- Logo area: `{colors.hero-glow}` for brand mark

**Dropdown** `{components.dropdown}`
- Background `{colors.surface}`, text `{colors.ink}`, type `{typography.body-sm}`
- Rounded: `{rounded.sm}`, padding 8px 16px
- Menu items: `{colors.surface}` background, `{colors.charcoal}` secondary metadata
- Active/hover item: `{colors.surface-hover}` (`#242424`)


## Do's and Don'ts

### Do

- ✓ **Do use `{colors.background-canvas}` (`#0f0f0f`) as the primary dark background** — it is near-black, not pure black, and prevents eye strain during extended sessions
- ✓ **Do use `{colors.primary}` (`#3ecf8e`) sparingly as a singular identity marker** — green appears on CTAs, links, focus rings, and active indicators only
- ✓ **Do use weight 400 (`{typography.display-xl}` through `{typography.body-md}`) as the default** — the type system derives character from weight restraint
- ✓ **Do use 1.0 line-height on `{typography.display-xl}` hero text** — the tight leading is a signature of the developer aesthetic
- ✓ **Do define depth through borders instead of shadows** — use `{colors.border}`, `{colors.border-hover}`, and `{colors.border-subtle}` to create surface hierarchy
- ✓ **Do use `{rounded.sm}` (`6px`) for interactive elements and `{rounded.md}` (`8px`) for containers** — the small radius language is precise and technical
- ✓ **Do apply `{typography.code-md}` with `Source Code Pro` for all technical labels** — code styling signals "this is operational"

### Don't

- ✗ **Don't use CSS box-shadow elevation as the primary depth mechanism** — the system is border-defined, not shadow-defined
- ✗ **Don't apply green (`{colors.primary}`) to large surface areas, page backgrounds, or decorative elements** — green is an accent, not a canvas
- ✗ **Don't use bold type weights (600, 700) for emphasis** — the system achieves hierarchy through size, spacing, and color, not weight
- ✗ **Don't increase `{typography.display-xl}` leading above 1.0** — the tight hero line-height is a defining characteristic
- ✗ **Don't use pure black (`#000000`) or pure white (`#ffffff`) for text** — `{colors.ink}` and `{colors.ink}` are near-black/near-white for readability
- ✗ **Don't add decorative shadows or gradients outside of the defined elevation system** — the only decorative depth is the hero green glow `{colors.hero-glow}`
- ✗ **Don't use `{rounded.full}` for standard buttons** — pill shapes are reserved for badges, tabs, and toggles; buttons use `{rounded.sm}`


## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > 600px | Full multi-column layout, horizontal nav, expanded sidebars |
| Mobile | ≤ 600px | Single column, hamburger nav, stacked grids |

Supabase uses a single responsive breakpoint at **600px**, consistent with its developer-tool focus on desktop-first interfaces. The mobile experience is a considered reduction, not a separate design.

### Touch Targets

- Minimum touch target: 44px × 44px (WCAG 2.1 compliant)
- Mobile button height: 44px (desktop is 40px via `{components.button-primary}`)
- Nav items: minimum 48px tap area on mobile
- Form inputs: height remains 40px, padding increases to 14px for finger clearance

### Collapsing Strategy

- **Hero area**: `{typography.display-xl}` (`4.5rem` / 72px) scales down to `{typography.display-lg}` (`2.25rem` / 36px) on mobile
- **Grid layouts**: Multi-column grids collapse to single column at ≤ 600px
- **Navigation**: Horizontal nav collapses to hamburger menu; dropdown menus become full-screen overlays
- **Section spacing**: `{spacing.section}` (`90px`) reduces to `{spacing.xxl}` (`48px`); `{spacing.band}` (`128px`) reduces to `{spacing.xxxl}` (`90px`)
- **Cards**: Inline card groups stack vertically; card padding remains `{spacing.md}` (`16px`)
- **Data tables**: Scroll horizontally on mobile with sticky first column

### Image Behavior

- Hero gradient: Full-width with `100vw` always, no DPR concerns
- Avatar thumbnails: 32px on desktop, 28px on mobile — `{rounded.full}` circular crop
- OG/social images: 16:9 aspect ratio, `max-width: 100%`, center-cropped
- Icons: SVG-based, scale with font-size, no pixelation at any DPR
- Code snippet backgrounds: Full-bleed within card containers, `overflow-x: auto` for long lines


## Iteration Guide

1. **Focus on one component at a time.** Start with the component that has the most user-facing surface area (buttons, inputs, cards) and iterate its token references before moving to secondary components.

2. **Reference tokens directly.** Never hardcode hex values, px dimensions, or font stacks in implementation code. Use the canonical token paths: `{colors.primary}`, `{typography.body-md}`, `{rounded.sm}`, `{spacing.md}`, `{components.button-primary}`.

3. **Run validation after every change.** Check that all token paths resolve correctly in the design-token.json and that no CSS variables reference undefined tokens. Validate dark mode values match their light mode counterparts in structure.

4. **Add new variants as separate entries.** When a component needs a new state (e.g., `button-primary-loading`), define it as a distinct component entry in the YAML front matter with its own `backgroundColor`, `textColor`, and `typography` references.

5. **Keep brand accent scarce.** Every new use of `{colors.primary}` green should be reviewed: "Does this green serve a functional purpose, or am I decorating?" Green is the identity marker, not the workhorse.

6. **Test in both modes.** Every component change must be verified in both light mode (`colors.*`) and dark mode (`colors-dark.*`). The dark-mode-native nature means dark mode is the primary experience.

7. **Maintain the border-defined depth language.** When adding new elevated components, choose border contrast over shadow opacity. Use level 1–4 of the elevation system — never invent a new shadow level.

8. **Document assumptions.** If a component behavior is inferred rather than specified, add it to the Known Gaps section so future iterations can formalize it.


## Known Gaps

- **Exact Radix HSL values** — Semantic colors (`{colors.success}`, `{colors.warning}`, `{colors.danger}`, `{colors.info}`) are documented as hex values but their Radix HSL equivalents (hue, saturation, lightness) are not specified. Future iterations should include HSL values for programmatic color manipulation.
- **Animation curves** — Transition easing is documented as `ease` / `ease-in` / `ease-out` / `ease-in-out` but specific cubic-bezier curves per interaction type (button press, modal open, dropdown appear) are not defined.
- **Elevation shadow values per component** — Level 3 elevation combines a subtle shadow with a border, but the exact shadow color (`rgba(0,0,0,0.1)`) and blur radius (`12px`) are only defined at the system level, not per component.
- **Component pressed/disabled states** — Button disabled styling, input disabled styling, and pressed state for non-button components (cards, dropdown items) are described in prose but not formalized as YAML token entries.
- **Data visualization palette** — Chart colors, graph line colors, and statistical indicator colors beyond the semantic palette are not documented.
- **Icon system** — Icon sizes, stroke widths, color application (inherit vs. explicit), and icon component tokens are not defined.
- **Focus ring specifications** — `{colors.ring-focus}` is defined as a color value (`rgba(62, 207, 142, 0.4)`) but the ring width (2px recommended), offset, and whether it uses `outline` or `box-shadow` are implementation choices not yet specified.
- **Typography responsive scaling** — Only the hero `{typography.display-xl}` has a defined mobile reduction. The responsive behavior of `{typography.display-lg}`, `{typography.display-md}`, and other sizes is not specified for the 600px breakpoint.
- **Code block specific tokens** — Code blocks use `{typography.code-md}` but syntax highlighting colors, line number styling, and code block background treatment are not formalized.
- **Spacing unit scaling** — The spacing system is described at fixed px values; responsive spacing reduction ratios (e.g., "section spacing halves at mobile") are heuristic rather than tokenized.