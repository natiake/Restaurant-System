
import React, { useState, useEffect } from 'react';
import { Staff, Branch } from '../types';
import { DataService } from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: Staff) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
      const list = DataService.getBranches();
      setBranches(list);
      const current = DataService.getCurrentBranch();
      if (current) setSelectedBranchId(current.id);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockedUntil) {
      if (Date.now() < lockedUntil) {
        setError(t.lockedOut);
        return;
      } else {
        setLockedUntil(null);
        setAttempts(0);
      }
    }

    const user = DataService.verifyPin(pin);
    
    if (user) {
      DataService.setBranch(selectedBranchId);
      DataService.logAction(user.name, 'Login', `User logged in to branch ${selectedBranchId}`);
      DataService.clockIn(user.id);
      onLogin(user);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60000); // 1 minute lock
        setError(t.lockedOut);
      } else {
        setError(`${t.invalidPin} (${5 - newAttempts} attempts left)`);
      }
      setPin('');
    }
  };

  const handleNumClick = (num: string) => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    if (pin.length < 6) setPin(prev => prev + num);
    setError('');
  };

  return (
    <div className="max-w-md w-full bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="bg-slate-800 p-6 text-center">
        <h2 className="text-2xl font-bold text-white">{t.loginTitle}</h2>
        <p className="text-slate-300 text-sm">{t.enterPin}</p>
      </div>
      <div className="p-8">
        {/* Branch Selector */}
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Branch</label>
            <select 
                className="w-full p-2 border rounded bg-slate-50 font-bold"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
            >
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
        </div>

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
              disabled={!!lockedUntil}
              className="h-16 text-2xl font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => setPin('')}
            disabled={!!lockedUntil}
            className="h-16 text-lg font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
          >
            CLR
          </button>
          <button
            onClick={() => handleNumClick('0')}
            disabled={!!lockedUntil}
            className="h-16 text-2xl font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handlePinSubmit}
            disabled={!!lockedUntil}
            className="h-16 text-lg font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            GO
          </button>
        </div>
        
        <div className="text-center text-xs text-gray-400">
          <p>AddisManage Enterprise v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
