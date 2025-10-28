"use client";
import { useState, useEffect } from "react";
import { UserPlus, Users, CheckCircle } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth-utils";

interface Agent {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalMerchants: number;
}

export function AgentAssignment() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId || !rangeStart || !rangeEnd) {
      alert('Please fill all fields');
      return;
    }

    try {
      setAssigning(true);
      setSuccess(false);

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
      alert(`Successfully assigned ${result.count} codes to ${agents.find(a => a.id === selectedAgentId)?.name}`);
      
      setSuccess(true);
      setRangeStart("");
      setRangeEnd("");
      setSelectedAgentId("");
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (error: any) {
      console.error('Assignment error:', error);
      alert(error.message || 'Failed to assign codes');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-accent-light rounded-xl flex items-center justify-center">
          <UserPlus className="text-primary-accent" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-fg">Assign QR Codes to Agent</h2>
          <p className="text-sm text-primary-muted">Assign a range of QR codes to an agent</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Select Agent</label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
          >
            <option value="">Choose an agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email}) - {agent.referralCode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Range Start (e.g., TJW0001)</label>
          <input
            type="text"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent font-mono"
            placeholder="TJW0001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-fg mb-2">Range End (e.g., TJW0100)</label>
          <input
            type="text"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent font-mono"
            placeholder="TJW0100"
          />
        </div>

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-700">Codes assigned successfully!</span>
          </div>
        )}

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
              <Users size={16} />
              Assign QR Codes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

