import { Model, Q } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class TrackingSession extends Model {
  static table = 'tracking_sessions';

  static associations = {
    location_points: { type: 'has_many', foreignKey: 'session_local_id' },
  };

  @field('local_session_id') localSessionId;
  @field('server_session_id') serverSessionId;
  @field('start_time') startTime;
  @field('end_time') endTime;
  @field('status') status;
  @field('synced') synced;
  @field('punch_in_photo_uri') punchInPhotoUri;
  @field('punch_out_photo_uri') punchOutPhotoUri;
  @readonly @date('created_at') createdAt;

  get locationPoints() {
    return this.collections.get('location_points').query(Q.where('session_local_id', this.localSessionId));
  }
}
