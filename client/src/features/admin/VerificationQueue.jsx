import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Search, Filter, Eye, CheckCircle, XCircle, FileText, AlertCircle, ExternalLink, Shield } from 'lucide-react';

export default function VerificationQueue() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');

  const [selectedUser, setSelectedUser] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = () => {
    setLoading(true);
    adminService.getVerifications(filterStatus)
      .then(res => setUsers(res.users))
      .catch(err => setError('Failed to load verifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [filterStatus]);

  const filteredUsers = users.filter(u => filterRole === 'all' || u.role === filterRole);

  const handleAction = async (action) => {
    if (action === 'reject' && !actionNote.trim()) {
      alert('Please provide a rejection note.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.verifyUser(selectedUser._id, action, actionNote);
      setSelectedUser(null);
      setActionNote('');
      fetchVerifications(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const renderDocumentLink = (label, url) => {
    if (!url) return null;
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200 rounded-xl mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="font-bold text-gray-700">{label}</span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1"
        >
          View <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Verification Queue</h1>
        
        <div className="flex items-center gap-3">
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="tutor">Tutors</option>
            <option value="student">Students</option>
            <option value="ngo">NGOs</option>
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />{error}
        </div>
      )}

      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-[4px_4px_0px_0px_#D1D5DB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="p-4 font-black text-gray-500 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-black text-gray-500 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-black text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-black text-gray-500 text-xs uppercase tracking-wider">Date</th>
                <th className="p-4 font-black text-gray-500 text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center font-bold text-gray-400">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs font-medium text-gray-500">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-gray-100 text-gray-800 border-2 border-gray-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 ${
                        user.verificationStatus === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                        user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-blue-400 transition-colors shadow-[2px_2px_0px_0px_#D1D5DB]"
                      >
                        <Eye className="w-4 h-4" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL ────────────────────────────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white border-2 border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="p-6 border-b-2 border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-gray-900">Review Documents</h2>
                <p className="text-sm font-bold text-gray-500 mt-1">{selectedUser.name} • <span className="capitalize">{selectedUser.role}</span></p>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setActionNote(''); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Submitted Documents</h3>
                {renderDocumentLink('School ID', selectedUser.documents?.schoolId)}
                {renderDocumentLink('Degree / Certificate', selectedUser.documents?.degree)}
                {renderDocumentLink('NGO Registration', selectedUser.documents?.registrationProof)}
                
                {/* Aadhaar (Highly sensitive, admin only) */}
                {selectedUser.documents?.aadhaar && (
                  <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-xl mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-500" />
                      <span className="font-bold text-red-800">Aadhaar Card (Sensitive)</span>
                    </div>
                    <a 
                      href={selectedUser.documents?.aadhaar} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-700 hover:text-red-900 font-bold text-sm flex items-center gap-1"
                    >
                      View <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Certifications Array */}
                {selectedUser.documents?.certifications?.map((url, i) => 
                  renderDocumentLink(`Certification ${i + 1}`, url)
                )}
              </div>

              {selectedUser.verificationStatus !== 'approved' && (
                <div className="border-t-2 border-gray-100 pt-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Admin Action</h3>
                  
                  <textarea 
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="Add a note (required for rejection, optional for approval)..."
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:border-blue-500 mb-4 min-h-[100px] resize-none"
                  />

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl border-2 border-green-700 shadow-[3px_3px_0px_0px_#166534] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl border-2 border-red-700 shadow-[3px_3px_0px_0px_#991B1B] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
