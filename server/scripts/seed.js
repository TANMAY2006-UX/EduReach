/**
 * EduReach Seed Script
 * Run: node server/scripts/seed.js
 * Seeds 10 realistic Mumbai tutor profiles into MongoDB.
 * Run ONCE after setting up your DB — safe to re-run (clears existing tutors first).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../server/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const TutorProfile = require('../models/TutorProfile.model');

const AREA_COORDS = {
    'Andheri West': [72.8394, 19.1196],
    'Bandra West': [72.8362, 19.0607],
    'Borivali': [72.8561, 19.2307],
    'Powai': [72.9051, 19.1197],
    'Dadar': [72.8431, 19.0178],
    'Mulund': [72.9561, 19.1724],
    'Goregaon': [72.8490, 19.1663],
    'Chembur': [72.8994, 19.0620],
    'Santacruz': [72.8397, 19.0806],
    'Malad': [72.8484, 19.1872],
};

const TUTORS = [
    {
        name: 'Priya Sharma', email: 'priya.sharma@edureach.test',
        area: 'Andheri West', subjects: ['Mathematics', 'Physics'],
        grade: 'Class 8–12', experience: '5–10 years',
        qualification: 'B.Tech, IIT Bombay',
        bio: 'IIT-B graduate with 7 years of experience helping students crack JEE and board exams. I focus on building deep conceptual understanding rather than rote memorisation. My students consistently score 90%+ in boards.',
        hourlyRate: 800, rating: 4.9, totalReviews: 47, isVerified: true,
        availability: [
            { day: 'Mon', start: '16:00', end: '20:00' },
            { day: 'Wed', start: '16:00', end: '20:00' },
            { day: 'Sat', start: '09:00', end: '17:00' },
        ],
    },
    {
        name: 'Rahul Desai', email: 'rahul.desai@edureach.test',
        area: 'Bandra West', subjects: ['Chemistry', 'Biology'],
        grade: 'Class 11–12', experience: '3–5 years',
        qualification: 'MBBS, Grant Medical College',
        bio: 'Practising doctor who loves teaching. Specialise in NEET preparation with a focus on conceptual clarity and exam strategy. 85% of my students clear NEET in the first attempt.',
        hourlyRate: 1000, rating: 4.7, totalReviews: 28, isVerified: true,
        availability: [
            { day: 'Tue', start: '18:00', end: '21:00' },
            { day: 'Thu', start: '18:00', end: '21:00' },
            { day: 'Sun', start: '10:00', end: '14:00' },
        ],
    },
    {
        name: 'Sneha Patel', email: 'sneha.patel@edureach.test',
        area: 'Borivali', subjects: ['English', 'Hindi'],
        grade: 'Class 5–10', experience: '1–2 years',
        qualification: 'MA English, Mumbai University',
        bio: 'Passionate language teacher who believes every student can write and speak confidently. Strong focus on grammar, creative writing, and reading comprehension. Patient and encouraging teaching style.',
        hourlyRate: 500, rating: 4.8, totalReviews: 19, isVerified: true,
        availability: [
            { day: 'Mon', start: '15:00', end: '19:00' },
            { day: 'Tue', start: '15:00', end: '19:00' },
            { day: 'Fri', start: '15:00', end: '19:00' },
        ],
    },
    {
        name: 'Arjun Mehta', email: 'arjun.mehta@edureach.test',
        area: 'Powai', subjects: ['Computer Science', 'Mathematics'],
        grade: 'Undergraduate', experience: '3–5 years',
        qualification: 'B.Tech CSE, VJTI Mumbai',
        bio: 'Software engineer at a tech startup by day, passionate tutor by evening. I teach Python, DSA, web development, and school-level mathematics with a project-based approach that makes concepts stick.',
        hourlyRate: 700, rating: 4.6, totalReviews: 33, isVerified: true,
        availability: [
            { day: 'Mon', start: '19:00', end: '22:00' },
            { day: 'Wed', start: '19:00', end: '22:00' },
            { day: 'Sat', start: '11:00', end: '15:00' },
        ],
    },
    {
        name: 'Kavitha Rao', email: 'kavitha.rao@edureach.test',
        area: 'Dadar', subjects: ['Social Studies', 'History & Geography'],
        grade: 'Class 5–10', experience: '5–10 years',
        qualification: 'M.Ed, Tata Institute of Social Sciences',
        bio: '8 years of experience making Social Sciences come alive with storytelling, maps, and real-world examples. My students stop dreading SST and start actually enjoying it. SSC and ICSE specialist.',
        hourlyRate: 600, rating: 4.9, totalReviews: 52, isVerified: true,
        availability: [
            { day: 'Tue', start: '16:00', end: '19:00' },
            { day: 'Thu', start: '16:00', end: '19:00' },
            { day: 'Sat', start: '09:00', end: '13:00' },
        ],
    },
    {
        name: 'Nikhil Joshi', email: 'nikhil.joshi@edureach.test',
        area: 'Mulund', subjects: ['Mathematics', 'Accountancy'],
        grade: 'Class 11–12', experience: '3–5 years',
        qualification: 'CA Final (pursuing), B.Com Mumbai University',
        bio: 'Commerce stream specialist with deep grip on Accountancy, Business Studies, and Maths. CA Final student — I know exactly what level of thinking board exams expect and train students accordingly.',
        hourlyRate: 550, rating: 4.5, totalReviews: 21, isVerified: false,
        availability: [
            { day: 'Mon', start: '17:00', end: '21:00' },
            { day: 'Fri', start: '17:00', end: '21:00' },
            { day: 'Sun', start: '09:00', end: '13:00' },
        ],
    },
    {
        name: 'Dr. Anita Kulkarni', email: 'anita.kulkarni@edureach.test',
        area: 'Goregaon', subjects: ['Mathematics', 'Physics', 'Chemistry'],
        grade: 'Class 8–12', experience: 'More than 10 years',
        qualification: 'PhD Mathematics, IIT Bombay',
        bio: 'With a PhD from IIT Bombay and 12+ years of teaching, I specialise in building mathematical intuition from the ground up. Former IIT-B faculty. Strong track record with JEE Advanced students.',
        hourlyRate: 1500, rating: 5.0, totalReviews: 89, isVerified: true,
        availability: [
            { day: 'Mon', start: '07:00', end: '09:00' },
            { day: 'Wed', start: '07:00', end: '09:00' },
            { day: 'Sat', start: '07:00', end: '13:00' },
        ],
    },
    {
        name: 'Rohan Verma', email: 'rohan.verma@edureach.test',
        area: 'Chembur', subjects: ['Mathematics', 'Economics'],
        grade: 'Class 11–12', experience: '1–2 years',
        qualification: 'MBA Finance, NMIMS',
        bio: 'Recent MBA graduate passionate about making Economics intuitive. I connect textbook concepts to real-world examples — GDP, inflation, budget deficits all become obvious. Great for HSC Economics.',
        hourlyRate: 450, rating: 4.3, totalReviews: 11, isVerified: false,
        availability: [
            { day: 'Tue', start: '19:00', end: '22:00' },
            { day: 'Thu', start: '19:00', end: '22:00' },
            { day: 'Sun', start: '10:00', end: '14:00' },
        ],
    },
    {
        name: 'Meera Iyer', email: 'meera.iyer@edureach.test',
        area: 'Santacruz', subjects: ['Biology', 'Chemistry'],
        grade: 'Class 9–12', experience: '3–5 years',
        qualification: 'MSc Biochemistry, Bombay University',
        bio: 'Biochemistry postgraduate with 4 years of tutoring experience. I make Biology diagrams and Organic Chemistry mechanisms feel logical, not random. Strong NEET focus with HSC board expertise.',
        hourlyRate: 650, rating: 4.7, totalReviews: 24, isVerified: true,
        availability: [
            { day: 'Mon', start: '16:00', end: '20:00' },
            { day: 'Wed', start: '16:00', end: '20:00' },
            { day: 'Fri', start: '16:00', end: '20:00' },
        ],
    },
    {
        name: 'Sameer Khan', email: 'sameer.khan@edureach.test',
        area: 'Malad', subjects: ['English', 'Social Studies', 'Hindi'],
        grade: 'Class 1 – 4  (Primary)', experience: '3–5 years',
        qualification: 'B.Ed, SNDT University',
        bio: 'Primary school specialist with a B.Ed degree. I make learning fun for young children through stories, games, and activities. Experienced in Montessori-inspired methods. Hindi and English both.',
        hourlyRate: 400, rating: 4.6, totalReviews: 31, isVerified: true,
        availability: [
            { day: 'Mon', start: '14:00', end: '18:00' },
            { day: 'Tue', start: '14:00', end: '18:00' },
            { day: 'Thu', start: '14:00', end: '18:00' },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Clear existing test tutor data only
        const testEmails = TUTORS.map(t => t.email);
        const existingUsers = await User.find({ email: { $in: testEmails } });
        const existingIds = existingUsers.map(u => u._id);

        await TutorProfile.deleteMany({ user: { $in: existingIds } });
        await User.deleteMany({ email: { $in: testEmails } });
        console.log('🧹 Cleared existing test tutors');

        const password = 'Test@1234';

        for (const t of TUTORS) {
            // Create User
            const user = await User.create({
                name: t.name,
                email: t.email,
                password,
                authProvider: 'local',
                role: 'tutor',
                isProfileComplete: true,
                isVerified: t.isVerified,
                phone: '9876543210',
                subjects: t.subjects,
                grade: t.grade,
                experience: t.experience,
                qualification: t.qualification,
                bio: t.bio,
                location: { city: 'Mumbai', area: t.area },
            });

            // Create TutorProfile
            const coords = AREA_COORDS[t.area] || [72.8777, 19.0760];
            await TutorProfile.create({
                user: user._id,
                name: t.name,
                bio: t.bio,
                qualification: t.qualification,
                experience: t.experience,
                subjects: t.subjects,
                grade: t.grade,
                city: 'Mumbai',
                area: t.area,
                geoLocation: { type: 'Point', coordinates: coords },
                hourlyRate: t.hourlyRate,
                trialFree: true,
                online: true,
                offline: true,
                isVerified: t.isVerified,
                isActive: true,
                rating: t.rating,
                totalReviews: t.totalReviews,
                availability: t.availability,
            });

            console.log(`   ✓ ${t.name} (${t.area})`);
        }

        console.log(`\n🎉 Seeded ${TUTORS.length} tutors successfully!`);
        console.log('   Test login: any email above, password: Test@1234');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();