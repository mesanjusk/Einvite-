import { useState, useEffect } from 'react'

export function useCountdown(targetDate) {
  const [time, setTime] = useState({})

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate) - new Date()
      setTime({
        days: Math.max(0, Math.floor(diff / 86400000)),
        hours: Math.max(0, Math.floor((diff % 86400000) / 3600000)),
        minutes: Math.max(0, Math.floor((diff % 3600000) / 60000)),
        seconds: Math.max(0, Math.floor((diff % 60000) / 1000)),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return time
}
