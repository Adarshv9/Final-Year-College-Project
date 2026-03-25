// CLI script to create or promote a local admin account.
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import '../src/config/env.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = value;
    index += 1;
  }

  return options;
};

const printUsage = () => {
  console.log('Usage: npm run create:admin -- --name "Admin User" --email "admin@example.com" --password "StrongPass123"');
};

const normalizeString = (value) => String(value || '').trim();

const main = async () => {
  const options = parseArgs();
  const name = normalizeString(options.name);
  const email = normalizeString(options.email).toLowerCase();
  const password = String(options.password || '');

  if (!name || !email || !password) {
    printUsage();
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email }).select('+password');

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.provider = 'local';
      existingUser.role = 'admin';
      existingUser.emailVerified = true;
      existingUser.isVerified = true;
      existingUser.isActive = true;
      existingUser.approvalStatus = null;
      existingUser.otp = undefined;
      existingUser.otpExpiresAt = undefined;
      await existingUser.save();

      console.log(`Updated existing user ${email} to admin.`);
    } else {
      await User.create({
        name,
        email,
        password,
        provider: 'local',
        role: 'admin',
        emailVerified: true,
        isVerified: true,
        isActive: true,
        approvalStatus: null,
      });

      console.log(`Created admin user ${email}.`);
    }
  } catch (error) {
    console.error(`Failed to create admin user: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

main();
