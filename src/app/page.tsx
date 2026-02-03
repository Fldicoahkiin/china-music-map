import ChinaMap from '@/components/map/ChinaMap';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ParticleEffect from '@/components/effects/ParticleEffect';
import AudioRippleEffect from '@/components/effects/AudioRippleEffect';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <ParticleEffect />
      <AudioRippleEffect />
      <Header />
      <div className="flex pt-16 h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-4">
          <ChinaMap />
        </div>
      </div>
    </main>
  );
}
