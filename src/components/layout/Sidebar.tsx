'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';
import { useBandStore } from '@/store/useBandStore';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { filteredBands } = useBandStore();

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        ☰
      </button>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-16 bottom-0 w-80 bg-black/50 backdrop-blur-lg border-r border-white/10 z-30 overflow-y-auto"
          >
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Bands</h2>
              <div className="space-y-2">
                {filteredBands.slice(0, 10).map((band) => (
                  <div
                    key={band.id}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium">{band.name}</h3>
                    <p className="text-sm text-gray-400">{band.province}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
