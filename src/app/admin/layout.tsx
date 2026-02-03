'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
