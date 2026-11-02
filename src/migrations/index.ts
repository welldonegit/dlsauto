import * as migration_20261030_181900_initial from './20261030_181900_initial';
import * as migration_20261102_100155_initial from './20261102_100155_initial';

export const migrations = [
  {
    up: migration_20261030_181900_initial.up,
    down: migration_20261030_181900_initial.down,
    name: '20261030_181900_initial',
  },
  {
    up: migration_20261102_100155_initial.up,
    down: migration_20261102_100155_initial.down,
    name: '20261102_100155_initial'
  },
];
