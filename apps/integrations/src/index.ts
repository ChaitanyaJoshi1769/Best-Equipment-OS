import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import * as dotenv from 'dotenv';
import { Logger } from 'pino';
import {
  SalesforceConnector,
  SAP_ERPConnector,
  Telematics_ServiceConnector,
  TwilioNotificationConnector,
  WebhookIntegration,
} from './connectors';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });
fastify.register(helmet);

interface IntegrationConfig {
  type: string;
  apiKey: string;
  endpoint: string;
  organizationId: string;
  enabled: boolean;
}

const integrations: Map<string, IntegrationConfig> = new Map();

// Initialize connectors
fastify.post('/api/integrations/register', async (request, reply) => {
  const { type, apiKey, endpoint, organizationId } = request.body as any;

  const config: IntegrationConfig = {
    type,
    apiKey,
    endpoint,
    organizationId,
    enabled: true,
  };

  integrations.set(`${organizationId}-${type}`, config);

  return {
    status: 'registered',
    type,
    organizationId,
  };
});

fastify.post('/api/integrations/sync/vehicles', async (request, reply) => {
  const { organizationId, type, vehicles } = request.body as any;
  const config = integrations.get(`${organizationId}-${type}`);

  if (!config || !config.enabled) {
    return reply.code(400).send({ error: 'Integration not configured' });
  }

  try {
    let result;

    switch (type) {
      case 'salesforce':
        const sfConnector = new SalesforceConnector(config);
        result = await sfConnector.syncVehicles(vehicles);
        break;

      case 'sap':
        const sapConnector = new SAP_ERPConnector(config);
        result = await sapConnector.syncInventory(vehicles);
        break;

      case 'webhook':
        const webhookConnector = new WebhookIntegration(config);
        result = await webhookConnector.sendBatch(
          vehicles.map(v => ({ type: 'vehicle.synced', data: v }))
        );
        break;

      default:
        return reply.code(400).send({ error: 'Unknown integration type' });
    }

    return { status: 'synced', count: vehicles.length, result };
  } catch (error) {
    return reply.code(500).send({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

fastify.post('/api/integrations/sync/jobs', async (request, reply) => {
  const { organizationId, type, jobs } = request.body as any;
  const config = integrations.get(`${organizationId}-${type}`);

  if (!config || !config.enabled) {
    return reply.code(400).send({ error: 'Integration not configured' });
  }

  try {
    let result;

    switch (type) {
      case 'salesforce':
        const sfConnector = new SalesforceConnector(config);
        result = await sfConnector.syncJobs(jobs);
        break;

      case 'webhook':
        const webhookConnector = new WebhookIntegration(config);
        result = await webhookConnector.sendBatch(
          jobs.map(j => ({ type: 'job.synced', data: j }))
        );
        break;

      default:
        return reply.code(400).send({ error: 'Unknown integration type' });
    }

    return { status: 'synced', count: jobs.length, result };
  } catch (error) {
    return reply.code(500).send({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

fastify.get('/api/integrations/telemetry/:vehicleId', async (request, reply) => {
  const { vehicleId } = request.params as any;
  const { organizationId } = request.query as any;

  const config = integrations.get(`${organizationId}-telematics`);

  if (!config || !config.enabled) {
    return reply.code(400).send({ error: 'Telematics integration not configured' });
  }

  try {
    const connector = new Telematics_ServiceConnector(config);
    const data = await connector.getLocationData(vehicleId);
    return data.data;
  } catch (error) {
    return reply.code(500).send({ error: error instanceof Error ? error.message : 'Failed to fetch telemetry' });
  }
});

fastify.post('/api/integrations/notifications/sms', async (request, reply) => {
  const { organizationId, phoneNumber, message } = request.body as any;
  const config = integrations.get(`${organizationId}-twilio`);

  if (!config || !config.enabled) {
    return reply.code(400).send({ error: 'SMS integration not configured' });
  }

  try {
    const connector = new TwilioNotificationConnector(config);
    const result = await connector.sendSMS(phoneNumber, message);
    return { status: 'sent', messageId: result.data.sid };
  } catch (error) {
    return reply.code(500).send({ error: error instanceof Error ? error.message : 'Failed to send SMS' });
  }
});

fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'ok',
    service: 'integrations',
    integrations: Array.from(integrations.keys()),
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    fastify.log.info('Integration service listening on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
