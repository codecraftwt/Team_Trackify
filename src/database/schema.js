import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema for offline location tracking
 * - tracking_sessions: Stores session metadata (local + server IDs when synced)
 * - location_points: Stores location data for offline-first tracking
 */
export default appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'tracking_sessions',
      columns: [
        { name: 'local_session_id', type: 'string', isIndexed: true },
        { name: 'server_session_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'status', type: 'string' }, // 'active' | 'ended'
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'location_points',
      columns: [
        { name: 'session_local_id', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'timestamp', type: 'number' },
        { name: 'address', type: 'string' },
        { name: 'road', type: 'string' },
        { name: 'area', type: 'string' },
        { name: 'accuracy', type: 'number', isOptional: true },
        { name: 'heading', type: 'number', isOptional: true },
        { name: 'speed', type: 'number', isOptional: true },
        { name: 'battery_percentage', type: 'number', isOptional: true },
        { name: 'source', type: 'string' }, // 'foreground' | 'background' | 'photo'
        { name: 'synced', type: 'boolean' },
        { name: 'remark', type: 'string', isOptional: true },
        { name: 'amount', type: 'string', isOptional: true },
        { name: 'photo_uri', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'is_online', type: 'boolean', isOptional: true },
      ],
    }),
  ],
});