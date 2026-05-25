import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Activity, Stethoscope } from 'lucide-react';
import { useToast } from '../components/Toast';

import { loginUser } from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน', 'ต้องใช้ชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(username, password);
      if (res && res.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(res.user));
        toast.success('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับคุณ ${res.user.name}`);
        navigate('/dashboard');
      } else {
        toast.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'กรุณาตรวจสอบข้อมูลอีกครั้ง');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-10">
            {/* Logo & Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-[#0F294D] rounded-3xl flex items-center justify-center shadow-lg mb-6 transform hover:rotate-6 transition-transform duration-300">
                <Activity size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-[#0F294D] tracking-tight mb-2">Cost Estimator</h1>
              <p className="text-slate-500 text-sm font-medium">Bangkok Hospital Siriroj</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username / ชื่อผู้ใช้</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password / รหัสผ่าน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0F294D] text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(15,41,77,0.2)] hover:shadow-[0_15px_30px_rgba(15,41,77,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <Activity className="animate-spin" size={20} />
                ) : (
                  <>
                    Sign In
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Stethoscope size={12} />
                    </div>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
            <p className="text-[0.7rem] text-slate-400 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} BANGKOK HOSPITAL SIRIROJ. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
