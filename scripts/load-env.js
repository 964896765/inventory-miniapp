// Load environment variables with proper priority (system > .env)
// This file is required by app.config.js.

const fs = require('fs');
const path = require('path');

try {
  // dotenv is a dependency of the backend; but we also use it here for Expo config.
  // If it's not installed yet, we simply skip loading from .env.
  // eslint-disable-next-line import/no-extraneous-dependencies
  const dotenv = require('dotenv');

  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
} catch (e) {
  // ignore when dotenv isn't installed yet
}
