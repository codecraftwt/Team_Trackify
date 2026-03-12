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
  ],
});
