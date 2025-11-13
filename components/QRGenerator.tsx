"use client";
import { useState } from "react";
import { Download, UserPlus, QrCode, CheckCircle } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth-utils";

export function QRGenerator() {
  const [prefix, setPrefix] = useState("TJW");
  const [startFrom, setStartFrom] = useState(1);
  const [count, setCount] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccess(false);

      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.QR_GENERATE}`, {
        method: 'POST',
        body: JSON.stringify({
          prefix,
          startFrom,
          count
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR codes');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_${prefix}_${startFrom.toString().padStart(4, '0')}_${(startFrom + count - 1).toString().padStart(4, '0')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('QR generation error:', error);
      alert('Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <QrCode className="text-primary-accent" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-fg">Generate QR Codes</h2>
          <p className="text-sm text-primary-muted">Generate a batch of QR codes</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            placeholder="TJW"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Start From</label>
          <input
            type="number"
            value={startFrom}
            onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Count (Max 5000)</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.min(parseInt(e.target.value) || 100, 5000))}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            min="1"
            max="5000"
          />
        </div>

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-700">QR codes downloaded successfully!</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Generate & Download ZIP
            </>
          )}
        </button>

        <div className="text-xs text-primary-muted">
          Codes will range from: <span className="font-mono">{prefix}{startFrom.toString().padStart(4, '0')}</span> to <span className="font-mono">{prefix}{(startFrom + count - 1).toString().padStart(4, '0')}</span>
        </div>
      </div>
    </div>
  );
}


