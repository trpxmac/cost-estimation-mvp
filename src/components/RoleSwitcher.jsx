import { Pill, Stethoscope } from 'lucide-react';

export default function RoleSwitcher({ currentRole, isAdmin, userRole, onSwitch }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-2xl shadow-lg">
      <div className="flex bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <button
          onClick={() => onSwitch("pharma")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "pharma" ? "bg-white text-blue-700 shadow-xl" : "text-white/60 hover:bg-white/5"} ${(!isAdmin && userRole === 'nurse') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Pill size={18} /> เภสัชกร
        </button>
        <button
          onClick={() => onSwitch("nurse")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "nurse" ? "bg-white text-indigo-700 shadow-xl" : "text-white/60 hover:bg-white/5"} ${(!isAdmin && userRole === 'pharma') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Stethoscope size={18} /> พยาบาล
        </button>
      </div>
    </div>
  );
}
