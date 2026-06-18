import { ApiClient } from './client';
import type {
  ActuatorHealthDTO,
  ActuatorInfoDTO,
  ActuatorMetricDTO,
  ActuatorMetricsDTO,
} from './types';

export async function getActuatorHealth(client: ApiClient): Promise<ActuatorHealthDTO> {
  return getActuatorJson<ActuatorHealthDTO>(client, '/actuator/health');
}

export async function getActuatorInfo(client: ApiClient): Promise<ActuatorInfoDTO> {
  return getActuatorJson<ActuatorInfoDTO>(client, '/actuator/info');
}

export async function getActuatorMetrics(client: ApiClient): Promise<ActuatorMetricsDTO> {
  return getActuatorJson<ActuatorMetricsDTO>(client, '/actuator/metrics');
}

export async function getActuatorMetric(client: ApiClient, name: string): Promise<ActuatorMetricDTO> {
  validateMetricName(name);
  return getActuatorJson<ActuatorMetricDTO>(client, `/actuator/metrics/${encodeURIComponent(name)}`);
}

export async function getActuatorPrometheus(client: ApiClient): Promise<string> {
  const response = await client.getRaw('/actuator/prometheus');
  return response.text();
}

async function getActuatorJson<T>(client: ApiClient, path: string): Promise<T> {
  const response = await client.getRaw(path);
  return response.json() as Promise<T>;
}

function validateMetricName(name: string): void {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('metricName must be a non-empty string');
  }
  if (name.includes('/')) {
    throw new Error('metricName cannot contain "/"');
  }
}
