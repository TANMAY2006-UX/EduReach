import api from './api';

export const tutorService = {
  getTutors:       (params = {}) => api.get('/tutors', { params }).then(r => r.data),
  getTutorById:    (id)          => api.get(`/tutors/${id}`).then(r => r.data),
  getNearbyTutors: (params = {}) => api.get('/tutors/nearby', { params }).then(r => r.data),
  getMyProfile:    ()            => api.get('/tutors/me/profile').then(r => r.data),
  updateMyProfile: (data)        => api.patch('/tutors/me/profile', data).then(r => r.data),
};

export const sessionService = {
  // Student: request trial or paid session
  requestSession: (data) =>
    api.post('/sessions/request', data).then(r => r.data),

  // Student: get all my sessions
  getStudentSessions: (status) =>
    api.get('/sessions/student', { params: status ? { status } : {} }).then(r => r.data),

  // Tutor: get all my sessions
  getTutorSessions: (status) =>
    api.get('/sessions/tutor', { params: status ? { status } : {} }).then(r => r.data),

  // Tutor: accept or reject a request
  respondToSession: (id, action) =>
    api.patch(`/sessions/${id}/respond`, { action }).then(r => r.data),

  // Tutor: add/update meeting link
  updateMeetingLink: (id, meetingLink) =>
    api.patch(`/sessions/${id}/link`, { meetingLink }).then(r => r.data),

  // Tutor: reschedule an accepted session
  rescheduleSession: (id, newScheduledAt, note = '') =>
    api.patch(`/sessions/${id}/reschedule`, { newScheduledAt, note }).then(r => r.data),

  // Both: join class (records timestamp, returns meeting link)
  joinSession: (id) =>
    api.post(`/sessions/${id}/join`).then(r => r.data),

  // Tutor: mark as completed
  completeSession: (id, tutorNotes = '') =>
    api.patch(`/sessions/${id}/complete`, { tutorNotes }).then(r => r.data),

  // Student: review — public + optional private feedback
  reviewSession: (id, rating, comment = '', privateFeedback = '') =>
    api.post(`/sessions/${id}/review`, { rating, comment, privateFeedback }).then(r => r.data),

  // Both: cancel
  cancelSession: (id, reason = '') =>
    api.patch(`/sessions/${id}/cancel`, { reason }).then(r => r.data),
};

export const ngoService = {
  // Create a new beneficiary student under this NGO
  createBeneficiary: (data) =>
    api.post('/ngo/beneficiary', data).then(r => r.data),

  // List all beneficiaries — paginated, searchable
  // params: { page, limit, search, subject }
  getBeneficiaries: (params = {}) =>
    api.get('/ngo/beneficiaries', { params }).then(r => r.data),

  // KPI stats for dashboard header
  getStats: () =>
    api.get('/ngo/stats').then(r => r.data),

  // Session feed across cohort
  // params: { filter: 'upcoming'|'past'|'all', page, limit, student }
  getSessions: (params = {}) =>
    api.get('/ngo/sessions', { params }).then(r => r.data),

  // Trigger CSV download — returns a Blob URL the browser downloads
  exportCsv: () =>
    api.get('/ngo/export', { responseType: 'blob' }).then(r => {
      const url  = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `EduReach_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }),

  // ── Empanelment ───────────────────────────────────────────────────────────

  // GET  /api/ngo/empanelled-tutors — all active tutors in NGO's pool
  getEmpanelledTutors: (params = {}) =>
    api.get('/ngo/empanelled-tutors', { params }).then(r => r.data),

  // POST /api/ngo/empanel/:tutorProfileId — add tutor to pool
  empanelTutor: (tutorProfileId) =>
    api.post(`/ngo/empanel/${tutorProfileId}`).then(r => r.data),

  // DELETE /api/ngo/empanel/:tutorProfileId — soft-remove from pool
  removeEmpanelment: (tutorProfileId) =>
    api.delete(`/ngo/empanel/${tutorProfileId}`).then(r => r.data),

  // ── Legacy: NGO-initiated booking (kept, not used in new flow) ────────────

  bookSession: (data) =>
    api.post('/ngo/book-session', data).then(r => r.data),

  // ── Legacy: Feedback / evaluation ─────────────────────────────────────────

  addFeedback: (sessionId, rating, comment = '') =>
    api.patch(`/ngo/sessions/${sessionId}/feedback`, { rating, comment }).then(r => r.data),

  // ── Collaboration system ──────────────────────────────────────────────────

  // POST /api/ngo/collab-request
  // body: { tutorProfileId, subjects[], targetGrade, frequency?, studentCount?, message? }
  sendCollabRequest: (data) =>
    api.post('/ngo/collab-request', data).then(r => r.data),

  // GET /api/ngo/collab-requests?status=pending|accepted|declined|cancelled|all
  getCollabRequests: (status = 'all') =>
    api.get('/ngo/collab-requests', { params: { status } }).then(r => r.data),

  // DELETE /api/ngo/collab-request/:id
  cancelCollabRequest: (requestId) =>
    api.delete(`/ngo/collab-request/${requestId}`).then(r => r.data),

  // POST /api/ngo/assignment
  // body: { collabRequestId, grade, subjects[], studentCount?, notes? }
  createAssignment: (data) =>
    api.post('/ngo/assignment', data).then(r => r.data),

  // GET /api/ngo/assignments?status=active|ended|all
  getAssignments: (status = 'active') =>
    api.get('/ngo/assignments', { params: { status } }).then(r => r.data),

  // PATCH /api/ngo/assignment/:id/end  — body: { reason? }
  endAssignment: (assignmentId, reason = '') =>
    api.patch(`/ngo/assignment/${assignmentId}/end`, { reason }).then(r => r.data),
};

// ── Tutor-side: NGO collaboration ─────────────────────────────────────────────
// Used by TutorDashboard to manage incoming NGO requests and active assignments.

export const tutorNgoService = {
  // GET /api/tutors/ngo-requests?status=pending|accepted|declined|all
  getNgoRequests: (status = 'all') =>
    api.get('/tutors/ngo-requests', { params: { status } }).then(r => r.data),

  // PATCH /api/tutors/ngo-requests/:id/respond
  // body: { action: 'accept'|'decline', note?: string }
  respondToRequest: (requestId, action, note = '') =>
    api.patch(`/tutors/ngo-requests/${requestId}/respond`, { action, note }).then(r => r.data),

  // GET /api/tutors/assignments — active group assignments for this tutor
  getAssignments: () =>
    api.get('/tutors/assignments').then(r => r.data),
};