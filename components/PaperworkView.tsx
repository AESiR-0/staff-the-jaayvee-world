'use client'

import React, { useState, useEffect } from 'react'
import { File, Download, PenTool, CheckCircle } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth-utils'
import { PDFSignatureViewer } from './PDFSignatureViewer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com'

interface Paperwork {
  id: string
  userId: string
  documentType: string
  title: string
  description: string | null
  fileUrl: string
  fileName: string
  fileSize: string | null
  mimeType: string | null
  uploadedBy: string
  isActive: boolean
  isSigned: boolean
  signedAt: string | null
  signedFileUrl: string | null
  createdAt: string
  updatedAt: string
}

interface PaperworkViewProps {
  userId: string
}

export function PaperworkView({ userId }: PaperworkViewProps) {
  const [paperworkList, setPaperworkList] = useState<Paperwork[]>([])
  const [loading, setLoading] = useState(true)
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [selectedPaperwork, setSelectedPaperwork] = useState<Paperwork | null>(null)
  const [signing, setSigning] = useState(false)

  const fetchPaperwork = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/paperwork?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setPaperworkList(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching paperwork:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaperwork()
  }, [userId])

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank')
  }

  const handleSign = (paperwork: Paperwork) => {
    setSelectedPaperwork(paperwork)
    setShowPDFViewer(true)
  }

  const handleSignatureSave = async (signatureData: string, pageNumber: number, x: number, y: number) => {
    if (!selectedPaperwork) return

    try {
      setSigning(true)
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/paperwork/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperworkId: selectedPaperwork.id,
          signatureData: signatureData,
          pageNumber: pageNumber,
          x: x,
          y: y,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Document signed successfully!')
        setShowPDFViewer(false)
        setSelectedPaperwork(null)
        fetchPaperwork() // Refresh the list
      } else {
        alert(data.error || 'Failed to sign document')
      }
    } catch (error) {
      console.error('Error signing document:', error)
      alert('Failed to sign document')
    } finally {
      setSigning(false)
    }
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5" />
    if (mimeType.includes('pdf')) return <File className="h-5 w-5 text-red-500" />
    if (mimeType.includes('image')) return <File className="h-5 w-5 text-blue-500" />
    if (mimeType.includes('word')) return <File className="h-5 w-5 text-blue-600" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (size: string | null) => {
    if (!size) return 'Unknown size'
    const bytes = parseInt(size)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading paperwork...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-primary-fg mb-4 flex items-center">
        <File className="h-5 w-5 mr-2" />
        My Documents
      </h2>
      {paperworkList.length === 0 ? (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-primary-muted mb-4" />
          <p className="text-primary-muted">No documents available</p>
          <p className="text-sm text-primary-muted mt-2">
            Your documents will appear here once uploaded by admin
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paperworkList.map((paperwork) => (
            <div
              key={paperwork.id}
              className="p-4 border border-primary-border rounded-lg hover:bg-primary-bg/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getFileIcon(paperwork.mimeType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-primary-fg">{paperwork.title}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {paperwork.documentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {paperwork.description && (
                      <p className="text-sm text-primary-muted mb-2">{paperwork.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-primary-muted">
                      <span>{paperwork.fileName}</span>
                      <span>{formatFileSize(paperwork.fileSize)}</span>
                      <span>Uploaded: {new Date(paperwork.createdAt).toLocaleDateString()}</span>
                      {paperwork.isSigned && paperwork.signedAt && (
                        <span className="text-green-600 font-medium">
                          ✓ Signed {new Date(paperwork.signedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!paperwork.isSigned && paperwork.mimeType === 'application/pdf' && (
                    <button
                      onClick={() => handleSign(paperwork)}
                      disabled={signing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      title="Sign PDF document"
                    >
                      <PenTool className="h-4 w-4" />
                      {signing ? 'Signing...' : 'Sign'}
                    </button>
                  )}
                  {!paperwork.isSigned && paperwork.mimeType && paperwork.mimeType !== 'application/pdf' && (
                    <span className="px-3 py-2 text-xs text-primary-muted border border-primary-border rounded-lg">
                      PDF only
                    </span>
                  )}
                  <button
                    onClick={() => handleDownload(
                      paperwork.isSigned && paperwork.signedFileUrl 
                        ? paperwork.signedFileUrl 
                        : paperwork.fileUrl, 
                      paperwork.fileName
                    )}
                    className="px-4 py-2 border border-primary-border rounded-lg hover:bg-primary-bg text-primary-fg flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {paperwork.isSigned ? 'Download Signed' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPDFViewer && selectedPaperwork && (
        <PDFSignatureViewer
          pdfUrl={selectedPaperwork.fileUrl}
          onSave={handleSignatureSave}
          onCancel={() => {
            setShowPDFViewer(false)
            setSelectedPaperwork(null)
          }}
          documentTitle={selectedPaperwork.title}
        />
      )}
    </div>
  )
}

