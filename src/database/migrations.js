import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        {
          type: 'add_columns',
          table: 'location_points',
          columns: [{ name: 'is_online', type: 'boolean', isOptional: true }],
        },
      ],
    },
    {
      toVersion: 3,
      steps: [
        {
          type: 'add_columns',
          table: 'tracking_sessions',
          columns: [{ name: 'punch_in_photo_uri', type: 'string', isOptional: true }],
        },
      ],
    },
    {
      toVersion: 4,
      steps: [
        {
          type: 'add_columns',
          table: 'tracking_sessions',
          columns: [{ name: 'punch_out_photo_uri', type: 'string', isOptional: true }],
        },
      ],
    },
  ],
});
