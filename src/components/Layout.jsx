import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator,
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  Globe
} from 'lucide-react';
import { useToast } from './Toast';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { "name": "Guest", "avatar": "G", "role": "none" };
  const isAdmin = user.role === 'admin';

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/estimator', icon: <Calculator size={20} />, label: 'Cost Estimator' },
    { path: '/patients', icon: <Users size={20} />, label: 'Patient Records' },
    ...(isAdmin ? [{ path: '/drug-prices', icon: <DollarSign size={20} />, label: 'Drug Prices' }] : []),
  ];

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    toast.success('ออกจากระบบสำเร็จ', 'แล้วพบกันใหม่ครับ');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard / ภาพรวม';
    if (location.pathname === '/' || location.pathname === '/estimator') return 'Cost Estimator / ประเมินราคา';
    if (location.pathname === '/add-item') return 'Add New Item / เพิ่มรายการใหม่';
    if (location.pathname === '/patients') return 'Patient Records / ทะเบียนผู้ป่วย';
    if (location.pathname === '/drug-prices') return 'Drug Prices / ราคายา';
    return '';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-[260px] bg-[#0F294D] text-white flex flex-col">
        <div className="p-6 flex flex-col items-center gap-4 bg-white/5">
          <img src="/logo.png" alt="Bangkok Hospital Siriroj" className="w-[85%] max-w-[180px] brightness-0 invert" />
          <div className="text-sm font-black text-blue-100/60 text-center tracking-widest border-t border-white/10 pt-4 w-full uppercase">
            Cost Estimation
          </div>
        </div>
        <nav className="p-4 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl mb-2 font-bold transition-all ${isActive(item.path) ? 'bg-white text-[#0F294D] shadow-lg shadow-black/20' : 'text-blue-100/60 hover:bg-white/10 hover:text-white'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/10">
          {isAdmin && (
            <button className="w-full flex items-center gap-3 py-3 px-4 text-blue-100/60 rounded-xl mb-2 font-bold transition-all hover:bg-white/10 hover:text-white">
              <Settings size={20} />
              Settings
            </button>
          )}
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 py-3 px-4 text-red-400 rounded-xl font-bold transition-all hover:bg-red-500 hover:text-white">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[70px] bg-white border-b border-slate-200 flex justify-between items-center px-8 shadow-sm z-10">
          <div className="text-lg font-black text-[#0F294D] tracking-tight">{getPageTitle()}</div>
          <div className="flex items-center gap-6 text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors uppercase tracking-widest">
              <Globe size={14} /> TH | EN
            </span>
            <Bell size={20} className="cursor-pointer hover:text-slate-900 transition-colors" />
            <div className="flex items-center gap-3 ml-4 bg-slate-50 py-1.5 pl-1.5 pr-4 rounded-full border border-slate-100 group relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-100">
                {user.avatar}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 leading-none">{user.name}</span>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-tighter">{user.role}</span>
              </div>

              {/* Quick Switch Dropdown for Testing */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                <div className="text-[0.6rem] font-black text-slate-400 px-3 py-1 uppercase tracking-widest border-b border-slate-50 mb-1">Quick Switch (Test)</div>
                {[
                  { id: 'admin', name: 'Admin User', role: 'admin', avatar: 'A', color: 'bg-indigo-600' },
                  { id: 'pharma', name: 'เภสัชกร (Pharmacist)', role: 'pharma', avatar: 'P', color: 'bg-blue-500' },
                  { id: 'nurse', name: 'พยาบาล (Nurse)', role: 'nurse', avatar: 'N', color: 'bg-rose-500' }
                ].map(acc => (
                  <button 
                    key={acc.id}
                    onClick={() => {
                      localStorage.setItem('isAuthenticated', 'true');
                      localStorage.setItem('user', JSON.stringify(acc));
                      toast.success(`สลับบัญชีเป็น ${acc.name}`);
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-6 h-6 rounded-full ${acc.color} text-white flex items-center justify-center text-[0.6rem] font-black`}>{acc.avatar}</div>
                    <div className="flex flex-col">
                      <span className="text-[0.7rem] font-bold text-slate-800">{acc.id.toUpperCase()}</span>
                      <span className="text-[0.55rem] text-slate-400 leading-none">{acc.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
