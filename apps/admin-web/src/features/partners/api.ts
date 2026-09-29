import { api } from '@/lib/api';
import type {
  Agent,
  AgentInput,
  AgentsPublicApiSettings,
} from './types';

export function listAgents() {
  return api<Agent[]>('/partners/agents');
}

export function createAgent(input: AgentInput) {
  return api<Agent>('/partners/agents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAgent(id: string, input: Partial<AgentInput>) {
  return api<Agent>(`/partners/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAgent(id: string) {
  return api<{ success: boolean }>(`/partners/agents/${id}`, {
    method: 'DELETE',
  });
}

export function getAgentsPublicApiSettings() {
  return api<AgentsPublicApiSettings>(
    '/partners/agents/public-api-settings',
  );
}

export function updateAgentsPublicApiSettings(
  input: Partial<AgentsPublicApiSettings>,
) {
  return api<AgentsPublicApiSettings>(
    '/partners/agents/public-api-settings',
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
