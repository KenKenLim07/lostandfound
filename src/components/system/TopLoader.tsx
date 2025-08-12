"use client"

import NextTopLoader from "nextjs-toploader"

export function TopLoader() {
  return (
    <NextTopLoader
      color="#000000"
      initialPosition={0.15}
      crawlSpeed={200}
      height={3}
      crawl
      showSpinner={false}
      easing="ease"
      speed={200}
      zIndex={9999}
    />
  )
} 