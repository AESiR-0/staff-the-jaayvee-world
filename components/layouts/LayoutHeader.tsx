"use client";

import { SectionConfig } from "./SectionSidebar";

interface LayoutHeaderProps {
  currentSection: SectionConfig | undefined;
  selectedPage: 'home' | 'event-detail';
}

export function LayoutHeader({ currentSection, selectedPage }: LayoutHeaderProps) {
  if (!currentSection) return null;

  const Icon = currentSection.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{currentSection.label}</h1>
          <p className="text-sm text-gray-600 capitalize">{selectedPage} page</p>
        </div>
      </div>
    </div>
  );
}

