import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { MOCK_STAFF } from '../constants';
import { Role } from '../types';

const Reviews: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const waiters = MOCK_STAFF.filter(s => s.role !== Role.KITCHEN);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addReview({
      id: Date.now().toString(),
      rating,
      comment,
      staffId: selectedStaff,
      timestamp: Date.now()
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment('');
      setRating(5);
      setSelectedStaff('');
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center flex-col text-green-600 animate-pulse">
        <h2 className="text-4xl font-bold mb-2">Ameseginalehu!</h2>
        <p>Thank you for your feedback.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Rate Your Experience</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-600 mb-2">Who served you?</label>
          <select 
            required
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 outline-none"
          >
            <option value="">Select Staff Member</option>
            {waiters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-600 mb-2">Rating</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-600 mb-2">Comment (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 outline-none h-32"
            placeholder="The food was..."
          />
        </div>

        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-4 rounded-lg hover:bg-slate-700 transition-colors">
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default Reviews;