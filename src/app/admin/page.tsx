'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'bands' | 'genres' | 'data'>('bands');

  const tabs = [
    { id: 'bands', label: 'Bands', icon: '🎸' },
    { id: 'genres', label: 'Genres', icon: '🎵' },
    { id: 'data', label: 'Import/Export', icon: '📁' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'bands' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Band Management</h2>
            <p className="text-gray-400">Band CRUD operations coming soon...</p>
          </div>
        )}

        {activeTab === 'genres' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Genre Management</h2>
            <p className="text-gray-400">Genre configuration coming soon...</p>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Data Import/Export</h2>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                Export JSON
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Import JSON
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
