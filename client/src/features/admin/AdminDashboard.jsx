import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Users, UserCheck, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getStats()
      .then(res => setStats(res.stats))
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</div>;

  return (
    <div className="animate-fade-up">
      <h1 className="text-[28px] font-black text-gray-900 tracking-tight mb-8">Platform Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#D1D5DB] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_#D1D5DB] transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">Total Users</p>
          <h2 className="text-4xl font-black text-gray-900 mt-1">{stats?.totalUsers || 0}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-amber-200 shadow-[4px_4px_0px_0px_#FDE68A] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_#FDE68A] transition-all">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-amber-800 font-bold text-sm uppercase tracking-wider">Pending Verifications</p>
          <h2 className="text-4xl font-black text-amber-900 mt-1">{stats?.pendingVerifications || 0}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-[4px_4px_0px_0px_#A7F3D0] hover:-translate-y-1 hover:shadow-[4px_6px_0px_0px_#A7F3D0] transition-all">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-800 font-bold text-sm uppercase tracking-wider">Verified Users</p>
          <h2 className="text-4xl font-black text-green-900 mt-1">{stats?.verifiedUsers || 0}</h2>
        </div>
      </div>
    </div>
  );
}
