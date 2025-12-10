'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, PenTool, Check, RotateCcw } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

interface PDFSignatureViewerProps {
  pdfUrl: string
  onSave: (signatureData: string, pageNumber: number, x: number, y: number) => void
  onCancel: () => void
  documentTitle?: string
}

export function PDFSignatureViewer({ pdfUrl, onSave, onCancel, documentTitle }: PDFSignatureViewerProps) {
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState(1)
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [pageCount, setPageCount] = useState<number>(1)
  const [pdfHeight, setPdfHeight] = useState<number>(1200)
  const [pdfPageWidth, setPdfPageWidth] = useState<number>(612) // Standard A4 width in points
  const [pdfPageHeight, setPdfPageHeight] = useState<number>(792) // Standard A4 height in points
  const [loadingPdf, setLoadingPdf] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    if (!hasSignature) {
      setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // Auto-save signature when drawing stops
    if (hasSignature && canvasRef.current) {
      const canvas = canvasRef.current
      const signatureDataUrl = canvas.toDataURL('image/png')
      setSignatureData(signatureDataUrl)
      console.log('Signature saved automatically')
    }
  }
  
  // Also save signature whenever hasSignature changes
  useEffect(() => {
    if (hasSignature && canvasRef.current && !signatureData) {
      const canvas = canvasRef.current
      const signatureDataUrl = canvas.toDataURL('image/png')
      setSignatureData(signatureDataUrl)
      console.log('Signature saved via useEffect')
    }
  }, [hasSignature, signatureData])

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
    setHasSignature(false)
  }

  const handlePDFClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    
    if (!signatureData) {
      alert('Please draw your signature first')
      return
    }
    
    if (!containerRef.current) return
    
    // Get accurate click position relative to the scrollable container
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // Get click position relative to the container's viewport
    const viewportX = e.clientX - rect.left
    const viewportY = e.clientY - rect.top
    
    // Add scroll offset to get position relative to the full PDF content
    const scrollX = container.scrollLeft || 0
    const scrollY = container.scrollTop || 0
    
    // Calculate position relative to PDF content (including scroll)
    const x = viewportX + scrollX
    const y = viewportY + scrollY
    
    console.log('PDF Click:', {
      viewport: { x: viewportX, y: viewportY },
      scroll: { x: scrollX, y: scrollY },
      contentPosition: { x, y },
      containerSize: { width: rect.width, height: rect.height },
      pdfHeight: pdfHeight
    })
    
    // Store position relative to PDF content (will be normalized in handleFinalSave)
    setSignaturePosition({ x, y })
  }

  // Load PDF and get page count and dimensions
  useEffect(() => {
    const loadPDFInfo = async () => {
      try {
        setLoadingPdf(true)
        const response = await fetch(pdfUrl)
        if (!response.ok) throw new Error('Failed to load PDF')
        
        const arrayBuffer = await response.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = pdfDoc.getPageCount()
        
        setPageCount(pages)
        
        // Get actual PDF page dimensions (use first page as reference)
        if (pages > 0) {
          const firstPage = pdfDoc.getPage(0)
          const { width, height } = firstPage.getSize()
          setPdfPageWidth(width)
          setPdfPageHeight(height)
          
          // Calculate rendered height: PDF scales to fit container width
          // We'll calculate this dynamically based on container width in handleFinalSave
          // For now, estimate: assume container is ~800px wide, so scale factor = 800 / width
          // Then total height = (height * scale) * pages
          const estimatedContainerWidth = 800
          const scaleFactor = estimatedContainerWidth / width
          const pageHeightPx = height * scaleFactor
          const calculatedHeight = Math.max(600, pages * pageHeightPx)
          setPdfHeight(calculatedHeight)
        } else {
          setPdfHeight(1200)
        }
        
        setLoadingPdf(false)
      } catch (error) {
        console.error('Error loading PDF:', error)
        // Fallback to default height if PDF loading fails
        setPdfHeight(1200)
        setLoadingPdf(false)
      }
    }

    if (pdfUrl) {
      loadPDFInfo()
    }
  }, [pdfUrl])

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 600
      canvas.height = 200

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  const handleFinalSave = () => {
    if (!signatureData) {
      alert('Please draw your signature first')
      return
    }
    
    if (!signaturePosition) {
      alert('Please click on the PDF to place your signature')
      return
    }

    // Get container dimensions for accurate coordinate conversion
    const container = containerRef.current
    if (!container) return
    
    // Get the actual rendered size of the PDF container (viewport)
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    
    // Calculate actual PDF rendered dimensions
    // PDF scales to fit container width, so scale factor = containerWidth / pdfPageWidth
    const scaleFactor = containerWidth / pdfPageWidth
    const renderedPageHeight = pdfPageHeight * scaleFactor
    const totalRenderedHeight = renderedPageHeight * pageCount
    
    // Normalize coordinates (0-1 range) for PDF coordinate system
    // X: normalize based on container width (PDF scales to fit width)
    //    signaturePosition.x is already relative to PDF content including scroll
    const normalizedX = Math.max(0, Math.min(1, signaturePosition.x / containerWidth))
    
    // Y: normalize based on actual rendered PDF height
    //    signaturePosition.y is relative to PDF content (0 = top, totalRenderedHeight = bottom)
    //    Backend expects: normalizedY where 0 = top, 1 = bottom
    //    Then backend converts: (1 - normalizedY) * height to get PDF Y coordinate
    const normalizedY = Math.max(0, Math.min(1, signaturePosition.y / totalRenderedHeight))
    
    console.log('Signature placement:', {
      containerViewport: { width: containerWidth, height: containerRect.height },
      pdfDimensions: { 
        pageWidth: pdfPageWidth, 
        pageHeight: pdfPageHeight,
        scaleFactor: scaleFactor,
        renderedPageHeight: renderedPageHeight,
        totalRenderedHeight: totalRenderedHeight
      },
      clickPosition: signaturePosition,
      normalized: { x: normalizedX, y: normalizedY },
      expectedPDFPosition: {
        x: `${(normalizedX * 100).toFixed(1)}% from left`,
        y: `${(normalizedY * 100).toFixed(1)}% from top`
      }
    })
    
    onSave(signatureData, selectedPage, normalizedX, normalizedY)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-primary-fg">
            Sign Document{documentTitle ? `: ${documentTitle}` : ''}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PDF Preview Area */}
          <div className="space-y-2">
            <h4 className="font-semibold text-primary-fg">PDF Preview</h4>
            <div
              ref={containerRef}
              className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative"
              style={{ 
                minHeight: '600px', 
                maxHeight: '70vh', 
                overflow: 'auto', 
                position: 'relative',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div style={{ position: 'relative', width: '100%' }}>
                {loadingPdf ? (
                  <div className="flex items-center justify-center" style={{ minHeight: '600px' }}>
                    <div className="text-primary-muted">Loading PDF...</div>
                  </div>
                ) : (
                  <>
                    <iframe
                      src={`${pdfUrl}#page=${selectedPage}&toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full"
                      title="PDF Preview"
                      style={{ 
                        display: 'block', 
                        minHeight: `${pdfHeight}px`, 
                        width: '100%', 
                        border: 'none',
                        height: 'auto'
                      }}
                      scrolling="yes"
                      allow="fullscreen"
                    />
                    
                    {/* Click overlay for accurate positioning - only active when signature is ready */}
                    {signatureData && (
                      <div
                        className="absolute inset-0"
                        onClick={handlePDFClick}
                        onWheel={(e) => {
                          // Allow scrolling to pass through to container
                          e.stopPropagation()
                          if (containerRef.current) {
                            containerRef.current.scrollBy({
                              top: e.deltaY,
                              behavior: 'auto'
                            })
                          }
                        }}
                        style={{ 
                          cursor: 'crosshair',
                          backgroundColor: 'transparent',
                          zIndex: 5,
                          minHeight: `${pdfHeight}px`,
                          pointerEvents: 'auto'
                        }}
                      />
                    )}
                  </>
                )}
                
                {/* Signature position indicator - positioned relative to inner div */}
                {signaturePosition && (
                  <div
                    className="absolute w-8 h-8 border-3 border-green-500 rounded-full bg-green-200 flex items-center justify-center z-10 pointer-events-none shadow-lg"
                    style={{
                      left: `${signaturePosition.x}px`,
                      top: `${signaturePosition.y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <PenTool className="h-4 w-4 text-green-700" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-primary-muted text-center">
              {signatureData 
                ? '✓ Signature ready - Click on the PDF where you want to place it' 
                : 'Draw your signature first, then click on PDF to place it'}
            </p>
          </div>

          {/* Signature Pad */}
          <div className="space-y-2">
            <h4 className="font-semibold text-primary-fg">Draw Your Signature</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ touchAction: 'none', minHeight: '200px' }}
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
              {signatureData && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Signature ready</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-primary-muted">
            {signatureData && signaturePosition 
              ? 'Ready to sign - Click "Sign Document" to complete' 
              : signatureData 
                ? 'Click on PDF to place signature' 
                : 'Draw your signature first'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalSave}
              disabled={!signatureData || !signaturePosition}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Sign Document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

