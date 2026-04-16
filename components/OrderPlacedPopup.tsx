
import React, { useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface OrderPlacedPopupProps {
  onClose: () => void;
}

const OrderPlacedPopup: React.FC<OrderPlacedPopupProps> = ({ onClose }) => {
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    // Automatically trigger onClose after 2 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onClose]);

  const onLottieRef = (dotLottie: any) => {
    lottieRef.current = dotLottie;
    if (dotLottie) {
      dotLottie.addEventListener('complete', () => {
        console.log('Animation Finished');
      });
      dotLottie.addEventListener('play', () => {
        console.log('Animation Playing');
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Auto-close Progress Indicator */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
          <div 
            className="h-full bg-emerald-600 transition-all ease-linear"
            style={{ 
              width: '100%',
              animation: 'shrink-progress 2s linear forwards'
            }}
          />
        </div>

        <div className="flex justify-center mt-4">
          <DotLottieReact
            src="https://lottie.host/79185a82-1601-499c-859b-1144214a1c1d/m6Kj7yP0lM.lottie"
            autoplay
            loop={false}
            dotLottieRefCallback={onLottieRef}
            style={{ height: 160 }}
          />
        </div>
        
        <h2 className="mt-4 text-2xl font-black text-gray-950 tracking-tight">Order Placed!</h2>
        <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-[0.2em] leading-relaxed">
          Redirecting to Tickets...
        </p>
        
        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
          Your kitchen token is being generated
        </p>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          View Now
        </button>
      </div>

      <style>{`
        @keyframes shrink-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default OrderPlacedPopup;
