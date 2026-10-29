import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

import {
    namespaceName,
    frontendService,
    redisLeaderService,
    redisReplicaService,
} from "./guestbook";

/**
 * Monitoring stack for the Kubernetes Guestbook application.
 *
 * Architecture:
 *
 * Redis Leader / Replicas
 *          |
 *    redis_exporter
 *          |
 *     ServiceMonitor
 *          |
 *      Prometheus
 *          |
 *        Grafana
 *
 * Guestbook Frontend
 *          |
 *   Blackbox Exporter
 *          |
 *     ServiceMonitor
 *          |
 *      Prometheus
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const grafanaPort = 30300;

const prometheusRepository =
    "https://prometheus-community.github.io/helm-charts";

// -----------------------------------------------------------------------------
// Monitoring Namespace
// -----------------------------------------------------------------------------

export const monitoringNamespace =
    new k8s.core.v1.Namespace(
        "monitoring-namespace",
        {
            metadata: {
                name: "monitoring",

                labels: {
                    "app.kubernetes.io/part-of":
                        "guestbook-monitoring",
                },
            },
        },
    );

// -----------------------------------------------------------------------------
// Grafana Administrator Password
//
// Generated dynamically by Pulumi.
// No password is stored in GitHub.
// -----------------------------------------------------------------------------

const grafanaPassword =
    new random.RandomPassword(
        "grafana-admin-password",
        {
            length: 20,
            special: true,
            overrideSpecial: "_%@-",
        },
    );

// -----------------------------------------------------------------------------
// kube-prometheus-stack
//
// Installs:
// - Prometheus Operator
// - Prometheus
// - Grafana
// - kube-state-metrics
// - node-exporter
// -----------------------------------------------------------------------------

export const monitoringStack =
    new k8s.helm.v3.Release(
        "kube-prometheus-stack",
        {
            name: "monitoring",

            chart: "kube-prometheus-stack",

            version: "92.14.1",

            namespace:
                monitoringNamespace.metadata.name,

            repositoryOpts: {
                repo: prometheusRepository,
            },

            values: {
                // -------------------------------------------------------------
                // Grafana
                // -------------------------------------------------------------

                grafana: {
                    enabled: true,

                    adminUser: "admin",

                    adminPassword:
                        grafanaPassword.result,

                    service: {
                        type: "NodePort",

                        nodePort:
                            grafanaPort,
                    },

                    defaultDashboardsEnabled:
                        true,
                },

                // -------------------------------------------------------------
                // Prometheus
                // -------------------------------------------------------------

                prometheus: {
                    prometheusSpec: {
                        /**
                         * These settings allow Prometheus to discover
                         * ServiceMonitor resources outside the monitoring
                         * namespace.
                         *
                         * Our Redis ServiceMonitors live in the guestbook
                         * namespace.
                         */

                        serviceMonitorSelectorNilUsesHelmValues:
                            false,

                        serviceMonitorSelector:
                            {},

                        serviceMonitorNamespaceSelector:
                            {},

                        podMonitorSelectorNilUsesHelmValues:
                            false,

                        podMonitorSelector:
                            {},

                        podMonitorNamespaceSelector:
                            {},

                        retention:
                            "2d",
                    },
                },

                // -------------------------------------------------------------
                // Kubernetes Metrics
                // -------------------------------------------------------------

                kubeStateMetrics: {
                    enabled: true,
                },

                nodeExporter: {
                    enabled: true,
                },

                // -------------------------------------------------------------
                // Alertmanager
                //
                // Not required by the coding exercise.
                // -------------------------------------------------------------

                alertmanager: {
                    enabled: false,
                },

                // -------------------------------------------------------------
                // Local cluster cleanup
                //
                // Docker Desktop does not expose every control-plane component
                // the same way a managed production cluster does.
                //
                // Disabling these prevents irrelevant DOWN targets.
                // -------------------------------------------------------------

                kubeControllerManager: {
                    enabled: false,
                },

                kubeScheduler: {
                    enabled: false,
                },

                kubeEtcd: {
                    enabled: false,
                },

                kubeProxy: {
                    enabled: false,
                },
            },

            timeout: 600,

            skipAwait: false,
        },
        {
            dependsOn: [
                monitoringNamespace,
            ],
        },
    );

// -----------------------------------------------------------------------------
// Redis Leader ServiceMonitor
//
// Prometheus will discover the Redis leader Service and scrape:
//
//     http://<redis-leader-pod>:9121/metrics
//
// The metrics come from the redis_exporter sidecar.
// -----------------------------------------------------------------------------

export const redisLeaderServiceMonitor =
    new k8s.apiextensions.CustomResource(
        "redis-leader-servicemonitor",
        {
            apiVersion:
                "monitoring.coreos.com/v1",

            kind:
                "ServiceMonitor",

            metadata: {
                name:
                    "redis-leader",

                namespace:
                    namespaceName,

                labels: {
                    "app.kubernetes.io/part-of":
                        "guestbook-monitoring",
                },
            },

            spec: {
                selector: {
                    matchLabels: {
                        app: "redis",
                        role: "leader",
                        tier: "backend",
                    },
                },

                endpoints: [
                    {
                        port:
                            "metrics",

                        path:
                            "/metrics",

                        interval:
                            "15s",

                        scrapeTimeout:
                            "10s",
                    },
                ],
            },
        },
        {
            dependsOn: [
                monitoringStack,
                redisLeaderService,
            ],
        },
    );

// -----------------------------------------------------------------------------
// Redis Replica ServiceMonitor
//
// The redis-replica Service selects both replica pods.
//
// Prometheus therefore receives metrics from both replica exporters.
// -----------------------------------------------------------------------------

export const redisReplicaServiceMonitor =
    new k8s.apiextensions.CustomResource(
        "redis-replica-servicemonitor",
        {
            apiVersion:
                "monitoring.coreos.com/v1",

            kind:
                "ServiceMonitor",

            metadata: {
                name:
                    "redis-replica",

                namespace:
                    namespaceName,

                labels: {
                    "app.kubernetes.io/part-of":
                        "guestbook-monitoring",
                },
            },

            spec: {
                selector: {
                    matchLabels: {
                        app: "redis",
                        role: "replica",
                        tier: "backend",
                    },
                },

                endpoints: [
                    {
                        port:
                            "metrics",

                        path:
                            "/metrics",

                        interval:
                            "15s",

                        scrapeTimeout:
                            "10s",
                    },
                ],
            },
        },
        {
            dependsOn: [
                monitoringStack,
                redisReplicaService,
            ],
        },
    );

// -----------------------------------------------------------------------------
// Prometheus Blackbox Exporter
//
// The Guestbook PHP frontend does NOT expose native Prometheus metrics.
//
// Blackbox Exporter therefore probes the real frontend Service over HTTP.
//
// This provides metrics such as:
//
// probe_success
// probe_duration_seconds
// probe_http_status_code
// probe_dns_lookup_time_seconds
// probe_http_duration_seconds
// -----------------------------------------------------------------------------

export const blackboxExporter =
    new k8s.helm.v3.Release(
        "blackbox-exporter",
        {
            name:
                "blackbox",

            chart:
                "prometheus-blackbox-exporter",

            version:
                "11.18.0",

            namespace:
                monitoringNamespace.metadata.name,

            repositoryOpts: {
                repo:
                    prometheusRepository,
            },

            values: {
                serviceMonitor: {
                    enabled: true,

                    defaults: {
                        interval:
                            "15s",

                        scrapeTimeout:
                            "10s",

                        module:
                            "http_2xx",
                    },

                    targets: [
                        {
                            name:
                                "guestbook-frontend",

                            url:
                                "http://frontend.guestbook.svc.cluster.local/",

                            module:
                                "http_2xx",

                            interval:
                                "15s",

                            scrapeTimeout:
                                "10s",

                            /**
                             * These become labels on the resulting
                             * Prometheus metrics.
                             *
                             * This allows queries such as:
                             *
                             * probe_success{app="guestbook"}
                             */
                            additionalMetricsRelabels: {
                                app:
                                    "guestbook",

                                component:
                                    "frontend",
                            },
                        },
                    ],
                },
            },

            timeout:
                300,

            skipAwait:
                false,
        },
        {
            dependsOn: [
                monitoringStack,
                frontendService,
            ],
        },
    );

// -----------------------------------------------------------------------------
// Stack Outputs
// -----------------------------------------------------------------------------

export const monitoringNamespaceName =
    monitoringNamespace.metadata.name;

export const grafanaAdminUser =
    "admin";

/**
 * Pulumi secret output.
 *
 * Normal:
 *
 *   pulumi stack output grafanaPassword
 *
 * displays:
 *
 *   [secret]
 *
 * To intentionally retrieve it:
 *
 *   pulumi stack output grafanaPassword --show-secrets
 */
export const grafanaAdminPassword =
    pulumi.secret(
        grafanaPassword.result,
    );

export const grafanaNodePort =
    grafanaPort;

/**
 * Docker Desktop Kubernetes exposes NodePort services through localhost.
 */
export const grafanaUrl =
    pulumi.output(
        `http://localhost:${grafanaPort}`,
    );

export const prometheusReleaseName =
    monitoringStack.name;

export const blackboxReleaseName =
    blackboxExporter.name;

// -----------------------------------------------------------------------------
// Prometheus Verification Queries
// -----------------------------------------------------------------------------

export const redisUpQuery =
    "redis_up";

export const frontendProbeQuery =
    'probe_success{app="guestbook"}';

export const frontendLatencyQuery =
    'probe_duration_seconds{app="guestbook"}';