
import React, { useState } from 'react';
import { WeddingPlan } from '../types';

interface OnboardingProps {
  onComplete: (plan: WeddingPlan) => void;
}

const steps = [
  { key: 'coupleNames', question: "Let's begin this beautiful journey. What are the names of the happy couple? (e.g., Priya, Rohan)", type: 'text' },
  { key: 'familyMembers', question: "Wonderful! And who are the key family members we should know? (e.g., parents' names)", type: 'text' },
  { key: 'dates', question: "What are the engagement and planned wedding dates? (e.g., 2024-12-10, 2025-08-15)", type: 'text' },
  { key: 'logistics', question: "Let's talk scale. What's the estimated guest count and primary wedding city?", type: 'text' },
  { key: 'budget', question: "And what is the overall budget range you're considering? (e.g., 10-15 Lakhs)", type: 'text' },
  { key: 'traditions', question: "Every wedding is unique. What core traditions will you be following? (e.g., Tamil Brahmin)", type: 'text' },
  { key: 'customRituals', question: "Are there any special custom family rituals to include?", type: 'text' },
  { key: 'priorities', question: "Finally, what are the three most important things to you? (e.g., Photography, Food, Guest Experience)", type: 'text' },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<string, string>>>({});
  const [inputValue, setInputValue] = useState('');

  const handleNext = () => {
    if (inputValue.trim() === '') return;
    
    const newAnswers = { ...answers, [steps[currentStep].key]: inputValue };
    setAnswers(newAnswers);
    setInputValue('');

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete
      const [couple1, couple2] = (newAnswers.coupleNames || ' , ').split(',');
      const [engagementDate, weddingDate] = (newAnswers.dates || ' , ').split(',');
      const [guestCount, location] = (newAnswers.logistics || ' , ').split(',');
      
      const finalPlan: WeddingPlan = {
        coupleNames: [couple1.trim(), couple2.trim()],
        familyMembers: (newAnswers.familyMembers || '').split(',').map(s => s.trim()),
        engagementDate: engagementDate.trim(),
        weddingDate: weddingDate.trim(),
        guestCount: parseInt(guestCount.trim()) || 0,
        location: location.trim(),
        budget: newAnswers.budget || '',
        traditions: newAnswers.traditions || '',
        customRituals: newAnswers.customRituals || '',
        priorities: (newAnswers.priorities || '').split(',').map(s => s.trim()),
      };
      onComplete(finalPlan);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-orange-700 mb-2">The Sankalpa</h1>
        <p className="text-gray-600 mb-8">Setting the intention for your beautiful journey together.</p>
        
        <div className="w-full bg-orange-100 rounded-full h-2.5 mb-8">
          <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        
        <div className="text-left mb-6">
          <label className="text-lg font-semibold text-gray-700 mb-4 block min-h-[3rem]">{steps[currentStep].question}</label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            className="w-full p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all"
            placeholder="Type your answer here..."
          />
        </div>
        
        <button
          onClick={handleNext}
          className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-md disabled:bg-gray-400"
          disabled={!inputValue.trim()}
        >
          {currentStep < steps.length - 1 ? 'Next' : 'Create Wedding Blueprint'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
