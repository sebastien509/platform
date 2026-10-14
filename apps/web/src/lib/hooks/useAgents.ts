import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';

export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
  activity: (id: string) => [...agentKeys.all, 'activity', id] as const,
};

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: () => agentsApi.list(),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => agentsApi.get(id),
    enabled: !!id,
  });
}

export function useAgentActivity(id: string) {
  return useQuery({
    queryKey: agentKeys.activity(id),
    queryFn: () => agentsApi.getActivity(id),
    enabled: !!id,
  });
}
