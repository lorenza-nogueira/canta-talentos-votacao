import { describe, expect, it } from 'vitest';
import { removeVoteSelection, toggleVoteSelection } from '@/lib/voting-rules';
import { voteSheetUpdate, type VoteExportRow } from '@/lib/vote-export';

const vote: VoteExportRow = {
  id: 13, created_at: '2026-11-11T12:00:00Z', voter_name: 'Pessoa CANTA',
  voter_email: 'pessoa@canta.ag', talent_id: 1, withdrawn_at: null, sheet_revision: 1,
};

describe('Vote withdrawal', () => {
  it('removes only the selected talent', () => {
    expect(removeVoteSelection({ 1: true, 2: true }, 1)).toEqual({ 2: true });
  });
  it('allows voting again after withdrawing without duplicating the selection', () => {
    expect(toggleVoteSelection(removeVoteSelection({ 1: true }, 1), 1)).toEqual({ 1: true });
  });
  it('clears all seven cells in the immutable vote row when withdrawn', () => {
    expect(voteSheetUpdate({ ...vote, withdrawn_at: '2026-11-11T12:01:00Z' })).toEqual({
      range: "'Votos'!A14:G14", values: [['', '', '', '', '', '', '']],
    });
  });
  it('restores the same row and talent ID when voting again', () => {
    const restored = voteSheetUpdate(vote);
    expect(restored.range).toBe("'Votos'!A14:G14");
    expect(restored.values[0]?.[3]).toBe(1);
  });
  it('exports the seventh registration with Nayane’s actual talent instead of empty fields', () => {
    expect(voteSheetUpdate({ ...vote, talent_id: 7 }).values[0]?.slice(3)).toEqual([
      7, 'Crochê', 'Nayane Marques Breviglieri', 'Artesanato',
    ]);
  });
});