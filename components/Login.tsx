
import React, { useState } from 'react';
import { AppRole, User, StudentProfile, CanteenProfile, AdminProfile } from '../types';
import { Coffee, ArrowRight, Mail, Lock, User as UserIcon, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [fullName, setFullName] = useState('');
  const [canteenName, setCanteenName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    await new Promise(r => setTimeout(r, 1000));
    const usersStr = localStorage.getItem('hb_users') || '[]';
    const users: User[] = JSON.parse(usersStr);

    try {
      if (!isNewUser) {
        if (email === 'admin@hostel.com') {
           setSuccessMsg('System Authority Verified. Welcome back.');
           const admin: User = { 
             id: 'admin-1', 
             email: 'admin@hostel.com', 
             role: 'admin', 
             profile: { admin_id: 'admin-1', full_name: 'Master Admin', roll_number: 'ADM-001', email: 'admin@hostel.com' } 
           };
           setTimeout(() => onLogin(admin), 800);
           return;
        }

        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
          setSuccessMsg('Authentication Successful. Redirecting...');
          setTimeout(() => onLogin(foundUser), 800);
        } else {
          setError('Credentials not found. Please register.');
        }
      } else {
        const nameToSave = role === 'student' ? fullName : (role === 'staff' ? canteenName : fullName);
        if (!nameToSave) {
          setError(`Identify yourself to proceed.`);
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          role: role,
          last_login: new Date().toISOString(),
          profile: role === 'student' 
            ? { student_id: '', full_name: fullName, register_number: '', hostel_name: '', room_number: '', phone_number: '' } as StudentProfile
            : role === 'admin'
            ? { admin_id: '', full_name: fullName, roll_number: rollNumber, email: email } as AdminProfile
            : { 
                canteen_id: '', 
                canteen_name: canteenName, 
                owner_name: 'Proprietor', 
                address: 'Main Campus',
                contact_number: '0000000000',
                email: email,
                is_online: true, 
                status: 'active',
                operating_hours: { open: '08:00', close: '22:00' },
                printer_settings: { 
                  printer_name: 'Main Counter',
                  printer_type: 'thermal', 
                  font_size: 'medium', 
                  show_logo: true, 
                  show_datetime: true, 
                  show_ordertype: true, 
                  show_prices: true,
                  paper_size: '80mm',
                  print_speed: 'medium',
                  auto_cut: true,
                  print_header_text: canteenName,
                  print_footer_text: 'Thank you!'
                },
                payment_settings: { qr_enabled: true, upi_id: 'canteen@upi', default_payment_mode: 'mixed' },
                notification_settings: { low_stock_threshold: 10, enable_pwa_notifications: true }
              } as CanteenProfile
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('hb_users', JSON.stringify(updatedUsers));
        setSuccessMsg('Account created successfully!');
        setTimeout(() => onLogin(newUser), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-4 selection:bg-emerald-600 selection:text-white">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl p-8 border border-emerald-100/50 flex flex-col items-center">
        
        <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-100 mb-6">
          <Coffee className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-950 tracking-tight text-center">Hostel Bites</h1>
        <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.3em] mt-2">Campus Food Portal</p>

        <form onSubmit={handleAuth} className="w-full mt-8 space-y-4">
          {isNewUser && (
            <div className="flex bg-gray-50 p-1 rounded-[1.2rem] border border-gray-100 mb-2">
              {(['student', 'staff', 'admin'] as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest ${
                    role === r ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {isNewUser && (
              <>
                <div className="relative animate-in slide-in-from-top-4">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                  <input
                    required
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold text-xs text-gray-900"
                    placeholder={role === 'staff' ? "Canteen Name" : "Full Name"}
                    value={role === 'staff' ? canteenName : fullName}
                    onChange={(e) => role === 'staff' ? setCanteenName(e.target.value) : setFullName(e.target.value)}
                  />
                </div>
                {role === 'admin' && (
                   <div className="relative animate-in slide-in-from-top-4">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                    <input
                      required
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold text-xs text-gray-900"
                      placeholder="Admin Roll Number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold text-xs text-gray-900"
                placeholder="University Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold text-xs text-gray-900"
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="w-full p-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 animate-in fade-in bg-red-50 text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="w-full p-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 animate-in fade-in bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isNewUser ? 'Join Now' : 'Log In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-4 text-center">
            <button 
              type="button" 
              onClick={() => { setIsNewUser(!isNewUser); setError(''); setSuccessMsg(''); }}
              className="text-[9px] font-black uppercase text-gray-400 hover:text-emerald-700 tracking-[0.2em] transition-colors"
            >
              {isNewUser ? 'Back to Login' : 'Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
