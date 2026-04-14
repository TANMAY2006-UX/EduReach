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