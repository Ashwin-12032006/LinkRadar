require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  brandName: process.env.BRAND_NAME || 'LinkLens AI',
};
