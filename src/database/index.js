/**
 * WatermelonDB Database Initialization
 * Used for offline location tracking storage
 */
import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import migrations from './migrations';
import TrackingSession from './models/TrackingSession';
import LocationPoint from './models/LocationPoint';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'hrms_tracking_db',
  // JSI provides better performance on supported platforms
  jsi: Platform.OS === 'ios',
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [TrackingSession, LocationPoint],
});

export { TrackingSession, LocationPoint };
