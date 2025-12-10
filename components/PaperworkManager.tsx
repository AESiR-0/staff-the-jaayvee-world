'use client'

import React, { useState, useEffect } from 'react'
import { Upload, File, Trash2, Download, X } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth-utils'

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
  createdAt: string
  updatedAt: string
}

interface PaperworkManagerProps {
  userId: string
  userName?: string
}

export function PaperworkManager({ userId, userName }: PaperworkManagerProps) {
  const [paperworkList, setPaperworkList] = useState<Paperwork[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [formData, setFormData] = useState({
    documentType: '',
    title: '',
    description: '',
    file: null as File | null,
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com'

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleUpload = async () => {
    if (!formData.file || !formData.documentType || !formData.title) {
      alert('Please fill in all required fields and select a file')
      return
    }

    try {
      setUploading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('tjw_auth_token') : null
      
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('userId', userId)
      uploadFormData.append('documentType', formData.documentType)
      uploadFormData.append('title', formData.title)
      if (formData.description) {
        uploadFormData.append('description', formData.description)
      }

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/team/paperwork`, {
        method: 'POST',
        headers,
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        alert('Paperwork uploaded successfully!')
        setFormData({
          documentType: '',
          title: '',
          description: '',
          file: null,
        })
        setShowUploadForm(false)
        fetchPaperwork()
      } else {
        alert(data.error || 'Failed to upload paperwork')
      }
    } catch (error) {
      console.error('Error uploading paperwork:', error)
      alert('Failed to upload paperwork')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (paperworkId: string) => {
    if (!confirm('Are you sure you want to delete this paperwork?')) {
      return
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/team/paperwork?id=${paperworkId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Paperwork deleted successfully!')
        fetchPaperwork()
      } else {
        alert(data.error || 'Failed to delete paperwork')
      }
    } catch (error) {
      console.error('Error deleting paperwork:', error)
      alert('Failed to delete paperwork')
    }
  }

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank')
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-primary-fg">
          {userName ? `Paperwork for ${userName}` : 'Paperwork'}
        </h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Paperwork
        </button>
      </div>

      {showUploadForm && (
        <div className="card">
          <div className="p-6 border-b border-primary-border">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-primary-fg">Upload New Paperwork</h3>
              <button
                onClick={() => {
                  setShowUploadForm(false)
                  setFormData({
                    documentType: '',
                    title: '',
                    description: '',
                    file: null,
                  })
                }}
                className="p-1 hover:bg-primary-bg rounded"
              >
                <X className="h-5 w-5 text-primary-muted" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-fg">Document Type *</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                required
              >
                <option value="">Select document type</option>
                <option value="job_offer">Job Offer Letter</option>
                <option value="contract">Employment Contract</option>
                <option value="nda">NDA (Non-Disclosure Agreement)</option>
                <option value="id_proof">ID Proof</option>
                <option value="address_proof">Address Proof</option>
                <option value="educational_certificate">Educational Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-fg">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Job Offer Letter - 2024"
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-fg">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-fg">File *</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                required
              />
              {formData.file && (
                <p className="text-sm text-primary-muted mt-1">
                  Selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading || !formData.file || !formData.documentType || !formData.title}
                className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowUploadForm(false)
                  setFormData({
                    documentType: '',
                    title: '',
                    description: '',
                    file: null,
                  })
                }}
                className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {paperworkList.length === 0 ? (
        <div className="card">
          <div className="p-12 text-center">
            <File className="h-12 w-12 mx-auto text-primary-muted mb-4" />
            <p className="text-primary-muted">No paperwork uploaded yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {paperworkList.map((paperwork) => (
            <div key={paperwork.id} className="card">
              <div className="p-4">
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
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(paperwork.fileUrl, paperwork.fileName)}
                      className="p-2 border border-primary-border rounded-lg hover:bg-primary-bg text-primary-fg"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(paperwork.id)}
                      className="p-2 border border-red-200 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

