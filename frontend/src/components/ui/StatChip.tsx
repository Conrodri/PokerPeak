import React from 'react';

/** Compact stat display: icon · value · label */
export function StatChip({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500">{icon}</span>
      <span className={`font-bold text-sm ${color}`}>{value}</span>
      <span className="text-gray-600 text-xs">{label}</span>
    </div>
  );
}
