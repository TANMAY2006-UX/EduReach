/**

* EduReach Production-Grade Seed Script
* Run: node server/scripts/seed.js
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
};

const TUTORS = [
    {
        name: 'Priya Sharma',
        email: 'priya.sharma@edureach.test',
        area: 'Andheri West',
        subjects: ['Mathematics', 'Physics'],
        grade: 'Class 8–12',
        experience: '5–10 years',
        qualification: 'B.Tech, IIT Bombay',
        bio: 'IIT-B graduate helping students crack JEE with conceptual clarity.',
        hourlyRate: 800,
        rating: 4.8,
        totalReviews: 0, // ✅ no fake data
        isVerified: true,
    },
    {
        name: 'Rahul Desai',
        email: 'rahul.desai@edureach.test',
        area: 'Bandra West',
        subjects: ['Chemistry', 'Biology'],
        grade: 'Class 11–12',
        experience: '3–5 years',
        qualification: 'MBBS',
        bio: 'NEET specialist focusing on smart exam strategy.',
        hourlyRate: 1000,
        rating: 4.6,
        totalReviews: 0,
        isVerified: true,
    },
    {
        name: 'Sneha Patel',
        email: 'sneha.patel@edureach.test',
        area: 'Borivali',
        subjects: ['English'],
        grade: 'Class 5–10',
        experience: '1–2 years',
        qualification: 'MA English',
        bio: 'Passionate language teacher focused on confidence building.',
        hourlyRate: 500,
        rating: 4.5,
        totalReviews: 0,
        isVerified: true,
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        await TutorProfile.deleteMany({});
        await User.deleteMany({ role: 'tutor' });

        console.log('🧹 Database cleaned');

        for (const t of TUTORS) {
            // ✅ Create User
            const user = await User.create({
                name: t.name,
                email: t.email,
                password: 'Test@1234',
                role: 'tutor',
                authProvider: 'local',
                isProfileComplete: true,
                isVerified: t.isVerified,
            });

            // ✅ Create TutorProfile (linked properly)
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
                geoLocation: {
                    type: 'Point',
                    coordinates: AREA_COORDS[t.area],
                },
                hourlyRate: t.hourlyRate,
                trialFree: true,
                online: true,
                offline: true,
                isVerified: t.isVerified,
                isActive: true,
                rating: t.rating,
                totalReviews: t.totalReviews,
            });

            console.log(`✓ Seeded: ${t.name}`);
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log('Login: any email | Password: Test@1234');

        process.exit(0);

} catch (err) {
console.error('❌ Seed error:', err);
process.exit(1);
}
}

seed();
