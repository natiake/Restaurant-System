import React, { useState } from 'react';
import { MOCK_STAFF } from '../constants';
import { Staff } from '../types';

interface LoginProps {
  onLogin: (user: Staff) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_STAFF.find((s) => s.pin === pin);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid PIN. Try 1234 (Admin), 0000 (Staff), or 1111 (Kitchen).');
      setPin('');
    }
  };

  const handleNumClick = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
    setError('');
  };

  return (
    <div className="max-w-md w-full bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="bg-slate-800 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">Staff Login</h2>
        <p className="text-slate-300 text-sm">Enter your 4-digit PIN</p>
      </div>
      <div className="p-8">
        <div className="mb-6 text-center">
          <input
            type="password"
            value={pin}
            readOnly
            className="text-4xl font-bold tracking-widest text-center w-full border-b-2 border-slate-300 focus:outline-none py-2"
            placeholder="••••"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 text-2xl font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => setPin('')}
            className="h-16 text-lg font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
          >
            CLR
          </button>
          <button
            onClick={() => handleNumClick('0')}
            className="h-16 text-2xl font-semibold rounded-lg bg-slate-100 hover:bg-slate-200"
          >
            0
          </button>
          <button
            onClick={handlePinSubmit}
            className="h-16 text-lg font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            GO
          </button>
        </div>
        
        <div className="text-center text-xs text-gray-400">
          <p>Offline Mode Active</p>
        </div>
      </div>
    </div>
  );
};

export default Login;