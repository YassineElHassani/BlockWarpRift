export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blockwarprift',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || '',
    network: process.env.NETWORK || 'sepolia',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});
