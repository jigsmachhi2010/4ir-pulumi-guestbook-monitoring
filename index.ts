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
    blackboxReleaseName,
    redisUpQuery,
    frontendProbeQuery,
    frontendLatencyQuery,
} from "./monitoring";

// -----------------------------------------------------------------------------
// Guestbook Outputs
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
// Monitoring Outputs
// -----------------------------------------------------------------------------

export const monitoringNamespace =
    monitoringNamespaceName;

export const prometheusHelmRelease =
    prometheusReleaseName;

export const blackboxHelmRelease =
    blackboxReleaseName;

// -----------------------------------------------------------------------------
// Grafana Access
// -----------------------------------------------------------------------------

export const grafanaAccessUrl =
    grafanaUrl;

export const grafanaPort =
    grafanaNodePort;

export const grafanaUsername =
    grafanaAdminUser;

/**
 * This output remains encrypted by Pulumi.
 *
 * Retrieve intentionally with:
 *
 * pulumi stack output grafanaPassword --show-secrets
 */
export const grafanaPassword =
    grafanaAdminPassword;

// -----------------------------------------------------------------------------
// Prometheus Verification Queries
// -----------------------------------------------------------------------------

export const redisMetricsQuery =
    redisUpQuery;

export const frontendAvailabilityQuery =
    frontendProbeQuery;

export const frontendLatencyMetricsQuery =
    frontendLatencyQuery;