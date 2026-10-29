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

import {
    guestbookDashboard,
} from "./dashboard";

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
// Grafana
// -----------------------------------------------------------------------------

export const grafanaAccessUrl =
    grafanaUrl;

export const grafanaPort =
    grafanaNodePort;

export const grafanaUsername =
    grafanaAdminUser;

export const grafanaPassword =
    grafanaAdminPassword;

export const grafanaDashboard =
    guestbookDashboard.metadata.name;

// -----------------------------------------------------------------------------
// Prometheus Verification Queries
// -----------------------------------------------------------------------------

export const redisMetricsQuery =
    redisUpQuery;

export const frontendAvailabilityQuery =
    frontendProbeQuery;

export const frontendLatencyMetricsQuery =
    frontendLatencyQuery;