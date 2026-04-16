
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Order, MenuItem, OrderItem, StudentProfile, PaymentMethod } from '../types';
import { 
  ShoppingCart, CheckCircle, Utensils, LogOut, 
  User as UserIcon, ShoppingBag, Bell, X, 
  Clock, ArrowLeft, Mail, Phone, Hash, Key, 
  ChevronRight, MapPin, Search, Info, ShieldCheck, 
  CreditCard, Smartphone, QrCode, Copy, ExternalLink,
  ChevronLeft, ArrowRight, Trash2, AlertCircle
} from 'lucide-react';
import { CANCEL_WINDOW_MS } from '../constants';
import OrderPlacedPopup from './OrderPlacedPopup';

interface StudentViewProps {
  user: User;
  orders: Order[];
  menu: MenuItem[];
  onUpdateOrders: (orders: Order[]) => void;
  onLogout: () => void;
  onUpdateProfile: (profile: StudentProfile) => void;
}

type StudentTab = 'home' | 'orders' | 'cart' | 'profile';
type CheckoutStep = 'basket' | 'billing' | 'payment';

const CancellationTimer = ({ createdAt }: { createdAt: string }) => {
  const getRemaining = useCallback(() => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diff = CANCEL_WINDOW_MS - (now - created);
    return Math.max(0, diff);
  }, [createdAt]);

  const [timeLeft, setTimeLeft] = useState(getRemaining());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const next = getRemaining();
      setTimeLeft(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [getRemaining, timeLeft]);

  if (timeLeft <= 0) return null;

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100 animate-pulse">
      <Clock className="w-2.5 h-2.5" />
      <span className="text-[8px] font-black uppercase tracking-widest">Cancel window: {mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
};

const StudentView: React.FC<StudentViewProps> = ({ user, orders, menu, onUpdateOrders, onLogout, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [tabHistory, setTabHistory] = useState<StudentTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('basket');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlacedPopup, setShowPlacedPopup] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  
  // UPI Payment State
  const studentProfile = user.profile as StudentProfile;
  const isProfileIncomplete = !studentProfile?.register_number || !studentProfile?.hostel_name;

  // Derive counts
  const studentOrders = useMemo(() => orders.filter(o => o.student_id === user.id), [orders, user.id]);
  const onlineCount = useMemo(() => studentOrders.filter(o => o.order_type === 'online').length, [studentOrders]);
  const offlineCount = useMemo(() => studentOrders.filter(o => o.order_type === 'walk-in').length, [studentOrders]);

  const navigateTo = useCallback((tab: StudentTab) => {
    if (tab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
    if (tab === 'cart') setCheckoutStep('basket');
  }, [activeTab]);

  const goBack = useCallback(() => {
    if (activeTab === 'cart' && checkoutStep !== 'basket') {
      if (checkoutStep === 'payment') setCheckoutStep('billing');
      else setCheckoutStep('basket');
      return;
    }
    if (tabHistory.length === 0) return;
    const previous = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, -1));
    setActiveTab(previous);
  }, [tabHistory, activeTab, checkoutStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  const [profileForm, setProfileForm] = useState({
    full_name: studentProfile?.full_name || '',
    register_number: studentProfile?.register_number || '',
    hostel_name: studentProfile?.hostel_name || '',
    room_number: studentProfile?.room_number || '',
    phone_number: studentProfile?.phone_number || ''
  });

  const total = useMemo(() => cart.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cart]);
  const upfront = Math.round(total * 0.5);

  const toggleCartItem = (item: MenuItem) => {
    if (!item.availability) return; // Prevent adding inactive items
    setCart(prev => {
      const exists = prev.find(i => i.menu_item_id === item.id);
      if (exists) return prev.filter(i => i.menu_item_id !== item.id);
      return [...prev, { menu_item_id: item.id, item_name: item.item_name, price: item.price, quantity: 1 }];
    });
  };

  const finalizeOrder = () => {
    const firstMenuItem = menu.find(m => m.id === cart[0]?.menu_item_id);
    const canteenId = firstMenuItem?.canteen_id || 'canteen-1';
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: user.id,
      canteen_id: canteenId,
      total_amount: total,
      paid_amount: upfront,
      order_status: 'pending',
      order_type: 'online',
      order_code: Math.floor(1000 + Math.random() * 9000).toString(),
      created_at: new Date().toISOString(),
      order_items: [...cart],
      student_details: studentProfile,
    };
    onUpdateOrders([newOrder, ...orders]);
    setCheckoutStep('payment');
  };

  const handleConfirmPayment = () => {
    setShowPlacedPopup(true);
    setCart([]);
  };

  const handlePopupClose = () => {
    setShowPlacedPopup(false);
    navigateTo('orders');
  };

  const cancelOrder = (orderId: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, order_status: 'cancelled' as const } : o);
    onUpdateOrders(updated);
    setCancellingOrderId(null);
  };

  const isOrderCancellable = (order: Order) => {
    if (order.order_status !== 'pending') return false;
    const created = new Date(order.created_at).getTime();
    const now = Date.now();
    return (now - created) < CANCEL_WINDOW_MS;
  };

  const highlights = useMemo(() => menu.filter(m => m.availability).slice(0, 3), [menu]);
  const filteredMenu = useMemo(() => menu.filter(m => m.item_name.toLowerCase().includes(searchTerm.toLowerCase())), [menu, searchTerm]);

  const SlideButton = ({ onConfirm }: { onConfirm: () => void }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const updateSlider = (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.min(Math.max(0, (x / rect.width) * 100), 100);
      setSliderValue(percent);
      if (percent >= 90) {
        setIsConfirmed(true);
        setSliderValue(100);
        setTimeout(onConfirm, 500);
      }
    };

    return (
      <div 
        ref={sliderRef}
        className="relative h-14 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center p-1 border border-gray-200 select-none"
        onTouchMove={(e) => !isConfirmed && updateSlider(e.touches[0].clientX)}
        onMouseMove={(e) => !isConfirmed && e.buttons === 1 && updateSlider(e.clientX)}
        onMouseUp={() => !isConfirmed && setSliderValue(0)}
        onTouchEnd={() => !isConfirmed && setSliderValue(0)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
            {isConfirmed ? 'Order Placed!' : 'Slide to Confirm'}
          </span>
        </div>
        <div 
          className="absolute left-1 h-12 w-12 bg-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer transition-transform"
          style={{ transform: `translateX(${(sliderValue / 100) * (sliderRef.current?.offsetWidth ? sliderRef.current.offsetWidth - 56 : 0)}px)` }}
        >
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    );
  };

  if (isProfileIncomplete) {
    return (
      <div className="min-h-screen bg-white max-w-md mx-auto p-8 flex flex-col justify-center animate-in fade-in duration-700">
        <h1 className="text-3xl font-black text-gray-950 tracking-tight leading-none mb-1">Almost There</h1>
        <p className="text-emerald-600 font-black uppercase text-[9px] tracking-[0.2em] mb-8">Setup campus identity</p>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onUpdateProfile(profileForm as any); }}>
          <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold border-none text-sm" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} placeholder="Full Name" />
          <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold border-none text-sm" value={profileForm.register_number} onChange={e => setProfileForm({...profileForm, register_number: e.target.value})} placeholder="Register ID" />
          <input required className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold border-none text-sm" value={profileForm.hostel_name} onChange={e => setProfileForm({...profileForm, hostel_name: e.target.value})} placeholder="Hostel Block" />
          <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl mt-4 shadow-lg shadow-emerald-200 active:scale-95 transition-all uppercase tracking-widest text-[10px]">Verify & Save</button>
        </form>
      </div>
    );
  }

  return (
    <div key={refreshKey} className="flex flex-col min-h-screen bg-white max-w-md mx-auto relative overflow-hidden w-full">
      {showPlacedPopup && <OrderPlacedPopup onClose={handlePopupClose} />}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="text-lg font-black text-gray-950 tracking-tight mb-2">Cancel Order?</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">This action cannot be undone. Refund will be processed as per policy.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => cancelOrder(cancellingOrderId)} className="w-full py-3.5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Confirm Cancellation</button>
              <button onClick={() => setCancellingOrderId(null)} className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black uppercase text-[10px] tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}

      <header className="px-5 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md flex justify-between items-center border-b border-gray-50">
        <div className="flex items-center gap-2">
          {activeTab === 'cart' && checkoutStep !== 'basket' ? (
            <button onClick={goBack} className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <div className="p-1.5 bg-emerald-600 rounded-lg shadow-md shadow-emerald-100">
              <Utensils className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-base font-black text-gray-950 tracking-tight leading-none">
              {activeTab === 'cart' ? (checkoutStep === 'payment' ? 'Payment' : 'Checkout') : 'Hostel Bites'}
            </h1>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Campus Hub</span>
          </div>
        </div>
        <button onClick={() => navigateTo('profile')} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 overflow-hidden group hover:border-emerald-200 transition-all">
          {studentProfile?.full_name ? (
            <span className="font-black text-gray-950 text-[10px] group-hover:text-emerald-600">{studentProfile.full_name[0]}</span>
          ) : (
            <UserIcon className="w-4 h-4" />
          )}
        </button>
      </header>

      <main className="flex-1 pb-28 overflow-y-auto w-full no-scrollbar">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
            {/* Order Count Breakdown */}
            <div className="px-5 mt-4">
               <div className="bg-emerald-50 rounded-3xl p-4 flex justify-between items-center border border-emerald-100 shadow-sm">
                  <div className="flex flex-col">
                    <p className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Your Activity</p>
                    <p className="text-sm font-black text-gray-950">Campus Order Summary</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                       <p className="text-lg font-black text-emerald-700 leading-none">{onlineCount}</p>
                       <p className="text-[7px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Online</p>
                    </div>
                    <div className="w-px h-8 bg-emerald-200/50" />
                    <div className="text-center">
                       <p className="text-lg font-black text-gray-900 leading-none">{offlineCount}</p>
                       <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Counter</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="px-5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Snacks, meals..." 
                  className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <section className="space-y-3 w-full overflow-hidden">
              <div className="px-5 flex justify-between items-end">
                <h3 className="text-base font-black text-gray-950 tracking-tight">Daily Highlights</h3>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">Live <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /></span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar scroll-smooth w-full">
                {highlights.map(item => {
                  const inCart = cart.find(i => i.menu_item_id === item.id);
                  return (
                    <div key={item.id} className="min-w-[240px] bg-white border border-gray-100 rounded-3xl p-3 shadow-sm group active:scale-95 transition-all">
                      <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-50 relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black text-gray-950 uppercase tracking-widest shadow-md">
                          Hot
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-gray-900 leading-tight text-xs">{item.item_name}</h4>
                          <p className="text-emerald-600 font-black text-sm mt-0.5">₹{item.price}</p>
                        </div>
                        <button onClick={() => toggleCartItem(item)} className={`p-3 rounded-xl transition-all shadow-md active:scale-90 ${inCart ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-gray-50 text-emerald-600'}`}>
                          {inCart ? <CheckCircle className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="px-5 space-y-3 w-full">
              <h3 className="text-base font-black text-gray-950 tracking-tight">Explore Menu</h3>
              <div className="grid grid-cols-1 gap-3 w-full">
                {filteredMenu.map(item => {
                  const inCart = cart.find(i => i.menu_item_id === item.id);
                  const isAvailable = item.availability;
                  return (
                    <div key={item.id} className={`flex gap-3 p-3 rounded-3xl border border-gray-100 items-center shadow-sm group transition-all ${isAvailable ? 'bg-white hover:border-emerald-100' : 'bg-gray-50 opacity-60 grayscale'}`}>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {!isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-black text-[8px] uppercase tracking-tighter">Inactive</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 truncate text-xs">{item.item_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-emerald-600 font-black text-sm">₹{item.price}</p>
                          <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">• {item.category}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleCartItem(item)} 
                        disabled={!isAvailable}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${inCart ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-gray-50 text-emerald-600'} disabled:opacity-20`}
                      >
                        {inCart ? <CheckCircle className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="px-5 pt-4 space-y-4 animate-in slide-in-from-right-4 duration-500 w-full">
            <h3 className="text-xl font-black text-gray-950 tracking-tight">Active Tickets</h3>
            {studentOrders.length === 0 ? (
              <div className="py-16 text-center opacity-20 font-black uppercase tracking-widest text-[10px] flex flex-col items-center gap-3">
                <Clock className="w-10 h-10" />
                Empty Queue
              </div>
            ) : (
              studentOrders.map(order => (
                <div key={order.id} className={`p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 hover:border-emerald-100 transition-all relative overflow-hidden ${order.order_status === 'cancelled' ? 'bg-gray-50 grayscale' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Token ID</p>
                      <h4 className="font-black text-xl text-gray-950 tracking-tighter">#{order.order_code}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${
                        order.order_status === 'ready' ? 'bg-emerald-500 text-white' : 
                        order.order_status === 'preparing' ? 'bg-blue-600 text-white' : 
                        order.order_status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'
                      }`}>{order.order_status}</span>
                      {order.order_status !== 'cancelled' && <CancellationTimer createdAt={order.created_at} />}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl space-y-1.5 border border-gray-50">
                    {order.order_items?.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-600">
                        <span>{i.quantity}x {i.item_name}</span>
                        <span className="text-gray-400 font-black">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {isOrderCancellable(order) && (
                    <button 
                      onClick={() => setCancellingOrderId(order.id)}
                      className="w-full mt-2 py-3 bg-red-50 text-red-600 font-black uppercase text-[9px] tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ... rest of the tabs ... */}
        {activeTab === 'cart' && (
          <div className="px-5 pt-4 animate-in duration-500 w-full">
            {checkoutStep === 'basket' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 w-full">
                <h3 className="text-xl font-black text-gray-950 tracking-tight">Confirm Order</h3>
                {cart.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center gap-3 opacity-10 font-black uppercase tracking-widest text-xs">
                    <ShoppingBag className="w-16 h-16" />
                    <p>No items added</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.menu_item_id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                           <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                              <img src={menu.find(m => m.id === item.menu_item_id)?.imageUrl} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-black text-gray-950 text-xs truncate">{item.item_name}</h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                 <span>Qty: {item.quantity}</span>
                                 <span>•</span>
                                 <span>Regular</span>
                              </div>
                              <p className="text-emerald-600 font-black text-sm mt-0.5">₹{item.price}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                          <span className="font-black text-gray-950 text-sm">₹{total}</span>
                       </div>
                       <div className="h-px bg-gray-50" />
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-gray-950 tracking-tight">Total</span>
                          <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{total}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => setCheckoutStep('billing')}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                    >
                      To Billing Details
                    </button>
                  </>
                )}
              </div>
            )}
            {checkoutStep === 'billing' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 w-full">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-950 tracking-tight">Billing Detail</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Status: Processing</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Summary</h4>
                       <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{cart.length} Items</span>
                    </div>
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.menu_item_id} className="flex justify-between items-center text-xs font-bold">
                           <span className="text-gray-600">{item.quantity}x {item.item_name}</span>
                           <span className="text-gray-900 font-black">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-gray-50" />
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bill</span>
                       <span className="text-xl font-black text-emerald-600 tracking-tighter">₹{total}</span>
                    </div>
                  </div>
                <div className="pt-6">
                  <SlideButton onConfirm={finalizeOrder} />
                </div>
              </div>
            )}
            {checkoutStep === 'payment' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 bg-gray-950 -mx-5 -mt-4 p-6 min-h-screen text-white rounded-t-[2.5rem] overflow-x-hidden w-[calc(100%+40px)]">
                <div className="flex items-center justify-between mb-6">
                   <button onClick={() => setCheckoutStep('billing')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                   </button>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Payment</p>
                      <h4 className="text-lg font-black tracking-tight">Secure Gate</h4>
                   </div>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-5 backdrop-blur-xl">
                   <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Pay to Campus</p>
                        <p className="text-sm font-black text-white font-mono truncate">{menu.find(m => m.id === cart[0]?.menu_item_id)?.canteen_id === 's2' ? 'Snack Shack' : 'Main Canteen'}</p>
                      </div>
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl shrink-0">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                   </div>
                   <div className="space-y-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400">Total Bill</span>
                        <span className="text-xl font-black text-emerald-500">₹{total}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-[2rem]">
                   <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=canteen@upi&pn=Canteen&am=${total}&cu=INR`)}`} 
                      className="w-40 h-40"
                      alt="Payment QR"
                   />
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Scan at counter or pay via UPI</p>
                </div>

                <button onClick={handleConfirmPayment} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  Confirm Payment
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="px-5 pt-4 space-y-5 animate-in fade-in duration-500 pb-12 w-full">
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-200 mb-4">
                  {studentProfile?.full_name?.[0] || 'U'}
                </div>
                <h3 className="text-lg font-black text-gray-950 tracking-tight">{studentProfile?.full_name}</h3>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">{studentProfile?.register_number || 'REG-USER'}</p>
             </div>
             <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 mt-2">
                <LogOut className="w-4 h-4" /> Terminate Session
             </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 bg-white border border-gray-100 rounded-[2rem] h-16 px-6 flex items-center justify-between shadow-xl z-50">
        {[
          { id: 'home', icon: Utensils, label: 'Menu' },
          { id: 'orders', icon: Clock, label: 'Tickets' },
          { id: 'cart', icon: ShoppingBag, label: 'Basket', badge: cart.length },
          { id: 'profile', icon: UserIcon, label: 'Account' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => navigateTo(tab.id as StudentTab)} 
            className={`flex flex-col items-center p-1.5 relative transition-all ${activeTab === tab.id ? 'text-emerald-600 scale-105' : 'text-gray-300'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[7px] font-black uppercase mt-1 tracking-tighter">{tab.label}</span>
            {tab.badge ? <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white shadow-sm">{tab.badge}</span> : null}
            {activeTab === tab.id && <div className="absolute -bottom-1.5 w-1 h-1 bg-emerald-600 rounded-full" />}
          </button>
        ))}
      </nav>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const PlusIcon = ({className}: {className?: string}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default StudentView;
