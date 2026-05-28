import axios from 'axios';

interface IntegrationConfig {
  apiKey: string;
  endpoint: string;
  organizationId: string;
}

export class SalesforceConnector {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async syncVehicles(vehicles: any[]) {
    return axios.post(`${this.config.endpoint}/services/data/v57.0/sobjects/Vehicle__c/batch`, {
      records: vehicles.map(v => ({
        Name: v.name,
        Asset_ID__c: v.assetId,
        VIN__c: v.vin,
        Status__c: v.status,
      })),
    }, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }

  async syncJobs(jobs: any[]) {
    return axios.post(`${this.config.endpoint}/services/data/v57.0/sobjects/Job__c/batch`, {
      records: jobs.map(j => ({
        Name: j.jobNumber,
        Title__c: j.title,
        Status__c: j.status,
        Priority__c: j.priority,
      })),
    }, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }
}

export class SAP_ERPConnector {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async syncInventory(inventory: any[]) {
    return axios.post(`${this.config.endpoint}/api/MaterialDocuments`, {
      items: inventory.map(i => ({
        material: i.id,
        quantity: i.quantity,
        warehouse: i.warehouse,
      })),
    }, {
      headers: { 'x-csrf-token': this.config.apiKey },
    });
  }

  async getCostData(jobId: string) {
    return axios.get(
      `${this.config.endpoint}/api/Orders('${jobId}')?$select=TotalPrice,Currency`,
      { headers: { 'x-csrf-token': this.config.apiKey } }
    );
  }
}

export class Telematics_ServiceConnector {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async pullTelemetryData(vehicleId: string, startDate: Date, endDate: Date) {
    return axios.get(`${this.config.endpoint}/vehicle/${vehicleId}/telemetry`, {
      params: { start: startDate.toISOString(), end: endDate.toISOString() },
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }

  async getLocationData(vehicleId: string) {
    return axios.get(`${this.config.endpoint}/vehicle/${vehicleId}/location`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }
}

export class TwilioNotificationConnector {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendSMS(phoneNumber: string, message: string) {
    return axios.post(`${this.config.endpoint}/Messages.json`, {
      From: '+1234567890',
      To: phoneNumber,
      Body: message,
    }, {
      auth: {
        username: this.config.apiKey.split(':')[0],
        password: this.config.apiKey.split(':')[1],
      },
    });
  }

  async sendEmail(email: string, subject: string, body: string) {
    return axios.post(`${this.config.endpoint}/SendEmail`, {
      To: email,
      Subject: subject,
      TextBody: body,
    }, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
  }
}

export class WebhookIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  async sendEvent(eventType: string, data: any) {
    return axios.post(this.config.endpoint, {
      type: eventType,
      organizationId: this.config.organizationId,
      timestamp: new Date().toISOString(),
      data,
    }, {
      headers: { 'X-API-Key': this.config.apiKey },
      timeout: 5000,
    });
  }

  async sendBatch(events: any[]) {
    return axios.post(`${this.config.endpoint}/batch`, {
      events: events.map(e => ({
        ...e,
        organizationId: this.config.organizationId,
        timestamp: new Date().toISOString(),
      })),
    }, {
      headers: { 'X-API-Key': this.config.apiKey },
    });
  }
}
