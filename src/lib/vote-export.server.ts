import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { voteSheetUpdate } from './vote-export';

const SHEET = '1zuK8UZ6aHvEZHi9XP875aA6S-yrkxVr9OwjSEmBGqkY';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_sheets/v4';

export async function syncVoteSheet(client: SupabaseClient<Database>, gatewayKey: string | undefined, connectionKey: string | undefined) {
  const pending = await client.from('canta_votes').select('id,created_at,voter_name,voter_email,talent_id,withdrawn_at,sheet_revision').is('sheet_synced_at', null).order('id').limit(100);
  if (pending.error) return true;
  if (!pending.data?.length) return false;
  if (!gatewayKey || !connectionKey) return true;
  try {
    const response = await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'RAW', data: pending.data.map(voteSheetUpdate) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error(`Sheets sync failed [${response.status}]: ${await response.text()}`);
      return true;
    }
    // Only mark the exported version. A changed vote remains pending for the next action.
    const marked = await Promise.all(pending.data.map(vote => client.from('canta_votes')
      .update({ sheet_synced_at: new Date().toISOString() })
      .eq('id', vote.id).eq('sheet_revision', vote.sheet_revision).select('id')));
    return marked.some(result => result.error || !result.data?.length);
  } catch { return true; }
}