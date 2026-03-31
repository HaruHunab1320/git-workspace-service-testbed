import { useNervStore } from '../../store/useNervStore';
import type { MagiVotes } from '../../store/useNervStore';
import { eva_resolveMagiTieBreak, DEFAULT_MAGI_TIEBREAK_WEIGHTS } from '../../simulation/engine';

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
 * Compute MAGI consensus from a set of votes using tie-break logic.
 * In case of a 1/3 CONFLICT, the weighted priority system resolves the tie.
 *
 * @param votes - The three MAGI sub-system votes.
 * @returns `true` if consensus resolves to AGREE.
 */
export function eva_computeConsensus(votes: MagiVotes): boolean {
  let weights = DEFAULT_MAGI_TIEBREAK_WEIGHTS;
  try {
    const state = useNervStore.getState();
    if (state?.magiTieBreakWeights) {
      weights = state.magiTieBreakWeights;
    }
  } catch {
    // Store may not be initialized in test environments
  }
  return eva_resolveMagiTieBreak(votes, weights) === 'AGREE';
}
