"use client";
import { useState } from "react";
import { QrCode, Download, Settings, History, Plus } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

interface QRAssignment {
  id: string;
  prefix: string;
  startRange: number;
  endRange: number;
  assignedDate: string;
  status: "active" | "used" | "expired";
}

export default function QRPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "assign" | "history">("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Form states
  const [prefix, setPrefix] = useState("TJW");
  const [count, setCount] = useState(20);
  const [startFrom, setStartFrom] = useState(1);

  // Mock data for assignments
  const mockAssignments: QRAssignment[] = [
    {
      id: "1",
      prefix: "TJW",
      startRange: 1,
      endRange: 50,
      assignedDate: "2024-02-01",
      status: "active",
    },
    {
      id: "2", 
      prefix: "TJW",
      startRange: 51,
      endRange: 100,
      assignedDate: "2024-01-15",
      status: "used",
    },
  ];

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch(API_ENDPOINTS.QR_GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, startFrom, count }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr_codes_${prefix}_${startFrom}-${startFrom + count - 1}.zip`;
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
        body: JSON.stringify({ prefix, startFrom, count }),
      });
      
      if (res.ok) {
        alert("QR codes assigned successfully!");
        // Refresh assignments list
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">QR Code Management</h1>
        <p className="text-primary-muted">Generate, assign, and manage QR codes for events</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary-accent-light p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          Generate QRs
        </button>
        <button
          onClick={() => setActiveTab("assign")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "assign"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          Assign Range
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-white text-primary-accent shadow-soft"
              : "text-primary-muted hover:text-primary-fg"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "generate" && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <QrCode className="text-primary-accent" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-fg">Generate QR Codes</h2>
              <p className="text-sm text-primary-muted">Create a new batch of QR codes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="TJW"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Start From</label>
                <input
                  type="number"
                  value={startFrom}
                  onChange={(e) => setStartFrom(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Count</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                {isGenerating ? "Generating..." : "Generate & Download"}
              </button>
            </div>

            <div className="bg-primary-accent-light p-4 rounded-xl">
              <h3 className="font-medium text-primary-fg mb-2">Generation Preview</h3>
              <p className="text-sm text-primary-muted">
                Will generate {count} QR codes with prefix &quot;{prefix}&quot; starting from {startFrom}
              </p>
              <p className="text-sm text-primary-muted mt-1">
                Range: {prefix}-{startFrom.toString().padStart(3, '0')} to {prefix}-{(startFrom + count - 1).toString().padStart(3, '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "assign" && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <Settings className="text-primary-accent" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-fg">Assign QR Range</h2>
              <p className="text-sm text-primary-muted">Assign a range of QR codes to your account</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="TJW"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Start From</label>
                <input
                  type="number"
                  value={startFrom}
                  onChange={(e) => setStartFrom(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Count</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <button
              onClick={handleAssignRange}
              disabled={isAssigning}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isAssigning ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Settings size={20} />
              )}
              {isAssigning ? "Assigning..." : "Assign Range"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
              <History className="text-primary-accent" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-fg">Assignment History</h2>
              <p className="text-sm text-primary-muted">View your QR code assignments</p>
            </div>
          </div>

          <div className="space-y-4">
            {mockAssignments.map((assignment) => (
              <div key={assignment.id} className="border border-primary-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-fg">
                      {assignment.prefix}-{assignment.startRange.toString().padStart(3, '0')} to {assignment.prefix}-{assignment.endRange.toString().padStart(3, '0')}
                    </p>
                    <p className="text-sm text-primary-muted">
                      Assigned on {new Date(assignment.assignedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assignment.status === "active" 
                      ? "bg-green-100 text-green-800"
                      : assignment.status === "used"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
