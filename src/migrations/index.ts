import * as migration_20261123_113831_initial from './20261123_113831_initial';
import * as migration_20261126_110531_crossnumbers from './20261126_110531_crossnumbers';
import * as migration_20261126_130537_hotoffers from './20261126_130537_hotoffers';

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
    name: '20261126_130537_hotoffers'
  },
];
