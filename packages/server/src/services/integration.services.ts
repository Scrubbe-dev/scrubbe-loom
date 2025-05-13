import  Prisma from '../prisma/prisma-client';
import { EventEmitter } from 'events';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { APIError } from '../utils/error';
import { 
  DataSourceType, 
  DataSourceIntegration
} from '../types/integration';



interface DataSourceConfig {
  type: 'CLOUD_STORAGE' | 'AUTH_LOGS' | 'DNS_LOGS' | 'ENDPOINT_LOGS';
  credentials: any;
  pollingInterval?: number;
  customerId?: string;
}

interface LogEvent {
  timestamp: Date;
  source: string;
  type: string;
  rawData: any;
  severity?: number;
  customerId?: string;
}

export class IntegrationService {
  private eventEmitter = new EventEmitter();
  private lastCloudStoragePollTime: Date | null = null;
  private lastAuthPollTime: Date | null = null;
  private lastDnsPollTime: Date | null = null;
  private lastEndpointPollTime: Date | null = null;

  private integrations = new Map<string, { 
    interval: NodeJS.Timeout;
    lastPolledAt: Date | null;
  }>();

  constructor() {
    this.setupEventHandlers();
    this.initializeExistingIntegrations();
  }


  private normalizeOktaEvent(eventType: string): string {
    const eventMap: { [key: string]: string } = {
      'user.session.start': 'AUTH_SUCCESS',
      'user.authentication.auth_fail': 'AUTH_FAILURE',
      'user.account.lock': 'ACCOUNT_LOCKOUT',
      'user.mfa.factor.update': 'MFA_UPDATE',
      'system.api_token.create': 'API_TOKEN_CREATED',
      'system.api_token.revoke': 'API_TOKEN_REVOKED',
      'group.user_membership.add': 'GROUP_MEMBERSHIP_ADDED',
      'group.user_membership.remove': 'GROUP_MEMBERSHIP_REMOVED',
      'user.lifecycle.create': 'USER_CREATED',
      'user.lifecycle.delete': 'USER_DELETED',
      'user.lifecycle.suspend': 'USER_SUSPENDED',
      'user.lifecycle.unsuspend': 'USER_UNSUSPENDED',
      'user.account.privilege.grant': 'PRIVILEGE_GRANTED',
      'user.account.privilege.revoke': 'PRIVILEGE_REVOKED',
      'policy.evaluate.sign_on': 'POLICY_EVALUATED',
      'user.session.end': 'AUTH_LOGOUT'
    };

    return eventMap[eventType] || 'OTHER_AUTH_EVENT';
  }
  
  private async initializeExistingIntegrations() {
    try {
      const existingIntegrations:any = await prisma?.dataSourceIntegration.findMany({
        where: { isActive: true },
      });

      for (const integration of existingIntegrations) {
        this.startDataSourcePolling(
          integration.id,
          {
            type: integration.type as any,
            credentials: integration.config,
            pollingInterval: integration.pollingInterval,
            customerId: integration.customerId || undefined,
          }
        );
      }
    } catch (error) {
      logger.error('Error initializing existing integrations:', error);
    }
  }


  async pollDataSource(integration: DataSourceIntegration): Promise<void> {
    try {
      logger.debug(`Polling data source ${integration.id}...`);
      
      const events = await this.fetchEventsFromSource({
        type: integration.type,
        credentials: integration.config,
        pollingInterval: integration.pollingInterval || undefined,
        customerId: integration.customerId || undefined
      });

      logger.info(`Found ${events.length} events from ${integration.type}`);

      for (const event of events) {
        this.eventEmitter.emit('new_event', {
          ...event,
          source: integration.type,
          customerId: integration.customerId || null
        });
      }

      this.integrations.get(integration.id)!.lastPolledAt = new Date();
    } catch (error:any) {
      logger.error(`Failed to poll data source ${integration.id}:`, error);
      throw new APIError(`Failed to poll data source: ${error.message}`, 500);
    }
  }

  async getPollingStatus(integrationId: string): Promise<{
    isActive: boolean;
    lastPolledAt: Date | null;
    nextPollAt: Date | null;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new APIError('Integration not found or not polling', 404);
    }

    const interval = integration.interval['close'];
    const nextPollAt = integration.lastPolledAt 
      ? new Date(integration.lastPolledAt.getTime() + Number(interval))
      : null;

    return {
      isActive: !!integration.interval,
      lastPolledAt: integration.lastPolledAt,
      nextPollAt
    };
  }





  private setupEventHandlers() {
    this.eventEmitter.on('new_event', async (event: LogEvent) => {
      try {
        const securityEvent = await prisma?.securityEvent.create({
          data: {
            timestamp: event.timestamp,
            source: event.source,
            type: event.type,
            severity: event.severity || 0,
            rawData: event.rawData,
            customerId: event.customerId || null,
          },
        });

        await this.evaluateDetectionRules(securityEvent);
      } catch (error) {
        logger.error('Error processing new event:', error);
      }
    });
  }

  private async evaluateDetectionRules(event: any) {
    const rules:any = await prisma?.detectionRule.findMany({
      where: {
        isActive: true,
        OR: [
          { platform: 'CUSTOM' },
          { platform: event.source.toUpperCase() },
        ],
      },
    });

    for (const rule of rules) {
      try {
        const matches = this.evaluateRule(rule, event);
        
        if (matches) {
          await this.createAlert(rule, event);
        }
      } catch (error) {
        logger.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
  }

  private evaluateRule(rule: any, event: any): boolean {
    try {
      // This is a simplified evaluation - in production you'd use a proper rule engine
      const condition = JSON.parse(JSON.stringify(rule.condition));
      
      // Check event type match
      if (condition.eventType && condition.eventType !== event.type) {
        return false;
      }
      
      // Check severity threshold if specified
      if (condition.minSeverity && event.severity < condition.minSeverity) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error parsing rule condition:', error);
      return false;
    }
  }

  private async createAlert(rule: any, event: any) {
    const alert = await prisma?.alert.create({
      data: {
        ruleId: rule.id,
        severity: this.convertSeverityToNumber(rule.severity),
        status: 'OPEN',
      },
    });

    await prisma?.securityEvent.update({
      where: { id: event.id },
      data: {
        alertid: alert?.id,
        processed: true,
      },
    });

    if (rule.autoGenerateIncident) {
      await this.createIncidentFromAlert(alert?.id as any, rule.severity);
    }

    this.eventEmitter.emit('new_alert', { alert, event });
  }

  private convertSeverityToNumber(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  private async createIncidentFromAlert(alertId: string, severity: string) {
    const alert = await prisma?.alert.findUnique({
      where: { id: alertId },
      include: { rule: true, events: true },
    });

    if (!alert) return;

    const incident = await prisma?.incident.create({
      data: {
        title: `New Incident from ${alert.rule.name}`,
        description: `Automatically generated incident from alert ${alertId}`,
        status: 'OPEN',
        priority: this.convertSeverityToPriority(severity),
        alerts: {
          connect: { id: alertId },
        },
        customerId: alert.events[0]?.customerId || null,
      },
    });

    this.eventEmitter.emit('new_incident', incident);
  }

  private convertSeverityToPriority(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  async addDataSource(userId: string, config: DataSourceConfig) {
    const user = await prisma?.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Validate customer exists if customerId is provided
    if (config.customerId) {
      const customer = await prisma?.customer.findUnique({ where: { id: config.customerId } });
      if (!customer) {
        throw new APIError('Customer not found', 404);
      }
    }

    const integration = await prisma?.dataSourceIntegration.create({
      data: {
        type: config.type,
        config: config.credentials,
        pollingInterval: config.pollingInterval || 300000, // Default 5 minutes
        userId,
        customerId: config.customerId || null,
        isActive: true,
      },
    });

    this.startDataSourcePolling(integration?.id as any, config);

    return integration;
  }

  private startDataSourcePolling(integrationId: string, config: DataSourceConfig) {
    const pollingInterval = config.pollingInterval || 300000; // Default 5 minutes

    const poll = async () => {
      try {
        const events = await this.fetchEventsFromSource(config);
        for (const event of events) {
          this.eventEmitter.emit('new_event', {
            ...event,
            source: config.type,
            customerId: config.customerId,
          });
        }
      } catch (error) {
        logger.error(`Error polling data source ${integrationId}:`, error);
      }
    };

    const interval = setInterval(poll, pollingInterval);
    this.integrations.set(integrationId, {
      interval,
      lastPolledAt: null
    });

    // Initial poll
    setTimeout(poll, 1000);
  }

  private async fetchEventsFromSource(config: DataSourceConfig): Promise<LogEvent[]> {
    // Implementation would vary based on the specific data source
    // This is a mock implementation
    switch (config.type) {
      case 'CLOUD_STORAGE':
        return this.fetchCloudStorageEvents(config.credentials);
      case 'AUTH_LOGS':
        return this.fetchAuthLogs(config.credentials);
      case 'DNS_LOGS':
        return this.fetchDnsLogs(config.credentials);
      case 'ENDPOINT_LOGS':
        return this.fetchEndpointLogs(config.credentials);
      default:
        return [];
    }
  }

  private async fetchCloudStorageEvents(credentials: any): Promise<LogEvent[]> {
    try {
        const events: LogEvent[] = [];
        const { provider, accessKeyId, secretAccessKey, region, bucketName, pathPrefix } = credentials;

        // Generic cloud storage client interface
        interface CloudStorageClient {
            listObjects(params: any): Promise<any>;
            getObject(params: any): Promise<any>;
        }

        let client: CloudStorageClient;
        
        switch (provider.toLowerCase()) {
            case 'aws':
              //@ts-ignore
              // work on this 
                const { S3Client, ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3');
                client = {
                    listObjects: async (params) => {
                        const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
                        return s3.send(new ListObjectsV2Command(params));
                    },
                    getObject: async (params) => {
                        const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
                        return s3.send(new GetObjectCommand(params));
                    }
                };
                break;

            case 'azure':
                const { BlobServiceClient } = await import('@azure/storage-blob');
                const blobServiceClient = BlobServiceClient.fromConnectionString(credentials.connectionString);
                client = {
                    listObjects: async () => {
                        const containerClient = blobServiceClient.getContainerClient(bucketName);
                        return containerClient.listBlobsFlat({ prefix: pathPrefix });
                    },
                    getObject: async (params) => {
                        const containerClient = blobServiceClient.getContainerClient(bucketName);
                        const blobClient = containerClient.getBlobClient(params.Key);
                        return blobClient.download();
                    }
                };
                break;

            case 'gcp':
                const { Storage } = await import('@google-cloud/storage');
                const storage = new Storage({
                    projectId: credentials.projectId,
                    credentials: {
                        client_email: credentials.clientEmail,
                        private_key: credentials.privateKey
                    }
                });
                client = {
                    listObjects: async () => storage.bucket(bucketName).getFiles({ prefix: pathPrefix }),
                    getObject: async (params) => storage.bucket(bucketName).file(params.Key).download()
                };
                break;

            default:
                throw new Error(`Unsupported cloud provider: ${provider}`);
        }

        // Process objects with pagination
        let continuationToken: string | undefined;
        do {
            const response = await client.listObjects({
                Bucket: bucketName,
                Prefix: pathPrefix,
                ContinuationToken: continuationToken,
                StartAfter: this.lastCloudStoragePollTime?.toISOString()
            });

            for (const object of response.Contents || []) {
                try {
                    const data = await client.getObject({ Key: object.Key, Bucket: bucketName });
                    const content = await this.streamToString(data.Body);
                    
                    const parsedLog = this.parseCloudLog(object.Key, content);
                    const eventType = this.detectAnomaly(parsedLog);

                    events.push({
                        timestamp: object.LastModified || new Date(),
                        source: 'CLOUD_STORAGE',
                        type: eventType,
                        rawData: {
                            ...parsedLog,
                            bucket: bucketName,
                            key: object.Key,
                            size: object.Size,
                            storageClass: object.StorageClass
                        },
                        severity: this.calculateCloudEventSeverity(object, parsedLog)
                    });
                } catch (error) {
                    logger.error(`Failed to process object ${object.Key}`, error);
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        this.lastCloudStoragePollTime = new Date();
        return events;
    } catch (error) {
        logger.error('Cloud storage fetch failed', error);
        throw new APIError('Failed to fetch cloud storage events', 500);
    }
}

private async fetchAuthLogs(credentials: any): Promise<LogEvent[]> {
    try {
        const { provider, clientId, clientSecret, tenantId, workspaceId } = credentials;
        const events: LogEvent[] = [];

        switch (provider.toLowerCase()) {
            case 'okta':
                const { default: Okta } = await import('@okta/okta-sdk-nodejs');
                const oktaClient = new Okta.Client({
                    orgUrl: credentials.orgUrl,
                    token: credentials.apiKey
                });
              //@ts-ignore
              // work on this 
                const logs = await oktaClient.getLogs({
                    since: this.lastAuthPollTime,
                    filter: 'eventType eq "user.session.start" or eventType eq "user.authentication.auth_fail"'
                });

                for (const log of logs) {
                    events.push({
                        timestamp: new Date(log.published),
                        source: 'AUTH_LOGS',
                        type: this.normalizeOktaEvent(log.eventType),
                        rawData: log,
                        severity: this.calculateAuthSeverity(log)
                    });
                }
                break;

            case 'azuread':
                const { ClientSecretCredential } = await import('@azure/identity');
                //@ts-ignore
                // work on this 
                const { LogAnalytics } = await import('@azure/arm-operationalinsights');

                const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
                const client = new LogAnalytics(credential);

                const queryResults = await client.query.execute(workspaceId, `
                    SigninLogs 
                    | where TimeGenerated > ago(1h)
                    | where ResultType != "0"
                    | project TimeGenerated, UserPrincipalName, IPAddress, ResultType, Location
                `);

                for (const row of queryResults.tables[0].rows) {
                    events.push({
                        timestamp: new Date(row[0]),
                        source: 'AUTH_LOGS',
                        type: row[3] === '0' ? 'SUCCESS' : 'FAILURE',
                        rawData: {
                            user: row[1],
                            ipAddress: row[2],
                            result: row[3],
                            location: row[4]
                        },
                        severity: row[3] === '0' ? 1 : 3
                    });
                }
                break;

            case 'crowdstrike':
              //@ts-ignore
              // work on this 
                const Crowdstrike = await import('crowdstrike-client');
                const csClient = new Crowdstrike({
                    baseUrl: credentials.baseUrl,
                    clientId,
                    clientSecret
                });

                const detectionIds = await csClient.getDetections({
                    filter: `timestamp:>='${this.lastAuthPollTime?.toISOString()}'`
                });

                for (const detectionId of detectionIds) {
                    const detection = await csClient.getDetection(detectionId);
                    events.push({
                        timestamp: new Date(detection.timestamp),
                        source: 'AUTH_LOGS',
                        type: detection.behavior,
                        rawData: detection,
                        severity: detection.severity
                    });
                }
                break;

            default:
                throw new Error(`Unsupported auth provider: ${provider}`);
        }

        this.lastAuthPollTime = new Date();
        return events;
    } catch (error) {
        logger.error('Auth logs fetch failed', error);
        throw new APIError('Failed to fetch authentication logs', 500);
    }
}

private async fetchDnsLogs(credentials: any): Promise<LogEvent[]> {
    try {
        const { provider, apiKey, domain, threatIntelSources } = credentials;
        const events: LogEvent[] = [];

        // Check with threat intelligence sources
        const intelResults = await this.checkThreatIntel(domain, threatIntelSources);

        switch (provider.toLowerCase()) {
            case 'cisco_umbrella':
              //@ts-ignore
              // work on this 
                const { Reporting } = await import('umbrella-api');
                const umbrella = new Reporting(apiKey);
                const reports = await umbrella.getDnsEvents({
                    start: this.lastDnsPollTime,
                    limit: 1000,
                    domains: intelResults.maliciousDomains
                });

                for (const report of reports) {
                    events.push({
                        timestamp: new Date(report.timestamp),
                        source: 'DNS_LOGS',
                        type: intelResults.maliciousDomains.includes(report.domain) ? 
                            'MALICIOUS_DOMAIN' : 'DNS_QUERY',
                        rawData: {
                            domain: report.domain,
                            requestedBy: report.internalIp,
                            response: report.response,
                            categories: report.categories
                        },
                        severity: intelResults.maliciousDomains.includes(report.domain) ? 4 : 1
                    });
                }
                break;

            case 'infoblox':
               //@ts-ignore
              // work on this 
                const { BloxApi } = await import('infoblox-client');
                const blox = new BloxApi({
                    host: credentials.host,
                    username: credentials.username,
                    password: credentials.password
                });

                const queries = await blox.getDnsQueries({
                    startTime: this.lastDnsPollTime,
                    threatOnly: true
                });

                for (const query of queries) {
                    events.push({
                        timestamp: new Date(query.time),
                        source: 'DNS_LOGS',
                        type: 'MALICIOUS_DOMAIN',
                        rawData: {
                            domain: query.domain,
                            client: query.client,
                            queryType: query.qtype,
                            threatType: query.threat
                        },
                        severity: 4
                    });
                }
                break;

            default:
                throw new Error(`Unsupported DNS provider: ${provider}`);
        }

        this.lastDnsPollTime = new Date();
        return events;
    } catch (error) {
        logger.error('DNS logs fetch failed', error);
        throw new APIError('Failed to fetch DNS logs', 500);
    }
}

private async fetchEndpointLogs(credentials: any): Promise<LogEvent[]> {
    try {
        const { provider, clientId, clientSecret, baseUrl } = credentials;
        const events: LogEvent[] = [];

        switch (provider.toLowerCase()) {
            case 'crowdstrike':
              //@ts-ignore
              // work on this 
                const Crowdstrike = await import('crowdstrike-client');
                const csClient = new Crowdstrike({ baseUrl, clientId, clientSecret });
                
                const detectionIds = await csClient.getDetections({
                    filter: `timestamp:>='${this.lastEndpointPollTime?.toISOString()}'`
                });

                for (const detectionId of detectionIds) {
                    const detection = await csClient.getDetection(detectionId);
                    events.push({
                        timestamp: new Date(detection.timestamp),
                        source: 'ENDPOINT_LOGS',
                        type: detection.behavior,
                        rawData: detection,
                        severity: detection.severity
                    });
                }
                break;

            case 'sentinelone':
              //@ts-ignore
              // work on this 
                const { SentinelOne } = await import('sentinelone-api');
                const s1Client = new SentinelOne(credentials.apiKey, baseUrl);
                
                const threats = await s1Client.threats.get({
                    createdAt__gt: this.lastEndpointPollTime,
                    limit: 1000
                });

                for (const threat of threats) {
                    events.push({
                        timestamp: new Date(threat.createdAt),
                        source: 'ENDPOINT_LOGS',
                        type: threat.classification,
                        rawData: {
                            agent: threat.agent,
                            process: threat.processName,
                            user: threat.username,
                            file: threat.filePath,
                            indicators: threat.indicators
                        },
                        severity: this.mapS1Severity(threat.confidenceLevel)
                    });
                }
                break;

            case 'carbonblack':
              //@ts-ignore
              // work on this 
                const { CbDefense } = await import('carbonblack-api');
                const cbClient = new CbDefense({
                    url: baseUrl,
                    token: credentials.apiKey
                });

                const alerts = await cbClient.alerts.search({
                    start_time: this.lastEndpointPollTime?.getTime(),
                    query: 'status:New'
                });

                for (const alert of alerts) {
                    events.push({
                        timestamp: new Date(alert.create_time),
                        source: 'ENDPOINT_LOGS',
                        type: alert.type,
                        rawData: alert,
                        severity: alert.severity
                    });
                }
                break;

            default:
                throw new Error(`Unsupported endpoint provider: ${provider}`);
        }

        this.lastEndpointPollTime = new Date();
        return events;
    } catch (error) {
        logger.error('Endpoint logs fetch failed', error);
        throw new APIError('Failed to fetch endpoint logs', 500);
    }
}

  async getEventsForUser(userId: string, filters: any = {}) {
    const user = await prisma?.user.findUnique({
      where: { id: userId },
      include: { Customer: true },
    });

    const customerId = user?.Customer?.[0]?.id;

    const where: any = {
      ...filters,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    return prisma?.securityEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getAlertsForUser(userId: string, filters: any = {}) {
    const user = await prisma?.user.findUnique({
      where: { id: userId },
      include: { Customer: true },
    });

    const customerId = user?.Customer?.[0]?.id;

    const where: any = {
      ...filters,
    };

    if (customerId) {
      where.incidents = {
        some: {
          customerId,
        },
      };
    }

    return prisma?.alert.findMany({
      where,
      include: {
        rule: true,
        events: true,
        incidents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentsForUser(userId: string, filters: any = {}) {
    const user = await prisma?.user.findUnique({
      where: { id: userId },
      include: { Customer: true },
    });

    const customerId = user?.Customer?.[0]?.id;

    const where: any = {
      ...filters,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    return prisma?.incident.findMany({
      where,
      include: {
        alerts: {
          include: {
            rule: true,
            events: true,
          },
        },
        comments: true,
        assignee: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  async removeDataSource(integrationId: string) {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      clearInterval(integration.interval);
      this.integrations.delete(integrationId);
    }

    await prisma?.dataSourceIntegration.update({
      where: { id: integrationId },
      data: { isActive: false },
    });
  }
    // Method to calculate severity for authentication logs
    private calculateAuthSeverity(log: any): number {
      // Authentication severity levels:
      // 4 - Critical: Multiple failed login attempts from unusual locations
      // 3 - High: Failed login for admin/privileged accounts
      // 2 - Medium: Failed login attempts
      // 1 - Low: Successful logins, account creations
      // 0 - Info: Password changes, logout events
  
      if (log.eventType === 'user.authentication.auth_fail') {
        // Check if this is for a privileged account
        if (log.target && 
            log.target.some((t: any) => 
              t.alternateId && 
              (t.alternateId.includes('admin') || 
               t.type === 'PrivilegedUser' || 
               (t.detailEntry && t.detailEntry.includes('admin')))
            )) {
          return 3; // High severity for admin account failures
        }
        
        // Check for multiple failures
        if (log.debugContext && log.debugContext.debugData && 
            log.debugContext.debugData.failureCount && 
            parseInt(log.debugContext.debugData.failureCount) > 3) {
          return 4; // Critical for multiple failures
        }
        
        return 2; // Medium for normal failed logins
      }
      
      if (log.eventType === 'user.account.lock') {
        return 3; // High severity for account lockouts
      }
      
      if (['user.lifecycle.suspend', 'user.lifecycle.delete'].includes(log.eventType)) {
        return 2; // Medium for account deletion or suspension
      }
      
      if (['user.session.start', 'user.lifecycle.create', 'user.lifecycle.unsuspend'].includes(log.eventType)) {
        return 1; // Low for normal operations
      }
      
      if (['user.session.end', 'user.mfa.factor.update'].includes(log.eventType)) {
        return 0; // Info for routine events
      }
      
      return 1; // Default to low severity
    }
  
    // Method to check domains against threat intelligence sources
    private async checkThreatIntel(domain: string, threatIntelSources: string[]): Promise<{
      maliciousDomains: string[];
      riskScores: { [domain: string]: number };
    }> {
      const results: { 
        maliciousDomains: string[]; 
        riskScores: { [domain: string]: number }
      } = {
        maliciousDomains: [],
        riskScores: {}
      };
  
      try {
        for (const source of threatIntelSources) {
          switch (source.toLowerCase()) {
            case 'virustotal':
              // Implementation for VirusTotal API
              try {
                const { default: axios } = await import('axios');
                const response = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, {
                  headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY || '' }
                });
                
                const data = response.data;
                if (data.data.attributes.last_analysis_stats.malicious > 0) {
                  results.maliciousDomains.push(domain);
                  results.riskScores[domain] = data.data.attributes.last_analysis_stats.malicious;
                }
              } catch (error) {
                logger.error('VirusTotal API error:', error);
              }
              break;
              
            case 'alienvault':
              // Implementation for AlienVault OTX
              try {
                const { default: axios } = await import('axios');
                const response = await axios.get(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}`, {
                  headers: { 'X-OTX-API-KEY': process.env.ALIENVAULT_API_KEY || '' }
                });
                
                const data = response.data;
                if (data.pulse_info.count > 0) {
                  results.maliciousDomains.push(domain);
                  results.riskScores[domain] = data.pulse_info.count;
                }
              } catch (error) {
                logger.error('AlienVault API error:', error);
              }
              break;
              
            case 'threatfox':
              // Implementation for ThreatFox
              try {
                const { default: axios } = await import('axios');
                const response = await axios.post('https://threatfox-api.abuse.ch/api/v1/', {
                  query: 'search_ioc',
                  search_term: domain
                });
                
                const data = response.data;
                if (data.query_status === 'ok' && data.data && data.data.length > 0) {
                  results.maliciousDomains.push(domain);
                  results.riskScores[domain] = data.data.length;
                }
              } catch (error) {
                logger.error('ThreatFox API error:', error);
              }
              break;
              
            default:
              logger.warn(`Unsupported threat intelligence source: ${source}`);
          }
        }
      } catch (error) {
        logger.error('Error checking threat intelligence:', error);
      }
  
      return results;
    }
  
    // Method to map SentinelOne confidence level to severity
    private mapS1Severity(confidenceLevel: string): number {
      switch (confidenceLevel.toLowerCase()) {
        case 'malicious':
          return 4; // Critical
        case 'suspicious':
          return 3; // High
        case 'moderate':
          return 2; // Medium
        case 'low':
          return 1; // Low
        default:
          return 0; // Info
      }
    }
  
    // Method to parse cloud logs
    private parseCloudLog(key: string, content: string): Record<string, any> {
      let parsedLog: Record<string, any> = {};
      
      try {
        // Attempt to parse as JSON first
        parsedLog = JSON.parse(content);
      } catch (e) {
        // If not JSON, attempt other formats
        if (content.includes('<?xml')) {
          // Basic XML parsing logic (in production you'd use a proper XML parser)
          const matches = content.match(/<([^>]+)>([^<]+)<\/[^>]+>/g);
          if (matches) {
            parsedLog = matches.reduce((acc: Record<string, any>, match) => {
              const [, key, value] = match.match(/<([^>]+)>([^<]+)<\/[^>]+>/) || [];
              if (key && value) {
                acc[key] = value;
              }
              return acc;
            }, {});
          }
        } else if (content.includes('=') || content.includes(',')) {
          // Handle CSV or key=value formats
          if (content.includes(',')) {
            const lines = content.split('\n');
            if (lines.length > 1) {
              const headers = lines[0].split(',');
              const values = lines[1].split(',');
              headers.forEach((header, i) => {
                parsedLog[header.trim()] = values[i] ? values[i].trim() : null;
              });
            }
          } else {
            content.split('\n').forEach(line => {
              const [key, value] = line.split('=');
              if (key && value) {
                parsedLog[key.trim()] = value.trim();
              }
            });
          }
        }
      }
      
      return parsedLog;
    }
  
    // Method to detect anomalies in cloud logs
    private detectAnomaly(parsedLog: any): string {
      // This is a simplified implementation
      // In real world, you'd use more sophisticated anomaly detection
      
      // Check for common security events
      if (parsedLog.eventName && [
        'ConsoleLogin', 'AssumeRole', 'DeleteTrail', 'StopLogging',
        'DeleteGroupPolicy', 'DeleteRolePolicy', 'DeleteUserPolicy',
        'CreateAccessKey', 'PutUserPolicy', 'CreateLoginProfile',
        'UpdateLoginProfile'
      ].includes(parsedLog.eventName)) {
        return 'SECURITY_EVENT';
      }
      
      // Check for unauthorized access
      if (parsedLog.errorCode && 
          ['AccessDenied', 'UnauthorizedOperation'].includes(parsedLog.errorCode)) {
        return 'UNAUTHORIZED_ACCESS';
      }
      
      // Data exfiltration checks
      if (parsedLog.bucketName && parsedLog.eventName && 
          ['GetObject', 'SelectObjectContent'].includes(parsedLog.eventName) &&
          parsedLog.userAgent && !parsedLog.userAgent.includes('console.amazonaws.com')) {
        return 'POTENTIAL_DATA_EXFILTRATION';
      }
      
      // Check for suspicious IPs
      if (parsedLog.sourceIPAddress && 
          !['internal', 'amazonaws.com'].some(domain => parsedLog.sourceIPAddress.includes(domain))) {
        return 'SUSPICIOUS_IP_ACCESS';
      }
      
      return 'NORMAL_ACTIVITY';
    }
  
    // Method to calculate severity for cloud storage events
    private calculateCloudEventSeverity(object: any, parsedLog: any): number {
      // Check for known security events
      if (parsedLog.eventName && [
        'DeleteTrail', 'StopLogging',
        'DeleteGroupPolicy', 'DeleteRolePolicy', 'DeleteUserPolicy'
      ].includes(parsedLog.eventName)) {
        return 4; // Critical
      }
      
      if (parsedLog.eventName && [
        'ConsoleLogin', 'AssumeRole', 'CreateAccessKey', 
        'PutUserPolicy', 'CreateLoginProfile', 'UpdateLoginProfile'
      ].includes(parsedLog.eventName)) {
        return 3; // High
      }
      
      if (parsedLog.errorCode && 
          ['AccessDenied', 'UnauthorizedOperation'].includes(parsedLog.errorCode)) {
        return 3; // High
      }
      
      // Check specific file types that might contain sensitive data
      const key = object.Key.toLowerCase();
      if (key.includes('password') || 
          key.includes('secret') || 
          key.includes('credential') || 
          key.includes('key.pem') ||
          key.includes('.pfx') ||
          key.includes('.p12')) {
        return 3; // High
      }
      
      // Check for potential data exfiltration
      if (parsedLog.eventName && 
          ['GetObject', 'SelectObjectContent'].includes(parsedLog.eventName) &&
          parsedLog.userAgent && !parsedLog.userAgent.includes('console.amazonaws.com')) {
        return 2; // Medium
      }
      
      return 1; // Low - default severity
    }
  
    // Helper method to convert stream to string
    private async streamToString(stream: any): Promise<string> {
      return new Promise((resolve, reject) => {
        if (!stream) {
          resolve('');
          return;
        }
        
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    }

//   // Add this to your IntegrationService class
// async pollDataSource(integration: any) {
//   try {
//     const events = await this.fetchEventsFromSource({
//       type: integration.type,
//       credentials: integration.config,
//       pollingInterval: integration.pollingInterval,
//       customerId: integration.customerId || undefined,
//     });

//     for (const event of events) {
//       this.eventEmitter.emit('new_event', {
//         ...event,
//         source: integration.type,
//         customerId: integration.customerId || null,
//       });
//     }
//   } catch (error) {
//     logger.error(`Error polling data source ${integration.id}:`, error);
//     throw error;
//   }
// }

}

export const integrationService = new IntegrationService();