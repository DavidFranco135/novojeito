import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useBarberStore } from './store';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import PublicBooking from './pages/PublicBooking';
import Suggestions from './pages/Suggestions'; // e outros imports...

const App: React.FC = () => {
  const { user, theme, login } = useBarberStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPublicView, setIsPublicView] = useState(true);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    const q = query(collection(db, 'notifications'), orderBy('time', 'desc'), limit(1));
    const unsub = onSnapshot(q, (sn) => {
      if (!sn.metadata.hasPendingWrites && !sn.empty) {
        audio.play().catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  if (isPublicView) return <PublicBooking />;

  return (
    <div className={`h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
         {activeTab === 'suggestions' ? <Suggestions /> : <div>Dashboard ADM</div>}
      </Layout>
      <button onClick={() => setIsPublicView(true)} className="fixed bottom-6 right-6 gradiente-ouro p-4 rounded-full">Site</button>
    </div>
  );
};

export default App;
