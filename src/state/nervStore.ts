/**
 * Re-export from the canonical store location.
 * Components may import from either 'src/store/useNervStore' or 'src/state/nervStore'.
 */
export {
  useNervStore,
  eva_computeMagiStatus,
  eva_getMagiApproval,
  eva_calculateSyncRatio,
} from '../store/useNervStore';

export type {
  NervState,
  EmergencyLevel,
  MagiStatus,
  MagiSubSystem,
  MagiVotes,
  SystemAlert,
  SyncRatios,
  EvaPosition,
  HexCoordinate,
} from '../store/useNervStore';
