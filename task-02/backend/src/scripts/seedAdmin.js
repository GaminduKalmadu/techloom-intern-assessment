const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const { connectDB } = require('../config/db');

/**
 * Idempotent Admin Seeder
 * Ensures an admin account exists without exposing plain text passwords in the DB
 */
const seedAdmin = async () => {
  try {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      });

      console.log(`[Admin Seeder] Created default ADMIN account: ${adminEmail}`);
    } else {
      // Ensure existing account has ADMIN role
      if (admin.role !== 'ADMIN') {
        admin.role = 'ADMIN';
        await admin.save();
        console.log(`[Admin Seeder] Updated existing user ${adminEmail} to ADMIN role`);
      } else {
        console.log(`[Admin Seeder] Verified existing ADMIN account: ${adminEmail}`);
      }
    }

    return admin;
  } catch (error) {
    console.error('[Admin Seeder Error] Failed to seed admin:', error.message);
    throw error;
  }
};

// If executed directly from command line: node src/scripts/seedAdmin.js
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedAdmin();
      console.log('[Admin Seeder] Seed operation completed.');
      process.exit(0);
    } catch (err) {
      console.error('[Admin Seeder] Fatal error:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedAdmin;
