
import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Chat from './components/Chat';
import { WeddingPlan } from './types';

const App: React.FC = () => {
  const [weddingPlan, setWeddingPlan] = useState<WeddingPlan | null>(null);

  const handleOnboardingComplete = (plan: WeddingPlan) => {
    setWeddingPlan(plan);
  };

  return (
    <div className="h-screen w-screen font-sans text-gray-800 flex flex-col">
      {!weddingPlan ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <main className="flex-1 p-4 md:p-8 lg:p-12 bg-gradient-to-br from-orange-100 to-amber-100 flex flex-col items-center">
            {/* Dashboard Header */}
            <div className="w-full max-w-7xl mx-auto text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-orange-800 tracking-tight">Sanskara<span className="text-amber-600">AI</span></h1>
                <p className="text-lg text-gray-600 mt-2">Your tradition, your love story, orchestrated.</p>
            </div>
            {/* Main App Layout */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Modules */}
                <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white">
                    <h2 className="text-xl font-bold text-orange-800 mb-4">The Mandap</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-700">'Up Next' Timeline</h3>
                            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                                <li>Book Venue</li>
                                <li>Send Save-the-Dates</li>
                                <li>Outfit Trials</li>
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-orange-100">
                             <h3 className="font-semibold text-gray-700">Key Decisions Pending</h3>
                             <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md mt-2">Photography vs. Ritual Budget</p>
                        </div>
                         <div className="pt-4 border-t border-orange-100">
                             <h3 className="font-semibold text-gray-700">Quick Access</h3>
                             <div className="flex flex-wrap gap-2 mt-2">
                                <button className="bg-orange-200 text-orange-800 px-3 py-1 text-sm rounded-full">Vendors</button>
                                <button className="bg-orange-200 text-orange-800 px-3 py-1 text-sm rounded-full">Budget</button>
                                <button className="bg-orange-200 text-orange-800 px-3 py-1 text-sm rounded-full">Guest List</button>
                                <button className="bg-orange-200 text-orange-800 px-3 py-1 text-sm rounded-full">Checklist</button>
                             </div>
                        </div>
                    </div>
                </div>
                {/* Center Panel - Chat */}
                <div className="lg:col-span-2 h-[85vh] min-h-[600px]">
                     <Chat weddingPlan={weddingPlan} />
                </div>
            </div>
        </main>
      )}
    </div>
  );
};

export default App;
