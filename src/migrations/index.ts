import * as migration_20261123_113831_initial from './20261123_113831_initial';
import * as migration_20261126_110531_crossnumbers from './20261126_110531_crossnumbers';
import * as migration_20261126_130537_hotoffers from './20261126_130537_hotoffers';
import * as migration_20261126_132259_drop_quickview_warranty from './20261126_132259_drop_quickview_warranty';
import * as migration_20261126_134617_delivery_settings from './20261126_134617_delivery_settings';
import * as migration_20261127_115341_drop_settings_accept_prepayment from './20261127_115341_drop_settings_accept_prepayment';

export const migrations = [
  {
    up: migration_20261123_113831_initial.up,
    down: migration_20261123_113831_initial.down,
    name: '20261123_113831_initial',
  },
  {
    up: migration_20261126_110531_crossnumbers.up,
    down: migration_20261126_110531_crossnumbers.down,
    name: '20261126_110531_crossnumbers',
  },
  {
    up: migration_20261126_130537_hotoffers.up,
    down: migration_20261126_130537_hotoffers.down,
    name: '20261126_130537_hotoffers',
  },
  {
    up: migration_20261126_132259_drop_quickview_warranty.up,
    down: migration_20261126_132259_drop_quickview_warranty.down,
    name: '20261126_132259_drop_quickview_warranty',
  },
  {
    up: migration_20261126_134617_delivery_settings.up,
    down: migration_20261126_134617_delivery_settings.down,
    name: '20261126_134617_delivery_settings',
  },
  {
    up: migration_20261127_115341_drop_settings_accept_prepayment.up,
    down: migration_20261127_115341_drop_settings_accept_prepayment.down,
    name: '20261127_115341_drop_settings_accept_prepayment'
  },
];
