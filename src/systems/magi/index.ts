import { useNervStore } from '../../store/useNervStore';
import type { MagiVotes } from '../../store/useNervStore';

/**
 * MAGI sub-system identifiers corresponding to the three
 * personality cores of the MAGI supercomputer.
 */
export type MagiSubSystem = 'melchior' | 'balthasar' | 'casper';

/**
 * Human-readable labels for each MAGI sub-system.
 */
export const MAGI_LABELS: Record<MagiSubSystem, { name: string; designation: string }> = {
  melchior: { name: 'MELCHIOR-1', designation: 'SCIENTIST' },
  balthasar: { name: 'BALTHASAR-2', designation: 'MOTHER' },
  casper: { name: 'CASPER-3', designation: 'WOMAN' },
};

/**
 * Retrieve the current boolean vote for a specific MAGI sub-system
 * from the global NERV store.
 *
 * @param subSystem - The MAGI sub-system to query.
 * @returns The current vote (`true` = APPROVE, `false` = REJECT).
 */
export function eva_magiVote(subSystem: MagiSubSystem): boolean {
  const votes = useNervStore.getState().magiVotes;
  return votes[subSystem];
}

/**
 * Check whether a specific MAGI sub-system has approved.
 * Reads from the global NERV store imperatively.
 *
 * @param subSystem - The MAGI sub-system to query.
 * @returns `true` if the sub-system's vote is APPROVE, `false` otherwise.
 */
export function getMagiApproval(subSystem: 'melchior' | 'balthasar' | 'casper'): boolean {
  return eva_magiVote(subSystem);
}

/**
 * Compute MAGI consensus from a set of votes.
 * Requires a 2/3 majority for approval.
 *
 * @param votes - The three MAGI sub-system votes.
 * @returns `true` if 2 or more votes are APPROVE.
 */
export function eva_computeConsensus(votes: MagiVotes): boolean {
  const approveCount = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  return approveCount >= 2;
}
