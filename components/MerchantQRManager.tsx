"use client";
import { useState, useEffect } from "react";
import { QrCode, UserPlus, Download, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth-utils";

interface Agent {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalMerchants: number;
}

export function MerchantQRManager() {
  // Step 1: Generate QR Codes
  const [prefix, setPrefix] = useState("TJW");
  const [startFrom, setStartFrom] = useState(1);
  const [count, setCount] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [codesGenerated, setCodesGenerated] = useState(false);

  // Step 2: Assign to Agent
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const generatedRangeStart = `${prefix}${startFrom.toString().padStart(4, '0')}`;
  const generatedRangeEnd = `${prefix}${(startFrom + count - 1).toString().padStart(4, '0')}`;

  useEffect(() => {
    // Set auto-filled range based on generated codes
    if (codesGenerated) {
      setRangeStart(generatedRangeStart);
      setRangeEnd(generatedRangeEnd);
    }
  }, [codesGenerated, generatedRangeStart, generatedRangeEnd]);

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

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");

      console.log('🔐 Calling QR generate API...');

      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.QR_GENERATE}`, {
        method: 'POST',
        body: JSON.stringify({
          prefix,
          startFrom,
          count
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 QR generate response:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('QR generate error:', errorData);
        throw new Error(errorData.error || 'Failed to generate QR codes');
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

      setCodesGenerated(true);
      setSuccessMessage('QR codes generated and downloaded successfully!');
      setTimeout(() => setSuccessMessage(""), 5000);

    } catch (error: any) {
      console.error('QR generation error:', error);
      setErrorMessage(error.message || 'Failed to generate QR codes');
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId || !rangeStart || !rangeEnd) {
      setErrorMessage('Please fill all fields');
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setAssigning(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await authenticatedFetch(`${API_BASE_URL}${API_ENDPOINTS.QR_ASSIGN_RANGE}`, {
        method: 'POST',
        body: JSON.stringify({
          agentId: selectedAgentId,
          rangeStart,
          rangeEnd
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign codes');
      }

      const result = await response.json();
      const agent = agents.find(a => a.id === selectedAgentId);
      setSuccessMessage(`Successfully assigned ${result.count} codes to ${agent?.name || 'agent'}`);
      setTimeout(() => setSuccessMessage(""), 5000);

      // Reset form
      setRangeStart("");
      setRangeEnd("");
      setSelectedAgentId("");
      setCodesGenerated(false);

    } catch (error: any) {
      console.error('Assignment error:', error);
      setErrorMessage(error.message || 'Failed to assign codes');
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <QrCode className="text-primary-accent" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-fg">Merchant QR Manager</h2>
          <p className="text-sm text-primary-muted">Generate and assign QR codes for merchants</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-sm text-green-700">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span className="text-sm text-red-700">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: Generate QR Codes */}
        <div className="border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <h3 className="font-semibold text-primary-fg">Generate QR Codes</h3>
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
                disabled={generating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">Start From</label>
                <input
                  type="number"
                  value={startFrom}
                  onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  min="1"
                  disabled={generating}
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
                  disabled={generating}
                />
              </div>
            </div>

            <div className="text-xs text-primary-muted bg-primary-subtle p-3 rounded-lg font-mono">
              Codes will range from: {generatedRangeStart} to {generatedRangeEnd}
            </div>

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
          </div>
        </div>

        {/* Step 2: Assign to Agent */}
        <div className="border border-primary-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <h3 className="font-semibold text-primary-fg">Assign to Agent</h3>
          </div>

          <div className="space-y-4">
            {loadingAgents ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-primary-fg mb-2">Select Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    disabled={assigning}
                  >
                    <option value="">Choose an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email}) - {agent.referralCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Range Start</label>
                    <input
                      type="text"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent font-mono"
                      placeholder="TJW0001"
                      disabled={assigning || codesGenerated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-fg mb-2">Range End</label>
                    <input
                      type="text"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent font-mono"
                      placeholder="TJW0100"
                      disabled={assigning || codesGenerated}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedAgentId || !rangeStart || !rangeEnd}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Assign QR Codes to Agent
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


