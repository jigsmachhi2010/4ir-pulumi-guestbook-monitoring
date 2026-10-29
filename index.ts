import {
    namespaceName,
    frontendService,
    frontendServiceName,
    redisLeaderServiceName,
    redisReplicaServiceName,
} from "./guestbook";

/**
 * Stack outputs.
 *
 * More outputs will be added when Prometheus and Grafana
 * are introduced.
 */

export const guestbookNamespace = namespaceName;

export const guestbookFrontendService =
    frontendServiceName;

export const redisLeaderService =
    redisLeaderServiceName;

export const redisReplicaService =
    redisReplicaServiceName;

export const guestbookServiceType =
    frontendService.spec.type;