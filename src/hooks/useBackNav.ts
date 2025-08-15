import { useEffect, useState } from "react"

export function useBackNav() {
  const [isBack, setIsBack] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    try {
      const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)
      setIsBack(nav?.type === "back_forward")
    } catch {
      setIsBack(false)
    }

    try {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768)
    } catch {
      setIsMobile(false)
    }
  }, [])

  return { isBack, isMobile }
} 