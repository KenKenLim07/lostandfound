// Animation variants for consistent animations across the app
import { Variants } from "framer-motion"

export const heroAnimations: {
  container: Variants
  title: Variants
  subtitle: Variants
  buttons: Variants
} = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  },
  title: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },
  subtitle: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.1 }
    }
  },
  buttons: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 }
    }
  }
}

export const cardAnimations: {
  container: Variants
  item: Variants
  hover: Variants
  tap: Variants
} = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },
  hover: {
    hover: {
      y: -4,
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  },
  tap: {
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }
}

// Utility for reduced motion support
export const getReducedMotionVariants = (variants: Variants, shouldReduceMotion: boolean): Variants => {
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    }
  }
  return variants
} 