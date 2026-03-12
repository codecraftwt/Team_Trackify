import { Model, Q } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class LocationPoint extends Model {
  static table = 'location_points';

  @field('session_local_id') sessionLocalId;
  @field('latitude') latitude;
  @field('longitude') longitude;
  @field('timestamp') timestamp;
  @field('address') address;
  @field('road') road;
  @field('area') area;
  @field('accuracy') accuracy;
  @field('heading') heading;
  @field('speed') speed;
  @field('battery_percentage') batteryPercentage;
  @field('source') source;
  @field('synced') synced;
  @field('remark') remark;
  @field('amount') amount;
  @field('photo_uri') photoUri;
  @field('is_online') isOnline;
  @readonly @date('created_at') createdAt;
}
