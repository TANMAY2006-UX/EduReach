const TutorProfile = require('../models/TutorProfile.model');
const User         = require('../models/User.model');

const AREA_COORDS = {
  'Andheri East':        [72.8697, 19.1136],
  'Andheri West':        [72.8394, 19.1196],
  'Bandra East':         [72.8544, 19.0596],
  'Bandra West':         [72.8362, 19.0607],
  'Borivali':            [72.8561, 19.2307],
  'Chembur':             [72.8994, 19.0620],
  'Colaba':              [72.8147, 18.9068],
  'Dadar':               [72.8431, 19.0178],
  'Dharavi':             [72.8534, 19.0414],
  'Ghatkopar':           [72.9081, 19.0859],
  'Goregaon':            [72.8490, 19.1663],
  'Juhu':                [72.8272, 19.1052],
  'Kandivali':           [72.8477, 19.2044],
  'Kurla':               [72.8794, 19.0726],
  'Malad':               [72.8484, 19.1872],
  'Mulund':              [72.9561, 19.1724],
  'Powai':               [72.9051, 19.1197],
  'Santacruz':           [72.8397, 19.0806],
  'Thane':               [72.9780, 19.2183],
  'Vashi (Navi Mumbai)': [73.0069, 19.0771],
  'Vikhroli':            [72.9227, 19.1080],
  'Worli':               [72.8175, 19.0132],
  'Mumbai':              [72.8777, 19.0760],
};

const getCoords = (area, city) => AREA_COORDS[area] || AREA_COORDS[city] || [72.8777, 19.0760];

// GET /api/tutors
exports.getTutors = async (req, res) => {
  try {
    const { search = '', subject = '', area = '', sort = 'rating', page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (subject) query.subjects = { $in: [new RegExp(subject, 'i')] };
    if (area)    query.area     = new RegExp(area, 'i');

    let results;
    if (search.trim()) {
      results = await TutorProfile.find(
        { ...query, $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-reviews -verificationDocs -__v')
        .lean();
    } else {
      const sortMap = {
        rating:  { rating: -1, totalReviews: -1 },
        newest:  { createdAt: -1 },
        reviews: { totalReviews: -1 },
      };
      results = await TutorProfile.find(query)
        .sort(sortMap[sort] || sortMap.rating)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-reviews -verificationDocs -__v')
        .lean();
    }

    const total = await TutorProfile.countDocuments(query);
    res.json({ success: true, tutors: results, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[TUTOR] getTutors error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch tutors' });
  }
};

// GET /api/tutors/nearby
exports.getNearbyTutors = async (req, res) => {
  try {
    const { lat = 19.0760, lng = 72.8777, radius = 15000, subject = '', limit = 8 } = req.query;
    const geoQuery = {
      isActive: true,
      geoLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    };
    if (subject) geoQuery.subjects = { $in: [new RegExp(subject, 'i')] };

    const tutors = await TutorProfile.find(geoQuery)
      .limit(Number(limit))
      .select('name avatar bio subjects area city rating totalReviews trialFree isVerified hourlyRate experience')
      .lean();

    res.json({ success: true, tutors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tutors/:id  — full profile including reviews
exports.getTutorById = async (req, res) => {
  try {
    const tutor = await TutorProfile.findById(req.params.id)
      .select('-verificationDocs -__v')
      .lean();

    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' });

    if (tutor.reviews) {
      tutor.reviews = tutor.reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
    }

    res.json({ success: true, tutor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tutors/me/profile
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await TutorProfile.findOne({ user: req.user._id }).lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Tutor profile not found. Please complete onboarding.' });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tutors/me/profile  — FIX: now includes availability
exports.updateMyProfile = async (req, res) => {
  try {
    // Whitelist exactly what tutors can update from the dashboard
    const allowed = ['bio', 'subjects', 'availability', 'hourlyRate', 'online', 'offline', 'languages'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    // Validate availability slots if provided
    if (updates.availability) {
      const VALID_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

      const valid = updates.availability.every(slot =>
        VALID_DAYS.includes(slot.day) &&
        timeRe.test(slot.start) &&
        timeRe.test(slot.end) &&
        slot.start < slot.end
      );
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Invalid availability slots. Check day names and time format (HH:MM).' });
      }
    }

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Internal: auto-create TutorProfile on onboarding
exports.createTutorProfile = async (userId, userData) => {
  try {
    const exists = await TutorProfile.findOne({ user: userId });
    if (exists) return exists;

    const coords = getCoords(userData.area, userData.city);
    const profile = await TutorProfile.create({
      user:          userId,
      name:          userData.name,
      avatar:        userData.avatar || null,
      bio:           userData.bio           || '',
      qualification: userData.qualification || '',
      experience:    userData.experience    || '',
      subjects:      userData.subjects      || [],
      grade:         userData.grade         || '',
      city:          userData.city          || 'Mumbai',
      area:          userData.area          || '',
      geoLocation:   { type: 'Point', coordinates: coords },
      hourlyRate:    0,
      trialFree:     true,
      isVerified:    false,
      isActive:      true,
      // New tutors start with 0 stats — no hardcoded fake reviews
      rating:       0,
      totalReviews: 0,
      totalSessions: 0,
      totalStudents: 0,
    });
    console.log(`[TUTOR] Profile created for user ${userId}`);
    return profile;
  } catch (err) {
    console.error('[TUTOR] createTutorProfile error:', err.message);
  }
};