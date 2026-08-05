import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const THRESHOLD = 0.55
const BRUSH_RADIUS = 18

export default function ScratchCard({
  value,
  width = 140,
  height = 188,
  onComplete,
}) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef(null)
  const done = useRef(false)
  const [fading, setFading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#c98a9a')
    gradient.addColorStop(1, '#7a3a54')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    for (let i = -height; i < width; i += 10) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + height, height)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '600 12px "EB Garamond", serif'
    ctx.textAlign = 'center'
    ctx.fillText('S C R A T C H', width / 2, height / 2)
  }, [width, height])

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const scratchAt = (x, y) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    if (lastPoint.current) {
      ctx.lineWidth = BRUSH_RADIUS * 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    lastPoint.current = { x, y }
  }

  const checkProgress = () => {
    if (done.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    let total = 0
    const step = 4 * 8 // sample every 8th pixel for speed
    for (let i = 3; i < data.length; i += step) {
      total++
      if (data[i] === 0) transparent++
    }
    if (transparent / total > THRESHOLD) {
      done.current = true
      setFading(true)
      onComplete?.()
      setTimeout(() => setRevealed(true), 450)
    }
  }

  const handleDown = (e) => {
    canvasRef.current.setPointerCapture(e.pointerId)
    isDrawing.current = true
    lastPoint.current = null
    const { x, y } = getPoint(e)
    scratchAt(x, y)
  }
  const handleMove = (e) => {
    if (!isDrawing.current) return
    const { x, y } = getPoint(e)
    scratchAt(x, y)
    checkProgress()
  }
  const handleUp = () => {
    isDrawing.current = false
    lastPoint.current = null
    checkProgress()
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 10px 24px rgba(90,40,20,0.18)',
        background: '#fffdf9',
      }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={revealed ? { scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: value.length > 6 ? 22 : value.length > 3 ? 26 : 32,
          fontWeight: 700,
          color: 'var(--maroon)',
          padding: '0 10px',
          textAlign: 'center',
          lineHeight: 1.15,
        }}
      >
        {value}
      </motion.div>
      {!revealed && (
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          style={{
            position: 'absolute',
            inset: 0,
            touchAction: 'none',
            cursor: 'pointer',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.45s ease',
          }}
        />
      )}
    </div>
  )
}
