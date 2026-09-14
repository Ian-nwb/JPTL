import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/shared/models/user.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jptl';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@jptl.sys';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'admin123';

async function main() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.role = 'superadmin';
    existing.password = SUPERADMIN_PASSWORD; // Pre-save hook hashes this
    await existing.save();
    console.log(`Updated existing user [${SUPERADMIN_EMAIL}] to superadmin with new password.`);
  } else {
    const superadmin = await User.create({
      firstName: 'System',
      lastName: 'Superadmin',
      email: SUPERADMIN_EMAIL.toLowerCase(),
      password: SUPERADMIN_PASSWORD,
      role: 'superadmin',
      onboardingCompleted: true,
      status: 'active',
    });
    console.log(`Superadmin user created successfully: [${superadmin.email}]`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error creating superadmin:', err);
  process.exit(1);
});
