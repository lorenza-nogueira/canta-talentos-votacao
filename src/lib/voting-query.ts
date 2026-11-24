import { queryOptions } from '@tanstack/react-query';
import { getVotingState } from './voting.functions';

export const votingQueryOptions = () => queryOptions({
  queryKey: ['voting'],
  queryFn: () => getVotingState(),
  staleTime: 30_000,
  retry: false,
  refetchOnWindowFocus: false,
});