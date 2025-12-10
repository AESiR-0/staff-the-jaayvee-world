'use client'

import React, { useRef, useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureData: string) => void
  onCancel: () => void
  userName?: string
}

export function SignaturePad({ onSave, onCancel, userName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000000'
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signatureData = canvas.toDataURL('image/png')
    onSave(signatureData)
  }

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 600
    canvas.height = 200

    // Set drawing style
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-primary-fg">
            Sign Document{userName ? ` for ${userName}` : ''}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearSignature}
            disabled={!hasSignature}
            className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasSignature}
              className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Sign Document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

