import { describe, expect, it } from 'vitest';
import talents from '@/data/talents.json';
import documents from '@/assets/canta/registrations/documents.json';
import { voteSheetUpdate } from '@/lib/vote-export';

describe('November registration eligibility', () => {
  it('removes the first Baixista registration without reusing its ID', () => {
    expect(talents.some(talent => talent.id === 1)).toBe(false);
    expect(talents.filter(talent => talent.name === 'Daniel Brugin de Faria').map(talent => talent.id)).toEqual([8]);
  });
  it('preserves the existing active participant IDs', () => {
    expect(talents.filter(talent => talent.id <= 7).map(talent => talent.id)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(new Set(talents.map(talent => talent.id)).size).toBe(17);
  });
  it.each([
    [8, 'Daniel Brugin de Faria'], [9, 'Francielly Yamamoto'],
    [10, 'Jhonatan Roberto De Oliveira'], [11, 'PIERA BEATRIZ SENA FERRAO'],
    [12, 'Myllena Graciani Batista'], [13, 'Victória Ieno Gomes Sardinha'],
    [14, 'Lucas Rafael da Silva'], [15, 'Priscila Ramos de Albuquerque'],
    [16, 'Helena de Carvalho Bernardo'], [17, 'Henrique Mello von Brewer Lopes'],
    [18, 'Carolina Penteado de Faria e Silva'],
  ])('includes row participant %s in eligibility and vote export', (id, name) => {
    const talent = talents.find(value => value.id === id);
    expect(talent?.name).toBe(name);
    const update = voteSheetUpdate({ id: 10, created_at: '2026-11-24T12:00:00Z', voter_name: 'Teste', voter_email: 'teste@canta.ag', talent_id: Number(id), withdrawn_at: null, sheet_revision: 1 });
    expect(update.values[0]?.[3]).toBe(id);
    expect(update.values[0]?.[5]).toBe(name);
  });
  it.each([[9, 12], [10, 6], [17, 6]])('retains the submitted PDF and every page for talent %s', (id, count) => {
    const href = talents.find(talent => talent.id === id)?.links.find(link => link.type === 'pdf')?.url;
    const document = documents.find(value => value.src === href);
    expect(document?.pages).toHaveLength(count);
    expect(document?.pages.every(page => page.width > 0 && page.height > 0)).toBe(true);
  });
});