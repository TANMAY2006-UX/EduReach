import { useState, useEffect, useCallback } from 'react';
import { tutorService } from '../services/tutorService';

/**
 * useTutors — fetches paginated tutor list.
 * Refetches automatically whenever filters change.
 */
export function useTutors(filters = {}) {
  const [tutors,     setTutors]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tutorService.getTutors(filters);
      setTutors(data.tutors || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tutors');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tutors, pagination, loading, error, refetch: fetch };
}

/**
 * useTutorProfile — fetches a single tutor's profile.
 */
export function useTutorProfile(id) {
  const [tutor,   setTutor]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tutorService.getTutorById(id)
      .then(data => setTutor(data.tutor))
      .catch(err => setError(err.response?.data?.message || 'Tutor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  return { tutor, loading, error };
}