# Note Generator Design System Guide

## Prompting Strategy for Copilot

When working with Copilot to generate UI components and styles, structure your comments in this order:

```typescript
// 1. Component Purpose
// PURPOSE: Describe what the component does and its role in the app

// 2. Design Tokens
// THEME: Specify custom colors, spacing, and typography values to use

// 3. Responsive Behavior
// RESPONSIVE: Define how the component should adapt across breakpoints

// 4. Interactive States
// STATES: List all interactive states (hover, active, disabled)

// 5. Accessibility Requirements
// A11Y: Specify accessibility requirements and ARIA attributes

// 6. Animation Preferences
// MOTION: Define transition and animation preferences
```

## Design Tokens

Guide Copilot to use these specific values for consistency:

```typescript
// Colors
const colors = {
  // Primary palette - Warm, inviting colors for a personal touch
  primary: {
    50: '#FFF9EC',
    100: '#FFE4B5',
    200: '#FFD700',
    300: '#FFA500',
    400: '#FF8C00',
    500: '#FF6B00',  // Primary brand color
    600: '#CC5500',
    700: '#994000',
    800: '#662B00',
    900: '#331500'
  },
  
  // Secondary palette - Cool, professional accents
  secondary: {
    50: '#F0F9FF',
    100: '#D1E8FF',
    200: '#A3D1FF',
    300: '#75BAFF',
    400: '#47A3FF',
    500: '#1A8CFF',  // Secondary brand color
    600: '#0066CC',
    700: '#004D99',
    800: '#003366',
    900: '#001A33'
  },

  // Neutral tones - Warm grays for a personal feel
  neutral: {
    50: '#FAF9F7',
    100: '#E8E6E1',
    200: '#D3CEC4',
    300: '#B8B2A7',
    400: '#A39E93',
    500: '#857F72',
    600: '#625D52',
    700: '#504A40',
    800: '#423D33',
    900: '#27241D'
  }
};

// Typography
const typography = {
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Newsreader, Georgia, serif',  // Serif for a letter-writing feel
    handwriting: 'Caveat, cursive'  // For personal touches
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  }
};

// Spacing
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem'
};
```

## Component Patterns

### Note Card Example
Guide Copilot to create components with these characteristics:

```typescript
// PURPOSE: Display a note with a paper-like appearance and handwriting touches
// THEME: Use warm neutrals and serif fonts for traditional feel
// RESPONSIVE: Stack elements on mobile, side-by-side on desktop
// STATES: Subtle hover elevation, active state pressed effect
// A11Y: Proper heading hierarchy, sufficient contrast
// MOTION: Gentle elevation change on hover

const NoteCard = () => {
  return (
    <div className="
      rounded-lg 
      bg-neutral-50 
      shadow-sm 
      hover:shadow-md 
      transition-shadow 
      duration-200 
      p-6 
      border 
      border-neutral-200
    ">
      <h3 className="
        font-heading 
        text-xl 
        text-neutral-800 
        mb-4
      ">
        {title}
      </h3>
      <p className="
        font-handwriting 
        text-lg 
        text-neutral-700 
        leading-relaxed
      ">
        {content}
      </p>
    </div>
  );
};
```

### Input Field Pattern
For form elements, guide Copilot to maintain this style:

```typescript
// PURPOSE: Create cohesive form inputs with a traditional feel
// THEME: Use subtle borders and warm focus states
// RESPONSIVE: Full width on mobile, auto width on desktop
// STATES: Clear focus, hover, and error states
// A11Y: Proper labeling and error handling
// MOTION: Smooth focus transition

const FormInput = () => {
  return (
    <div className="space-y-2">
      <label className="
        block 
        font-heading 
        text-sm 
        text-neutral-700
      ">
        {label}
      </label>
      <input className="
        w-full
        px-4 
        py-2 
        rounded-md 
        border 
        border-neutral-300
        bg-white
        focus:ring-2 
        focus:ring-primary-500 
        focus:border-primary-500
        transition-colors
        duration-200
      " />
    </div>
  );
};
```

## Animation Guidelines

Guide Copilot to use these animation patterns:

```typescript
// Transitions
const transitions = {
  default: 'all 200ms ease-in-out',
  slow: 'all 300ms ease-in-out',
  fast: 'all 100ms ease-in-out'
};

// Animation Preferences
const animations = {
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },
  duration: {
    fast: '100ms',
    default: '200ms',
    slow: '300ms'
  }
};
```

## Mobile-First Patterns

Guide Copilot to implement responsive designs with these breakpoints:

```typescript
// Breakpoint System
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Example Mobile-First Component
const ResponsiveLayout = () => {
  return (
    <div className="
      grid
      grid-cols-1
      gap-4
      sm:grid-cols-2
      lg:grid-cols-3
      p-4
      sm:p-6
      lg:p-8
    ">
      {children}
    </div>
  );
};
```

## Usage Examples

When working with Copilot, structure your comments like this:

```typescript
// Create a note editor with a paper-like feel
// PURPOSE: Provide a writing surface that feels like real stationery
// THEME: Use warm background, serif fonts, and subtle shadows
// RESPONSIVE: Full screen on mobile, contained on desktop
// STATES: Subtle hover states, clear focus indicators
// A11Y: Support screen readers and keyboard navigation
// MOTION: Smooth transitions for all interactions

// Copilot will generate appropriate component code based on these specifications
```

Remember to:
1. Always start with clear purpose comments
2. Reference specific design tokens
3. Consider all viewport sizes
4. Include accessibility requirements
5. Specify animation preferences
6. Use consistent naming patterns