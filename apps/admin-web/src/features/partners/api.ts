import { api } from '@/lib/api';
import type {
  Agent,
  AgentInput,
  AgentsMapsSettings,
  AgentsPublicApiSettings,
  Region,
  RegionInput,
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

export function listRegions() {
  return api<Region[]>('/partners/regions');
}

export function createRegion(input: RegionInput) {
  return api<Region>('/partners/regions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRegion(id: string, input: Partial<RegionInput>) {
  return api<Region>(`/partners/regions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteRegion(id: string) {
  return api<{ success: boolean }>(`/partners/regions/${id}`, {
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

export function getAgentsMapsSettings() {
  return api<AgentsMapsSettings>('/partners/agents/maps-settings');
}

export function updateAgentsMapsSettings(input: Partial<AgentsMapsSettings>) {
  return api<AgentsMapsSettings>('/partners/agents/maps-settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
