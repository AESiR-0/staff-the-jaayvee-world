"use client";
import { useState, useEffect, useCallback } from "react";
import { QrCode, Download, History, UserPlus, Search } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth-utils";

interface QRAssignment {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  assignedDate: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentReferralCode: string;
  totalCodes: number;
  status: "active" | "used" | "expired";
}

interface QRHistory {
  id: string;
  prefix: string;
  startFrom: number;
  count: number;
  rangeStart: string;
  rangeEnd: string;
  createdAt: string;
  createdBy: string;
  creatorName: string;
  creatorEmail: string;
  totalCodes: number;
  assignedCodes: number;
  unassignedCodes: number;
  status: "fully_assigned" | "partially_assigned" | "unassigned";
}

interface Agent {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalMerchants: number;
}

export default function QRPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Form states
  const [prefix, setPrefix] = useState("TJW");
  const [count, setCount] = useState(20);
  const [startFrom, setStartFrom] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  
  // Agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Assignments
  const [assignments, setAssignments] = useState<QRAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [generationError, setGenerationError] = useState("");

  // History
  const [history, setHistory] = useState<QRHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => { 
    try {
      setLoadingAgents(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const url = `${API_BASE_URL}${API_ENDPOINTS.QR_ASSIGNMENTS}${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`;
      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const url = `${API_BASE_URL}${API_ENDPOINTS.QR_HISTORY}${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`;
      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch QR history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, searchQuery, fetchHistory]);

  const checkRangeOverlap = (newRangeStart: string, newRangeEnd: string): boolean => {
    return assignments.some(assignment => {
      // Check if new range overlaps with existing range
      return (
        // New range starts within existing range
        (newRangeStart >= assignment.rangeStart && newRangeStart <= assignment.rangeEnd) ||
        // New range ends within existing range
        (newRangeEnd >= assignment.rangeStart && newRangeEnd <= assignment.rangeEnd) ||
        // New range completely contains existing range
        (newRangeStart <= assignment.rangeStart && newRangeEnd >= assignment.rangeEnd)
      );
    });
  };

  async function handleGenerate() {
    setIsGenerating(true);
    setRangeError("");
    setGenerationError("");
    
    try {
      const rangeStart = `${prefix}${startFrom.toString().padStart(4, '0')}`;
      const rangeEnd = `${prefix}${(startFrom + count - 1).toString().padStart(4, '0')}`;

      // Check for range overlap
      if (checkRangeOverlap(rangeStart, rangeEnd)) {
        setRangeError(`Range ${rangeStart} to ${rangeEnd} overlaps with existing assignments. Please choose a different range.`);
        setIsGenerating(false);
        return;
      }

      // Generate QR codes
      const res = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.QR_GENERATE}`, {
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

        // Assign the codes to the selected agent
        setIsAssigning(true);
        try {
          const assignRes = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.QR_ASSIGN_RANGE}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              agentId: selectedAgentId, 
              rangeStart, 
              rangeEnd 
            }),
          });
          
          if (assignRes.ok) {
            const result = await assignRes.json();
            const agent = agents.find(a => a.id === selectedAgentId);
            alert(`QR codes generated and assigned to ${agent?.name || 'agent'} successfully!`);
            
            // Refresh assignments to update the list
            await fetchAssignments();
          } else {
            const error = await assignRes.json();
            alert(`QR codes generated but assignment failed: ${error.error || 'Unknown error'}`);
          }
        } catch (assignError) {
          console.error("Assignment error:", assignError);
          alert("QR codes generated but assignment failed. Please try assigning manually.");
        } finally {
          setIsAssigning(false);
        }
      } else {
        // Handle specific error responses
        const errorData = await res.json().catch(() => ({}));
        
        if (errorData.detail && errorData.detail.includes('already exists')) {
          const duplicateCode = errorData.detail.match(/Key \(code\)=\(([^)]+)\)/)?.[1];
          setGenerationError(`QR code ${duplicateCode} already exists. Please choose a different starting number or prefix.`);
        } else if (errorData.error) {
          setGenerationError(errorData.error);
        } else {
          setGenerationError(`Failed to generate QR codes (${res.status}). Please try again.`);
        }
      }
    } catch (error) {
      console.error("QR generation error:", error);
      setGenerationError("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-fg mb-2">QR Code Management</h1>
        <p className="text-primary-muted">Generate and assign QR codes for events</p>
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
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
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
                  max="5000"
                />
              </div>
            </div>

            {/* Agent Assignment Section */}
            <div className="border-t border-primary-border pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary-accent-light rounded-lg flex items-center justify-center">
                  <UserPlus className="text-primary-accent" size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-fg">Assign to Agent</h3>
                  <p className="text-sm text-primary-muted">Select an agent to assign these codes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Select Agent *</label>
                  {loadingAgents ? (
                    <div className="flex items-center gap-2 text-primary-muted">
                      <div className="w-4 h-4 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
                      Loading agents...
                    </div>
                  ) : (
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full px-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                      disabled={isGenerating || isAssigning}
                      required
                    >
                      <option value="">Choose an agent...</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.email}) - {agent.referralCode}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || isAssigning || !selectedAgentId}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isGenerating || isAssigning) ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                {isGenerating ? "Generating..." : isAssigning ? "Assigning..." : "Generate & Assign"}
              </button>
            </div>

            <div className="bg-primary-accent-light p-4 rounded-xl">
              <h3 className="font-medium text-primary-fg mb-2">Generation Preview</h3>
              <p className="text-sm text-primary-muted">
                Will generate {count} QR codes with prefix &quot;{prefix}&quot; starting from {startFrom}
              </p>
              <p className="text-sm text-primary-muted mt-1">
                Range: {prefix}{startFrom.toString().padStart(4, '0')} to {prefix}{(startFrom + count - 1).toString().padStart(4, '0')}
              </p>
              {selectedAgentId && (
                <p className="text-sm text-primary-muted mt-1">
                  Will be assigned to: {agents.find(a => a.id === selectedAgentId)?.name || 'Selected agent'}
                </p>
              )}
              {rangeError && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ {rangeError}
                </p>
              )}
              {generationError && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ❌ {generationError}
                </p>
              )}
            </div>
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
              <h2 className="text-lg font-semibold text-primary-fg">QR Generation History</h2>
              <p className="text-sm text-primary-muted">View QR code generation batches</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={16} />
              <input
                type="text"
                placeholder="Search by prefix, creator name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-primary-muted">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-primary-muted">
                  {searchQuery ? 'No QR batches found matching your search.' : 'No QR batches found.'}
                </p>
              </div>
            ) : (
              history.map((batch) => (
                <div key={batch.id} className="border border-primary-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-primary-fg">
                          {batch.rangeStart} to {batch.rangeEnd}
                        </p>
                        <span className="text-sm text-primary-muted">
                          ({batch.totalCodes} codes)
                        </span>
                      </div>
                      <div className="text-sm text-primary-muted">
                        <p><strong>Prefix:</strong> {batch.prefix}</p>
                        <p><strong>Created by:</strong> {batch.creatorName}</p>
                        <p><strong>Email:</strong> {batch.creatorEmail}</p>
                        <p><strong>Created:</strong> {new Date(batch.createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-green-600">✓ {batch.assignedCodes} assigned</span>
                          <span className="text-orange-600">○ {batch.unassignedCodes} unassigned</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      batch.status === "fully_assigned" 
                        ? "bg-green-100 text-green-800"
                        : batch.status === "partially_assigned"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {batch.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

