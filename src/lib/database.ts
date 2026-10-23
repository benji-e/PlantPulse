import Dexie, { type EntityTable } from 'dexie';
import type { Diagnosis } from './types';

class PlantPulseDatabase extends Dexie {
  scans!: EntityTable<Diagnosis, 'id'>;

  constructor() {
    super('PlantPulse');
    this.version(1).stores({ scans: 'id, createdAt' });
  }
}

export const database = new PlantPulseDatabase();
