import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { UserModel } from '../src/modules/users/user.model.js';

loadEnv();

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  const roleArg = process.argv[3]?.trim() ?? 'content_manager';

  if (!email) {
    console.error('Usage: pnpm --filter @mahatest/api promote -- <email> [content_manager|super_admin]');
    process.exit(1);
  }

  if (roleArg !== 'content_manager' && roleArg !== 'super_admin') {
    console.error('Role must be content_manager or super_admin');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  const user = await UserModel.findOne({ email });

  if (!user) {
    console.error(`No user found for ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = roleArg;
  await user.save();
  console.info(`Updated ${email} → role=${roleArg}`);
  await mongoose.disconnect();
}

void main();
