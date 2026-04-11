import api from './api';

export const tutorService = {
  // Fetch paginated tutor list with filters
  getTutors: (params = {}) =>
    api.get('/tutors', { params }).then(r => r.data),

  // Fetch single tutor profile
  getTutorById: (id) =>
    api.get(`/tutors/${id}`).then(r => r.data),

  // Fetch nearby tutors (requires lat/lng)
  getNearbyTutors: (params = {}) =>
    api.get('/tutors/nearby', { params }).then(r => r.data),

  // Tutor-only: get own profile
  getMyProfile: () =>
    api.get('/tutors/me/profile').then(r => r.data),

  // Tutor-only: update own profile
  updateMyProfile: (data) =>
    api.patch('/tutors/me/profile', data).then(r => r.data),
};

export const sessionService = {
  // Student: request a trial session
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

  // Tutor: mark as completed
  completeSession: (id, tutorNotes = '') =>
    api.patch(`/sessions/${id}/complete`, { tutorNotes }).then(r => r.data),

  // Student: review a completed session
  reviewSession: (id, rating, comment = '') =>
    api.post(`/sessions/${id}/review`, { rating, comment }).then(r => r.data),

  // Either: cancel
  cancelSession: (id, reason = '') =>
    api.patch(`/sessions/${id}/cancel`, { reason }).then(r => r.data),
};