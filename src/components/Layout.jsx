import { Link, Outlet, useLocation } from 'react-router-dom';
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

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/estimator', icon: <Calculator size={20} />, label: 'Cost Estimator' },
    { path: '/patients', icon: <Users size={20} />, label: 'Patient Records' },
    { path: '/drug-prices', icon: <DollarSign size={20} />, label: 'Drug Prices' },
  ];

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
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Bangkok Hospital Siriroj" className="w-[85%] max-w-[180px]" />
          <div className="text-base font-bold text-blue-900 text-center tracking-wide border-t border-dashed border-slate-200 pt-4 w-full">
            Cost Estimation System
          </div>
        </div>
        <nav className="p-4 flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 py-3 px-4 rounded-lg mb-2 font-medium transition-colors relative ${isActive(item.path) ? 'bg-blue-50 text-blue-500 before:absolute before:left-0 before:top-[10%] before:h-[80%] before:w-1 before:bg-blue-500 before:rounded-r' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-900'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <a href="#" className="flex items-center gap-3 py-3 px-4 text-slate-500 rounded-lg mb-2 font-medium transition-colors hover:bg-blue-50 hover:text-blue-900">
            <Settings size={20} />
            Settings
          </a>
          <a href="#" className="flex items-center gap-3 py-3 px-4 text-red-500 rounded-lg font-medium transition-colors hover:bg-red-50">
            <LogOut size={20} />
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[70px] bg-white border-b border-slate-200 flex justify-between items-center px-8">
          <div className="text-lg font-semibold text-slate-900">{getPageTitle()}</div>
          <div className="flex items-center gap-6 text-slate-500">
            <span className="text-sm flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors">
              <Globe size={16} /> TH | EN
            </span>
            <Bell size={20} className="cursor-pointer hover:text-slate-900 transition-colors" />
            <div className="flex items-center gap-2 ml-4 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">
                A
              </div>
              <span className="text-sm font-medium text-slate-900">Admin User</span>
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
