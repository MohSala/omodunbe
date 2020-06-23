require('dotenv').config()

const appName = 'USER_SERVICE';

export const config = {
  appName,
  server: {
    url: process.env.APP_URL,
    port: process.env.APP_PORT
  },
  baseUrl: process.env.BASE_URL,
  mongo: {
    connection: {
      host: process.env.MONGODB_HOST,
      username: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD,
      port: process.env.MONGODB_PORT,
      dbProd: process.env.MONGODB_DATABASE_NAME
    },
    collections: {
      users: 'users',

    },
    queryLimit: process.env.MONGODB_QUERY_LIMIT,
    questionLimit: process.env.QUESTION_LIMIT
  },

  mongoErrorCode: {
    duplicateId: 11000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.LOG_ENABLE_CONSOLE === 'true'
  },
  secretKey: process.env.ODA_SECRET_KEY,
  sms: {
    apiKey: process.env.SLING_KEY
  },
  aws: {
    access_key: process.env.AWS_ACCESS_KEY,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET
  },
  postgres: {
    username: process.env.CONFIG_DB_USERNAME,
    password: process.env.CONFIG_DB_PASSWORD,
    database: process.env.CONFIG_DB_NAME,
    host: process.env.CONFIG_DB_HOST,
    dialect: "postgres",
    timezone: "Africa/Lagos"
  },
  wallet: {
    url: process.env.WALLET_URL
  },
  rabbitMq: {
    url: process.env.RABBITMQ_URL
  }
};

