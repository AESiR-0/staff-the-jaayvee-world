"use client";

import { useEffect, useState, useCallback } from "react";
import { getTeamSession, getAuthToken } from "@/lib/auth-utils";
import { checkHasAccessClient } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/rbac";
import {
  fetchCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  seedCareers,
  CareerData,
  CareerFormData,
} from "@/lib/api/careers";
import CareerHeader from "@/components/careers/CareerHeader";
import CareerForm from "@/components/careers/CareerForm";
import CareerList from "@/components/careers/CareerList";
import MessageBanner from "@/components/careers/MessageBanner";
import LoadingState from "@/components/careers/LoadingState";
import AccessDenied from "@/components/careers/AccessDenied";

export default function CareersPage() {
  const [careers, setCareers] = useState<CareerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [editingCareer, setEditingCareer] = useState<CareerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      setCheckingPermission(true);
      const session = getTeamSession();
      const userEmail = session?.email;

      if (!userEmail) {
        setCanManage(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setCanManage(false);
        return;
      }

      const result = await checkHasAccessClient(userEmail, 'careers', token);
      setCanManage(result.hasAccess);
    } catch (err) {
      console.error('Error checking permissions:', err);
      // Fallback: check if user is admin
      const session = getTeamSession();
      const userEmail = session?.email;
      if (userEmail) {
        const adminCheck = await isSuperAdmin(userEmail);
        setCanManage(adminCheck);
      } else {
        setCanManage(false);
      }
    } finally {
      setCheckingPermission(false);
    }
  }, []);

  const loadCareers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCareers();
      setCareers(data);
    } catch (err: any) {
      console.error('Error fetching careers:', err);
      setError(err.message || 'Failed to load careers. Please make sure the database migration has been run.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
    loadCareers();
  }, [checkPermission, loadCareers]);

  const handleEdit = (career: CareerData) => {
    setEditingCareer(career);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career position?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await deleteCareer(id);
      setSuccess('Career deleted successfully!');
      await loadCareers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting career:', err);
      setError(err.message || 'Failed to delete career');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (formData: CareerFormData) => {
    try {
      setSaving(true);
      setError(null);

      if (editingCareer) {
        await updateCareer(editingCareer.id, formData);
        setSuccess('Career updated successfully!');
      } else {
        await createCareer(formData);
        setSuccess('Career created successfully!');
      }

      await loadCareers();
      setShowForm(false);
      setEditingCareer(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving career:', err);
      setError(err.message || 'Failed to save career');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCareer(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddNew = () => {
    setEditingCareer(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleSeedData = async () => {
    if (!confirm('This will insert 7 dummy career positions. Continue?')) {
      return;
    }

    try {
      setSeeding(true);
      setError(null);
      const seeded = await seedCareers();
      setSuccess(`Successfully seeded ${seeded.length} careers!`);
      await loadCareers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error seeding careers:', err);
      setError(err.message || 'Failed to seed careers');
    } finally {
      setSeeding(false);
    }
  };

  if (checkingPermission || loading) {
    return (
      <LoadingState
        message={checkingPermission ? 'Checking permissions...' : 'Loading careers...'}
      />
    );
  }

  if (!canManage) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <CareerHeader
          onAddNew={handleAddNew}
          onSeedData={handleSeedData}
          showSeedButton={careers.length === 0}
          seeding={seeding}
          showForm={showForm}
        />

        <MessageBanner error={error} success={success} />

        {showForm && (
          <CareerForm
            career={editingCareer}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        )}

        <CareerList
          careers={careers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          disabled={saving}
        />
      </div>
    </div>
  );
}
