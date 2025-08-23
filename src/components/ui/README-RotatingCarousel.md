# Rotating Image Carousel

A production-ready, smooth rotating image carousel built with React, Framer Motion, and Tailwind CSS.

## Features

- ✅ **3-Card Display**: Shows one center card and two side cards
- ✅ **Smooth Animations**: Spring-based transitions with Framer Motion
- ✅ **Infinite Looping**: Seamless rotation through all images
- ✅ **Manual Navigation**: Chevron left/right buttons
- ✅ **Autoplay**: Configurable interval with pause/resume
- ✅ **Mobile Responsive**: Touch/swipe gestures for mobile
- ✅ **Accessibility**: ARIA labels and keyboard navigation
- ✅ **Customizable**: Multiple props for different use cases
- ✅ **Production Ready**: Clean, modular, and reusable code

## Installation

All required dependencies are already installed:
- `framer-motion` - For smooth animations
- `lucide-react` - For chevron icons
- `tailwindcss` - For styling

## Basic Usage

```tsx
import RotatingCarousel from "@/components/ui/RotatingCarousel"

const images = [
  "/path/to/image1.jpg",
  "/path/to/image2.jpg",
  "/path/to/image3.jpg",
]

export default function MyComponent() {
  return (
    <RotatingCarousel 
      images={images}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | **Required** | Array of image URLs |
| `autoPlay` | `boolean` | `true` | Enable/disable autoplay |
| `interval` | `number` | `3000` | Autoplay interval in milliseconds |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showControls` | `boolean` | `true` | Show navigation buttons |
| `showAutoplayToggle` | `boolean` | `true` | Show autoplay toggle button |

## Examples

### Default Carousel (Autoplay Enabled)
```tsx
<RotatingCarousel images={images} />
```

### Manual Control Only
```tsx
<RotatingCarousel 
  images={images}
  autoPlay={false}
/>
```

### Fast Autoplay
```tsx
<RotatingCarousel 
  images={images}
  interval={1500}
/>
```

### Minimal Controls
```tsx
<RotatingCarousel 
  images={images}
  showAutoplayToggle={false}
/>
```

### Single Image (No Controls)
```tsx
<RotatingCarousel 
  images={[singleImage]}
  showControls={false}
  showAutoplayToggle={false}
/>
```

## How It Works

### Card Positioning
The carousel shows 3 cards at a time:
- **Center**: Main focus card (scale: 1.1, full opacity)
- **Left/Right**: Side cards (scale: 0.9, 70% opacity)
- **Hidden**: Other cards are not rendered for performance

### Animation System
- Uses Framer Motion's `AnimatePresence` for smooth transitions
- Spring animations with optimized stiffness/damping values
- Infinite looping through modulo arithmetic
- Drag gestures for mobile interaction

### Autoplay Logic
- Pauses on hover/touch for better UX
- Resumes when mouse leaves
- Configurable interval
- Toggle button for user control

## Mobile Support

- **Touch Gestures**: Swipe left/right to navigate
- **Responsive Design**: Adapts to different screen sizes
- **Touch-Friendly**: Large touch targets for buttons
- **Performance**: Optimized for mobile devices

## Accessibility

- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Focus management for screen readers
- **Semantic HTML**: Proper button and container elements
- **Color Contrast**: High contrast for visibility

## Performance Optimizations

- **Conditional Rendering**: Only renders visible cards
- **Memoized Callbacks**: Prevents unnecessary re-renders
- **Efficient Animations**: Hardware-accelerated transforms
- **Image Optimization**: Proper image loading attributes

## Customization

### Styling
The component uses Tailwind classes and can be customized via the `className` prop:

```tsx
<RotatingCarousel 
  images={images}
  className="max-w-4xl mx-auto h-96"
/>
```

### Animation Timing
Modify the spring animation values in the component for different feels:

```tsx
transition={{
  type: "spring",
  stiffness: 300,  // Higher = faster
  damping: 30,     // Higher = less bounce
  mass: 0.8,       // Higher = more inertia
}}
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Ensure image URLs are correct and accessible
2. **Autoplay not working**: Check if `autoPlay` prop is set to `true`
3. **Touch gestures not working**: Ensure component is not inside a scrollable container
4. **Performance issues**: Reduce number of images or optimize image sizes

### Browser Support
- Modern browsers with ES6+ support
- Mobile browsers with touch event support
- Requires CSS Grid and Flexbox support

## License

This component is part of your project and follows the same license terms. 