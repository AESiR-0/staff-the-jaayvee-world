"use client";

import { Briefcase } from "lucide-react";
import { CareerData } from "@/lib/api/careers";
import CareerCard from "./CareerCard";

interface CareerListProps {
  careers: CareerData[];
  onEdit: (career: CareerData) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export default function CareerList({ careers, onEdit, onDelete, disabled }: CareerListProps) {
  if (careers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No career positions found. Create your first position above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Positions ({careers.length})</h2>
      <div className="space-y-4">
        {careers.map((career) => (
          <CareerCard
            key={career.id}
            career={career}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

