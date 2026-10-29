import {
    namespaceName,
    frontendServiceName,
    redisLeaderServiceName,
    redisReplicaServiceName,
} from "./guestbook";

import {
    monitoringNamespaceName,
    grafanaUrl,
    grafanaNodePort,
    grafanaAdminUser,
    grafanaAdminPassword,
    prometheusReleaseName,
} from "./monitoring";

// -----------------------------------------------------------------------------
// Guestbook outputs
// -----------------------------------------------------------------------------

export const guestbookNamespace =
    namespaceName;

export const guestbookFrontendService =
    frontendServiceName;

export const guestbookRedisLeaderService =
    redisLeaderServiceName;

export const guestbookRedisReplicaService =
    redisReplicaServiceName;

// -----------------------------------------------------------------------------
// Monitoring outputs
// -----------------------------------------------------------------------------

export const monitoringNamespace =
    monitoringNamespaceName;

export const prometheusHelmRelease =
    prometheusReleaseName;

export const grafanaAccessUrl =
    grafanaUrl;

export const grafanaPort =
    grafanaNodePort;

export const grafanaUsername =
    grafanaAdminUser;

/**
 * Pulumi automatically treats this output as a secret.
 *
 * To intentionally display it:
 *
 *   pulumi stack output grafanaPassword --show-secrets
 */
export const grafanaPassword =
    grafanaAdminPassword;