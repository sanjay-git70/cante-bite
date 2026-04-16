
import React, { useState, useCallback, useEffect } from 'react';
import { Order, MenuItem, User as AppUser, CanteenProfile, AdminProfile } from '../types';
import SummaryDashboard from './SummaryDashboard';
import ReportsAnalysisView from './ReportsAnalysisView';
import { 
  Users, ShoppingBag, Search, 
  Trash2, ChevronRight, LayoutDashboard,
  ArrowLeft, RotateCw, Store, BarChart3, Settings, Shield, Power, Phone, Mail, MapPin, Save, Printer, Bell, BellOff, AlertTriangle, Key, LogOut, Hash, User as UserIcon
} from 'lucide-react';

interface AdminViewProps {
  user: AppUser;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onLogout: () => void;
}

type AdminTab = 'summary' | 'orders' | 'reports' | 'profile' | 'users';

const AdminView: React.FC<AdminViewProps> = ({ user, orders, menu, onUpdateOrders, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('summary');
  const [tabHistory, setTabHistory] = useState<AdminTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const adminProfile = user.profile as AdminProfile;

  const navigateTo = useCallback((tab: AdminTab) => {
    if (tab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory]);

  // Keyboard Shortcuts: ESC, TAB (Canteen Bill), Shift+Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        navigateTo('orders');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        goBack();
      }
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, navigateTo]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (rollNumberInput !== adminProfile?.roll_number) {
      setPasswordError("Verification Failed: Valid Roll Number is required for password reset.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Security Rule: New password must be at least 6 characters.");
      return;
    }

    // Persist Change
    const allUsers = JSON.parse(localStorage.getItem('hb_users') || '[]');
    const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
    if (userIndex > -1) {
      allUsers[userIndex].password = newPassword;
      localStorage.setItem('hb_users', JSON.stringify(allUsers));
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordForm(false);
      setNewPassword('');
      setRollNumberInput('');
      setPasswordSuccess(false);
    }, 2000);
  };

  return (
    <div key={refreshKey} className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {tabHistory.length > 0 && (
            <button onClick={goBack} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <h2 className="text-4xl font-black text-gray-950 tracking-tight">System Master</h2>
            <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.5em] mt-2">Administrative Console</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm flex-wrap">
            {[
              { id: 'summary', icon: LayoutDashboard, label: 'Summary' },
              { id: 'orders', icon: ShoppingBag, label: 'Tickets' },
              { id: 'reports', icon: BarChart3, label: 'Reports' },
              { id: 'profile', icon: Settings, label: 'Profile' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest ${
                  activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'summary' && <SummaryDashboard orders={orders} onNewWalkIn={() => navigateTo('orders')} />}
      {activeTab === 'reports' && <ReportsAnalysisView orders={orders} menu={menu} />}

      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ADMIN IDENTITY SECTION */}
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg">
                       <Shield className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900">Administrator</h3>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{adminProfile?.full_name}</p>
                    </div>
                 </div>

                 <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Email ID</span>
                       <span className="font-bold text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Roll Number</span>
                       <span className="font-black text-emerald-600">{adminProfile?.roll_number}</span>
                    </div>
                 </div>

                 <button onClick={onLogout} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                    <LogOut className="w-5 h-5" /> Sign Out Securely
                 </button>
              </div>

              {/* SECURITY / PASSWORD CHANGE SECTION */}
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                       <Key className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900">Security Credentials</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reset Master Password</p>
                    </div>
                 </div>

                 {!showPasswordForm ? (
                   <div className="space-y-4">
                      <p className="text-sm text-gray-500 font-bold leading-relaxed">Password reset requires verification of your system-assigned administrative roll number.</p>
                      <button onClick={() => setShowPasswordForm(true)} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Start Password Reset</button>
                   </div>
                 ) : (
                   <form onSubmit={handlePasswordChange} className="space-y-5 animate-in slide-in-from-top-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">System Roll No.</label>
                        <input required className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Verification Required" value={rollNumberInput} onChange={e => setRollNumberInput(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">New Secret Password</label>
                        <input required type="password" className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>

                      {passwordError && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest px-2">{passwordError}</p>}
                      {passwordSuccess && <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2">Password changed successfully!</p>}

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100">Reset Password</button>
                      </div>
                   </form>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
