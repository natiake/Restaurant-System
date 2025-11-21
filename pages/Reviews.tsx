
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Role, Staff } from '../types';

const QUICK_TAGS = ["Delicious Food 🍲", "Fast Service ⚡", "Friendly Staff 😊", "Great Atmosphere ✨", "Clean 🧼", "Good Music 🎵"];

const Reviews: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [waiters, setWaiters] = useState<Staff[]>([]);

  useEffect(() => {
    // Filter only waiters/staff
    setWaiters(DataService.getStaffList().filter(s => s.role === Role.STAFF || s.role === Role.CASHIER));
  }, []);

  const handleStaffSelect = (staff: Staff) => {
      setSelectedStaff(staff);
      setStep(2);
  };

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    const finalComment = selectedTags.length > 0 
        ? `[Tags: ${selectedTags.join(', ')}] ${comment}` 
        : comment;

    DataService.addReview({
      id: Date.now().toString(),
      rating,
      comment: finalComment,
      staffId: selectedStaff?.id || 'unknown',
      timestamp: Date.now(),
      type: 'CUSTOMER'
    });
    
    setStep(3); // Success Screen
    
    // Reset after 4 seconds
    setTimeout(() => {
      setStep(1);
      setRating(0);
      setSelectedStaff(null);
      setSelectedTags([]);
      setComment('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center">
            <h1 className="text-2xl text-white font-bold uppercase tracking-widest">Customer Feedback</h1>
            <div className="flex justify-center mt-4 gap-2">
                <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-500' : 'bg-slate-700'}`}></div>
                <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-500' : 'bg-slate-700'}`}></div>
                <div className={`h-2 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-yellow-500' : 'bg-slate-700'}`}></div>
            </div>
        </div>

        {/* Step 1: Select Staff */}
        {step === 1 && (
            <div className="flex-1 p-8 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Who served you today?</h2>
                <p className="text-slate-500 mb-8">Tap your waiter's name</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full overflow-y-auto max-h-[400px] p-2">
                    {waiters.map(staff => (
                        <button 
                           key={staff.id}
                           onClick={() => handleStaffSelect(staff)}
                           className="flex flex-col items-center bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-sm hover:border-yellow-400 hover:shadow-lg transition-all hover:-translate-y-1 group"
                        >
                            <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-2xl font-bold mb-4 group-hover:bg-yellow-100 group-hover:text-yellow-700 transition-colors border-2 border-white shadow-sm">
                                {staff.name.charAt(0)}
                            </div>
                            <span className="font-bold text-lg text-slate-700 group-hover:text-black">{staff.name}</span>
                            <span className="text-xs text-gray-400 uppercase mt-1">Server</span>
                        </button>
                    ))}
                    <button 
                        onClick={() => { setSelectedStaff(null); setStep(2); }}
                        className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-bold"
                    >
                        Skip / Not Sure
                    </button>
                </div>
            </div>
        )}

        {/* Step 2: Rating & Feedback */}
        {step === 2 && (
            <div className="flex-1 p-8 flex flex-col items-center animate-[slideInRight_0.5s_ease-out] w-full">
                <button onClick={() => setStep(1)} className="self-start text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
                
                {selectedStaff && (
                     <div className="flex items-center gap-2 mb-6 bg-blue-50 px-4 py-2 rounded-full text-blue-800 font-bold text-sm">
                        <span>Serving: {selectedStaff.name}</span>
                     </div>
                )}

                <h2 className="text-3xl font-bold text-slate-800 mb-6">How was your experience?</h2>
                
                {/* Stars */}
                <div className="flex gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setRating(star)}
                            onClick={() => setRating(star)}
                            className={`text-6xl transition-transform transform hover:scale-125 ${rating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-gray-200'}`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {/* Quick Tags */}
                <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-xl">
                    {QUICK_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                                selectedTags.includes(tag) 
                                ? 'bg-slate-800 text-white border-slate-800 scale-105' 
                                : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Comment */}
                <textarea 
                    placeholder="Any specific comments? (Optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full max-w-lg border-2 border-gray-200 rounded-xl p-4 text-lg outline-none focus:border-yellow-400 bg-gray-50 mb-6"
                    rows={2}
                />

                <button 
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="w-full max-w-lg bg-green-600 text-white font-bold py-5 rounded-xl text-xl shadow-lg hover:bg-green-700 hover:shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Submit Feedback
                </button>
            </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-[zoomIn_0.5s_ease-out] text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-5xl">🎉</span>
                </div>
                <h2 className="text-4xl font-bold text-slate-800 mb-2">Ameseginalehu!</h2>
                <p className="text-xl text-slate-500 mb-8">Thank you for helping us improve.</p>
                <p className="text-sm text-gray-300 uppercase tracking-widest">Resetting in a moment...</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default Reviews;
