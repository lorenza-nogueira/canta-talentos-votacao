import talents from '@/data/talents.json';

export interface VoteExportRow {
  id: number;
  created_at: string;
  voter_name: string;
  voter_email: string;
  talent_id: number;
  withdrawn_at: string | null;
  sheet_revision: number;
}

export function voteSheetUpdate(vote: VoteExportRow) {
  const talent = talents.find(t => t.id === vote.talent_id);
  return {
    range: `'Votos'!A${vote.id + 1}:G${vote.id + 1}`,
    values: [vote.withdrawn_at ? ['', '', '', '', '', '', ''] : [
      new Date(vote.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      vote.voter_name, vote.voter_email, vote.talent_id,
      talent?.projectName ?? '', talent?.name ?? '', talent?.category ?? '',
    ]],
  };
}