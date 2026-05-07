import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  
  getVerifications: (status = 'pending') => 
    api.get(`/admin/verifications?status=${status}`).then(r => r.data),
    
  verifyUser: (userId, action, note = '') =>
    api.patch(`/admin/verify/${userId}`, { action, note }).then(r => r.data),
};
