
import React, { useState, useEffect } from 'react';
import { Staff, Branch } from '../types';
import { DataService } from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: Staff) => void;
}

type LoginMode = 'POS' | 'ADMIN';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>('POS');
  
  // POS State
  const [pin, setPin] = useState('');
  
  // Admin State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Shared State
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

  const handleModeSwitch = (newMode: LoginMode) => {
      setMode(newMode);
      setError('');
      setPin('');
      setUsername('');
      setPassword('');
  };

  const handlePosLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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
      // Success
      loginUser(user);
    } else {
      // Failure
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

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = DataService.verifyCredentials(username, password);
      if (user) {
          loginUser(user);
      } else {
          setError(t.invalidCreds);
      }
  };

  const loginUser = (user: Staff) => {
      DataService.setBranch(selectedBranchId);
      DataService.logAction(user.name, 'Login', `User logged in to branch ${selectedBranchId} via ${mode}`);
      DataService.clockIn(user.id);
      onLogin(user);
  };

  const handleNumClick = (num: string) => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    if (pin.length < 6) setPin(prev => prev + num);
    setError('');
  };

  return (
    <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 border border-slate-200">
      {/* Header */}
      <div className={`p-6 text-center ${mode === 'ADMIN' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
        <h2 className="text-2xl font-bold text-white">
            {mode === 'POS' ? t.loginTitle : t.loginAdminTitle}
        </h2>
        <p className="text-slate-300 text-sm mt-1 font-medium">
            {mode === 'POS' ? t.enterPin : 'Authentication Required'}
        </p>
      </div>
      
      <div className="p-8 bg-white">
        {/* Branch Selector */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">📍 Select Branch</label>
            <select 
                className="w-full p-2 border-2 border-gray-100 rounded-lg bg-slate-50 font-bold text-slate-700 focus:border-slate-300 outline-none"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
            >
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
        </div>

        {mode === 'POS' ? (
            // --- POS PIN INTERFACE ---
            <>
                <div className="mb-6 text-center relative">
                  <input
                      type="password"
                      value={pin}
                      readOnly
                      className="text-5xl font-extrabold tracking-[1em] text-center w-full border-b-2 border-slate-200 focus:outline-none py-4 text-slate-800 bg-transparent"
                      placeholder="••••"
                  />
                  {error && <p className="text-red-500 text-sm mt-2 animate-pulse font-bold">{error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                    key={num}
                    onClick={() => handleNumClick(num.toString())}
                    disabled={!!lockedUntil}
                    className="h-16 text-2xl font-bold rounded-xl bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md hover:border border-slate-100 hover:text-slate-900 active:scale-95 transition-all disabled:opacity-50"
                    >
                    {num}
                    </button>
                ))}
                <button 
                    onClick={() => setPin('')}
                    disabled={!!lockedUntil}
                    className="h-16 text-lg font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 active:scale-95 transition-all"
                >
                    CLR
                </button>
                <button
                    onClick={() => handleNumClick('0')}
                    disabled={!!lockedUntil}
                    className="h-16 text-2xl font-bold rounded-xl bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md hover:border border-slate-100 active:scale-95 transition-all disabled:opacity-50"
                >
                    0
                </button>
                <button
                    onClick={() => handlePosLogin()}
                    disabled={!!lockedUntil}
                    className="h-16 text-lg font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-200 active:scale-95 transition-transform"
                >
                    GO
                </button>
                </div>

                {/* Demo Hints */}
                <div className="text-xs text-gray-400 text-center mb-4 bg-gray-50 p-2 rounded border border-dashed border-gray-200">
                   <span className="font-bold">Demo Pins:</span> Waiter: 0000 | Kitchen: 1111
                </div>
                
                <div className="text-center pt-2 border-t border-gray-100">
                    <button onClick={() => handleModeSwitch('ADMIN')} className="text-sm text-blue-600 font-bold hover:underline">
                        {t.loginAsAdmin}
                    </button>
                </div>
            </>
        ) : (
            // --- ADMIN FORM INTERFACE ---
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.username}</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-lg font-bold focus:border-slate-800 outline-none transition-colors"
                        placeholder="Enter Username"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.password}</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-lg font-bold focus:border-slate-800 outline-none transition-colors"
                        placeholder="••••••"
                    />
                </div>
                
                {error && <div className="bg-red-50 p-3 rounded text-red-500 text-sm text-center font-bold border border-red-100">{error}</div>}

                {/* Demo Credentials Hint */}
                <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded border border-dashed border-gray-200 space-y-1">
                   <div className="font-bold text-gray-500 mb-1">Demo Credentials:</div>
                   <div className="flex justify-between"><span>Admin:</span> <span className="font-mono text-slate-600">admin / password</span></div>
                   <div className="flex justify-between"><span>Manager:</span> <span className="font-mono text-slate-600">abebe / password</span></div>
                   <div className="flex justify-between"><span>Store:</span> <span className="font-mono text-slate-600">store / password</span></div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg shadow-slate-200 mt-4"
                >
                    Login to Dashboard
                </button>

                <div className="text-center mt-6">
                    <button type="button" onClick={() => handleModeSwitch('POS')} className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                        ← {t.loginAsPos}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default Login;
