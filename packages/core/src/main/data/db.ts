import mongoose from 'mongoose';
import { logger } from '@yumm/utils';
// import seeder from './seeder';

export const DB = async (connectionString: string, useSeeder = false) => {
  try {
    mongoose.set('strictQuery', true);
    mongoose.connection.syncIndexes();

    await mongoose.connect(connectionString);
    logger.info('database connected');
    if (useSeeder) {
      // await seeder();
      logger.info('admin seeded');
    }
  } catch (error) {
    logger.error([error]);
  }
};
