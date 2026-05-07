import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CheckSquare, LogOut, Shield } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 border-2 border-blue-700 flex items-center justify-center shadow-[2px_2px_0px_0px_#93C5FD]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 font-black text-xl tracking-tight">Admin</span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavLink 
            to="/admin/dashboard" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-[2px_2px_0px_0px_#93C5FD]' : 'text-gray-600 hover:bg-gray-50 border-2 border-transparent'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </NavLink>

          <NavLink 
            to="/admin/verifications" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-[2px_2px_0px_0px_#93C5FD]' : 'text-gray-600 hover:bg-gray-50 border-2 border-transparent'}`}
          >
            <CheckSquare className="w-5 h-5" />
            Verifications
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header placeholder if needed */}
        <header className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-black text-lg">Admin</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
