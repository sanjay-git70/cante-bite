
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Order, OrderStatus, User as AppUser, MenuItem, CanteenProfile } from '../types';
import SummaryDashboard from './SummaryDashboard';
import WalkInOrderView from './WalkInOrderView';
import ReportsAnalysisView from './ReportsAnalysisView';
import TVDashboard from './TVDashboard';
import { 
  Check, Play, Printer, Plus, Search, Trash2, 
  Package, UtensilsCrossed, Settings, 
  LogOut, LayoutDashboard,
  Edit2, ShoppingCart, ArrowLeft, RotateCw, X as XIcon, User as UserIcon,
  BarChart3, Store, Phone, Mail, Save, ToggleLeft as Toggle,
  Clock as ClockIcon, CreditCard, Monitor, AlertCircle, ChevronRight, CheckCircle2,
  Tv2, QrCode, Shield
} from 'lucide-react';

interface StaffViewProps {
  user: AppUser;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateMenu: (menu: MenuItem[]) => void;
  onLogout: () => void;
}

type StaffTab = 'summary' | 'orders' | 'inventory' | 'reports' | 'profile' | 'walk-in-order' | 'tv-view';

const StaffView: React.FC<StaffViewProps> = ({ user, orders, menu, onUpdateOrders, onUpdateMenu, onLogout }) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('summary');
  const [tabHistory, setTabHistory] = useState<StaffTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Profile settings state
  const initialCanteenProfile = user.profile as CanteenProfile;
  const [upiId, setUpiId] = useState(initialCanteenProfile?.payment_settings?.upi_id || 'canteen@upi');
  const [isCanteenActive, setIsCanteenActive] = useState(initialCanteenProfile?.status === 'active');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inventory Edit State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    item_name: '',
    price: 0,
    category: 'breakfast',
    availability: true,
    stock_offline: 100,
    stock_online: 50,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
  });

  const navigateTo = useCallback((tab: StaffTab) => {
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

  const handleSaveProfile = () => {
    const updatedProfile: CanteenProfile = {
      ...initialCanteenProfile,
      status: isCanteenActive ? 'active' : 'inactive',
      payment_settings: {
        ...initialCanteenProfile.payment_settings,
        upi_id: upiId
      }
    };
    
    // Simulate API update
    const usersStr = localStorage.getItem('hb_users') || '[]';
    const users: AppUser[] = JSON.parse(usersStr);
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, profile: updatedProfile } : u);
    localStorage.setItem('hb_users', JSON.stringify(updatedUsers));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, order_status: status } : o);
    onUpdateOrders(updated);
  };

  const toggleAvailability = (itemId: string) => {
    const updated = menu.map(m => m.id === itemId ? { ...m, availability: !m.availability } : m);
    onUpdateMenu(updated);
  };

  const deleteMenuItem = (itemId: string) => {
    if (confirm('Permanently delete this item?')) {
      onUpdateMenu(menu.filter(m => m.id !== itemId));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem: MenuItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      canteen_id: initialCanteenProfile?.canteen_id || 's1', 
      low_stock_threshold: 10
    } as MenuItem;
    onUpdateMenu([...menu, createdItem]);
    setIsAddingItem(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.student_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const filteredInventory = useMemo(() => {
    return menu.filter(m => m.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [menu, searchTerm]);

  if (activeTab === 'tv-view') {
    return <TVDashboard orders={orders} onBack={goBack} />;
  }

  return (
    <div key={refreshKey} className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] bg-gray-50 text-gray-900 animate-in fade-in duration-700">
      <aside className="w-full lg:w-72 bg-white border-r border-gray-200 p-6 flex flex-col gap-2 shrink-0 print:hidden shadow-sm">
        <div className="p-4 mb-6 bg-gray-950 rounded-[2.5rem] text-white shadow-xl shadow-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-gray-950 shadow-inner">
              {initialCanteenProfile?.canteen_name?.[0] || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="font-black text-sm truncate uppercase tracking-widest">{initialCanteenProfile?.canteen_name || 'My Canteen'}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Administrator</p>
            </div>
          </div>
        </div>

        {[
          { id: 'summary', icon: LayoutDashboard, label: 'Summary' },
          { id: 'walk-in-order', icon: ShoppingCart, label: 'New Bill' },
          { id: 'orders', icon: ClockIcon, label: 'Live Queue' },
          { id: 'inventory', icon: UtensilsCrossed, label: 'Menu Catalog' },
          { id: 'reports', icon: BarChart3, label: 'Financials' },
          { id: 'profile', icon: Settings, label: 'Configuration' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => navigateTo(tab.id as StaffTab)}
            className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' 
                : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-gray-100">
           <button 
            onClick={() => navigateTo('tv-view')}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all"
           >
            <Tv2 className="w-5 h-5" /> Launch TV Panel
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-2">
            <LogOut className="w-5 h-5" /> Sign Out
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div className="flex items-center gap-6">
            {tabHistory.length > 0 && (
              <button onClick={goBack} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-950 transition-all shadow-sm group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <h2 className="text-4xl font-black text-gray-950 tracking-tight capitalize">
                {activeTab === 'profile' ? 'Portal Setup' : (activeTab === 'orders' ? 'Live Queue' : (activeTab === 'inventory' ? 'Menu Catalog' : activeTab.replace('-', ' ')))}
              </h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-1">{initialCanteenProfile.canteen_name} Control Unit</p>
            </div>
          </div>
          {(activeTab === 'orders' || activeTab === 'inventory') && (
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] outline-none font-bold text-sm focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
                placeholder={activeTab === 'orders' ? "Search Token ID or Name..." : "Search Menu Items..."}
              />
            </div>
          )}
        </div>

        {activeTab === 'summary' && <SummaryDashboard orders={orders} onNewWalkIn={() => navigateTo('walk-in-order')} />}
        
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-right-4 duration-500">
             {filteredOrders.length === 0 ? (
               <div className="py-40 text-center text-gray-300 flex flex-col items-center gap-4">
                  <Package className="w-16 h-16 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-[10px]">No active orders found in queue</p>
               </div>
             ) : (
               filteredOrders.map(order => (
                 <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-8 hover:border-emerald-100 transition-all">
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center gap-5">
                          <div className="px-5 py-3 bg-gray-950 text-emerald-500 rounded-2xl font-black text-2xl tracking-tighter">
                             #{order.order_code}
                          </div>
                          <div>
                             <h4 className="font-black text-xl text-gray-950 leading-tight">{order.student_details?.full_name || 'Walk-in Guest'}</h4>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Canteen Catalog Items</p>
                   <p className="text-xl font-black text-gray-950">{filteredInventory.length} Active SKUs</p>
                </div>
                <button onClick={() => setIsAddingItem(true)} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all hover:bg-emerald-700">
                   <Plus className="w-5 h-5" /> Create Item
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredInventory.map(item => (
                  <div key={item.id} className={`bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm group transition-all flex flex-col ${item.availability ? 'hover:border-emerald-300' : 'bg-gray-50 opacity-70'}`}>
                     <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-gray-100 flex-shrink-0 relative shadow-inner">
                           <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           {!item.availability && <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-[2px] flex items-center justify-center text-[10px] text-white font-black uppercase tracking-widest">Inactive</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className="font-black text-gray-950 truncate text-lg">{item.item_name}</h4>
                              <button onClick={() => deleteMenuItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                           <p className="text-emerald-600 font-black text-2xl tracking-tighter">₹{item.price}</p>
                        </div>
                     </div>
                     
                     <div className="mt-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${item.availability ? 'text-emerald-600' : 'text-gray-400'}`}>{item.availability ? 'Active' : 'Inactive'}</span>
                           <button onClick={() => toggleAvailability(item.id)} className={`w-12 h-6 rounded-full relative transition-all ${item.availability ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1.5 w-3 h-3 bg-white rounded-full transition-all ${item.availability ? 'right-1.5' : 'left-1.5'}`} />
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'reports' && <ReportsAnalysisView orders={orders} menu={menu} onNewWalkIn={() => navigateTo('walk-in-order')} />}
        {activeTab === 'walk-in-order' && <WalkInOrderView user={user} menu={menu} onBack={goBack} onPlaceOrder={(o) => onUpdateOrders([o, ...orders])} />}
        
        {activeTab === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl pb-20">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Store className="w-5 h-5 text-emerald-600"/> Feature Controls</h3>
                      <button onClick={handleSaveProfile} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 transition-all">
                        <Save className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Save Changes</span>
                      </button>
                   </div>

                   {saveSuccess && (
                     <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
                     </div>
                   )}

                   <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                         <div>
                            <p className="text-xs font-black text-gray-900 leading-tight">Canteen Status</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Global visibility toggle</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCanteenActive ? 'text-emerald-600' : 'text-gray-400'}`}>{isCanteenActive ? 'ACTIVE' : 'INACTIVE'}</span>
                            <button onClick={() => setIsCanteenActive(!isCanteenActive)} className={`w-14 h-7 rounded-full relative transition-all ${isCanteenActive ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                               <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full transition-all ${isCanteenActive ? 'right-1.5' : 'left-1.5'}`} />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Merchant UPI ID</label>
                         <div className="relative">
                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 w-4 h-4" />
                            <input 
                              className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner focus:ring-2 focus:ring-emerald-500 transition-all" 
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="e.g. merchant@upi"
                            />
                         </div>
                         <p className="text-[8px] text-gray-400 font-bold uppercase px-2">This ID is used for all auto-generated payment QR codes.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                   <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><Printer className="w-5 h-5 text-emerald-600"/> Print Queue</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Master Hardware Binding</label>
                         <input className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" defaultValue={initialCanteenProfile.printer_settings?.printer_name} />
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 bg-emerald-600 p-12 rounded-[4rem] flex flex-col items-center gap-6 text-center shadow-2xl shadow-emerald-200">
                   <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white backdrop-blur-xl">
                      <Shield className="w-10 h-10" />
                   </div>
                   <button onClick={onLogout} className="px-12 py-5 bg-white text-emerald-700 font-black rounded-3xl shadow-2xl hover:bg-emerald-50 transition-all uppercase tracking-[0.2em] text-[12px]">Logout Securely</button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffView;
