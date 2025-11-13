"use client";
import { useState } from "react";
import { QrCode, Download, Settings, Plus } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

export function QrTools() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [prefix, setPrefix] = useState("TJW");
  const [count, setCount] = useState(20);
  const [startFrom, setStartFrom] = useState(1);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch(API_ENDPOINTS.QR_GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prefix, 
          startFrom, 
          count 
        }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr_codes_${prefix}_${startFrom}-${startFrom + count - 1}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to generate QR codes");
      }
    } catch (error) {
      console.error("QR generation error:", error);
      alert("Failed to generate QR codes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAssignRange() {
    setIsAssigning(true);
    try {
      const res = await fetch(API_ENDPOINTS.QR_ASSIGN_RANGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prefix, 
          startFrom, 
          count 
        }),
      });
      
      if (res.ok) {
        alert("QR codes assigned successfully!");
      } else {
        throw new Error("Failed to assign QR codes");
      }
    } catch (error) {
      console.error("QR assignment error:", error);
      alert("Failed to assign QR codes. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <QrCode className="text-primary-accent" size={20} />
        </div>
        <h2 className="text-lg font-semibold text-primary-fg">QR Management</h2>
      </div>
      
      <div className="space-y-4">
        {/* Settings */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-primary-muted mb-1">Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-primary-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="TJW"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-muted mb-1">Start From</label>
            <input
              type="number"
              value={startFrom}
              onChange={(e) => setStartFrom(Number(e.target.value))}
              className="w-full px-3 py-2 border border-primary-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm text-primary-muted mb-1">Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-primary-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGenerating ? "Generating..." : "Generate QR Batch"}
          </button>
          
          <button
            onClick={handleAssignRange}
            disabled={isAssigning}
            className="flex-1 border border-primary-border text-primary-fg px-4 py-2 rounded-xl hover:bg-primary-accent-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAssigning ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Settings size={16} />
            )}
            {isAssigning ? "Assigning..." : "Assign Range"}
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-primary-muted bg-primary-accent-light p-3 rounded-lg">
          <p><strong>Generate:</strong> Creates QR codes and downloads as ZIP</p>
          <p><strong>Assign:</strong> Assigns QR code range to your account</p>
        </div>
      </div>
    </div>
  );
}

