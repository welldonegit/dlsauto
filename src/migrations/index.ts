import * as migration_20261030_181900_initial from './20261030_181900_initial';

export const migrations = [
  {
    up: migration_20261030_181900_initial.up,
    down: migration_20261030_181900_initial.down,
    name: '20261030_181900_initial'
  },
];
