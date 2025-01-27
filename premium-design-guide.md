# Premium Design Guide for Copilot

## Color System Instructions

```typescript
// COLOR TOKENS: Use these specific gradients for premium feel
const premiumGradients = {
  primary: 'bg-gradient-to-r from-violet-500 to-indigo-500',
  primaryHover: 'hover:from-violet-600 hover:to-indigo-600',
  success: 'bg-gradient-to-r from-emerald-500 to-green-500',
  successHover: 'hover:from-emerald-600 hover:to-green-600',
  surface: 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
};

// TRANSPARENCY: Use these for layered elements
const glassEffects = {
  card: 'bg-white/80 backdrop-blur-sm',
  input: 'bg-white/50 backdrop-blur-sm',
  border: 'border-gray-200/50'
};

// Example usage for Copilot:
// "Create a premium button with gradient background"
/*
<button className={`
  ${premiumGradients.primary}
  ${premiumGradients.primaryHover}
  px-4 py-2 rounded-lg
  transition-all duration-200
  text-white font-medium
  hover:shadow-lg transform hover:scale-102
`}>
  Premium Action
</button>
*/
```

## Animation Patterns

```typescript
// ANIMATION: Basic transition setup for all interactive elements
const transitions = {
  base: 'transition-all duration-200',
  transform: 'transform hover:scale-102',
  shadow: 'hover:shadow-lg',
  color: 'transition-colors duration-200'
};

// HOVER EFFECTS: Standard interactive patterns
const hoverEffects = {
  button: 'hover:shadow-md transform hover:scale-102',
  card: 'hover:bg-white/50 hover:shadow-sm',
  input: 'hover:shadow-md focus:ring-2 focus:ring-violet-500/50'
};

// Example for Copilot:
// "Create an interactive card with hover effects"
/*
<div className={`
  ${glassEffects.card}
  ${transitions.base}
  ${hoverEffects.card}
  p-4 rounded-lg
`}>
  Card content
</div>
*/
```

## Component Design Patterns

### Premium Buttons
```typescript
// PATTERN: Premium primary button
/*
<button className="
  bg-gradient-to-r from-violet-500 to-indigo-500
  hover:from-violet-600 hover:to-indigo-600
  px-4 py-2.5 rounded-lg
  text-white text-sm font-medium
  transition-all duration-200
  hover:shadow-lg transform hover:scale-102
">
  Premium Action
</button>
*/

// PATTERN: Glass effect secondary button
/*
<button className="
  bg-white/50 backdrop-blur-sm
  border border-gray-200/50
  px-4 py-2.5 rounded-lg
  text-gray-700 text-sm font-medium
  transition-all duration-200
  hover:bg-white hover:shadow-md
">
  Secondary Action
</button>
*/
```

### Premium Badges
```typescript
// PATTERN: Premium status badge
/*
<div className="
  flex items-center px-2.5 py-1
  bg-gradient-to-r from-violet-500/10 to-indigo-500/10
  border border-violet-500/20 rounded-full
">
  <Sparkles className="w-4 h-4 text-violet-500 mr-1.5 animate-pulse" />
  <span className="
    text-xs font-medium
    bg-gradient-to-r from-violet-600 to-indigo-600
    bg-clip-text text-transparent
  ">
    Premium
  </span>
</div>
*/
```

### Input Fields
```typescript
// PATTERN: Premium input field
/*
<div className="relative group">
  <input
    className="
      w-full px-4 py-2.5
      bg-white/50 backdrop-blur-sm
      border border-gray-200/50 rounded-lg
      focus:ring-2 focus:ring-violet-500/50
      focus:border-violet-500
      transition-all duration-200
      group-hover:shadow-md
    "
  />
  <IconComponent className="
    absolute left-3 top-2.5
    text-gray-400 group-hover:text-violet-500
    transition-colors duration-200
  " />
</div>
*/
```

## Animation Keyframes
```css
/* Add these to your global CSS */
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
```

## Usage Guide for Copilot

When you want Copilot to implement these premium styles, structure your comments like this:

```typescript
// PURPOSE: Describe what you're creating
// STYLE: Premium component with gradient background
// EFFECTS: Include hover animations and glass effects
// TRANSITIONS: Smooth scaling and shadow transitions
// INTERACTION: Responsive hover and focus states

// Example comment for Copilot:
// "Create a premium action button with gradient background,
// hover scaling, and shadow effects. Include smooth transitions
// and a subtle hover state."
```

## Common Patterns

1. Container Elements:
```typescript
// PATTERN: Premium container with glass effect
/*
<div className="
  bg-white/80 backdrop-blur-sm
  border border-gray-200/50
  rounded-lg shadow-sm
  transition-all duration-200
  hover:shadow-md
">
*/
```

2. Interactive Elements:
```typescript
// PATTERN: Interactive element transitions
const interactiveStyles = `
  transition-all duration-200
  transform hover:scale-102
  hover:shadow-md
`;
```

3. Text Elements:
```typescript
// PATTERN: Premium gradient text
const gradientText = `
  bg-gradient-to-r from-violet-600 to-indigo-600
  bg-clip-text text-transparent
  font-display font-semibold
`;
```