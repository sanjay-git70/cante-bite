
import React, { useMemo } from 'react';
import { Order } from '../types';
// Fixed: Added missing Banknote import from lucide-react
import { 
  Plus, Receipt, Smartphone, Clock, 
  IndianRupee, Package, Wallet, 
  TrendingUp, AlertCircle, CheckCircle2,
  Banknote
} from 'lucide-react';

interface SummaryDashboardProps {
  orders: Order[];
  onNewWalkIn: () => void;
}

const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ orders, onNewWalkIn }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = useMemo(() => orders.filter(o => o.created_at.startsWith(today)), [orders, today]);

  const metrics = useMemo(() => {
    let onlineSales = 0;
    let offlineSales = 0;
    let onlineCount = 0;
    let offlineCount = 0;
    let toCollectOnline = 0;
    let prePaidOnline = 0;
    let cashCollected = 0;

    todayOrders.forEach(o => {
      const isOnline = o.order_type === 'online';
      const total = Number(o.total_amount);
      const paid = Number(o.paid_amount);

      if (isOnline) {
        onlineSales += total;
        onlineCount++;
        toCollectOnline += (total - paid);
        prePaidOnline += paid;
      } else {
        offlineSales += total;
        offlineCount++;
        cashCollected += paid; // Counter orders are usually fully paid in this app logic
      }
    });

    return {
      totalSales: onlineSales + offlineSales,
      onlineSales,
      offlineSales,
      totalCount: onlineCount + offlineCount,
      onlineCount,
      offlineCount,
      toCollectOnline,
      prePaidOnline,
      cashCollected,
      totalOnHand: prePaidOnline + cashCollected
    };
  }, [todayOrders]);

  const recentActivity = useMemo(() => orders.slice(0, 8), [orders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Sales (Today)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-300">₹</span>
            <span className="text-4xl font-black text-gray-950 tracking-tighter">{metrics.totalSales.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex gap-4 text-[9px] font-black uppercase tracking-widest border-t border-gray-50 pt-4">
            <div className="flex flex-col">
              <span className="text-blue-500">Online</span>
              <span className="text-gray-900">₹{metrics.onlineSales}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-emerald-500">Offline</span>
              <span className="text-gray-900">₹{metrics.offlineSales}</span>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-blue-600">Total Orders</p>
          <div className="flex items-baseline gap-2">
            <Package className="w-5 h-5 text-gray-200" />
            <span className="text-4xl font-black text-gray-950 tracking-tighter">{metrics.totalCount}</span>
          </div>
          <div className="mt-4 flex gap-4 text-[9px] font-black uppercase tracking-widest border-t border-gray-50 pt-4">
            <div className="flex flex-col">
              <span className="text-gray-400">Mobile App</span>
              <span className="text-gray-900">{metrics.onlineCount}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-4">
              <span className="text-gray-400">Counter</span>
              <span className="text-gray-900">{metrics.offlineCount}</span>
            </div>
          </div>
        </div>

        {/* To Collect Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-orange-200 transition-all">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> To Collect
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-300">₹</span>
            <span className="text-4xl font-black text-gray-950 tracking-tighter">{metrics.toCollectOnline.toLocaleString()}</span>
          </div>
          <p className="mt-4 text-[9px] font-black text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-4">
            Pending Online Balances
          </p>
        </div>

        {/* New Walk-in Quick Action */}
        <button 
          onClick={onNewWalkIn}
          className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 flex flex-col items-center justify-center gap-3 hover:bg-emerald-700 active:scale-[0.98] transition-all group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">New Walk-in Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 leading-tight">Recent Activity</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Live transaction feed</p>
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500 opacity-20" />
          </div>

          <div className="space-y-4 flex-1">
            {recentActivity.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${o.order_type === 'walk-in' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {o.order_type === 'walk-in' ? <Receipt className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 text-sm">
                        {o.order_type === 'walk-in' ? 'Walk-in Guest' : (o.student_details?.full_name || 'Anonymous Student')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{o.order_status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-lg tracking-tight">₹{o.total_amount}</p>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Paid: ₹{o.paid_amount}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                  <Clock className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No transaction history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout Settlement Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-gray-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col h-full border border-white/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">Wallet Settlement</h3>
                <Wallet className="w-5 h-5 text-gray-700" />
              </div>
              
              <div className="space-y-8 flex-1">
                <div className="flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pre-paid (Online)</p>
                    <p className="text-2xl font-black text-white">₹{metrics.prePaidOnline.toLocaleString()}</p>
                  </div>
                  <Smartphone className="w-5 h-5 text-blue-500/40" />
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cash Collected</p>
                    <p className="text-2xl font-black text-white">₹{metrics.cashCollected.toLocaleString()}</p>
                  </div>
                  <Banknote className="w-5 h-5 text-emerald-500/40" />
                </div>

                <div className="mt-auto pt-10 flex flex-col justify-end">
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Ready for Payout</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Total On-Hand Today</p>
                      <p className="text-5xl font-black tracking-tighter">₹{metrics.totalOnHand.toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Growth Insight Card */}
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Performance Insight</p>
              <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                Sales are <span className="font-black">12% higher</span> than yesterday. Lunch peak starts in <span className="font-black">20 mins</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
