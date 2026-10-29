import * as k8s from "@pulumi/kubernetes";

import {
    monitoringNamespace,
    monitoringStack,
} from "./monitoring";

/**
 * Automatically provisioned Grafana dashboard.
 *
 * Grafana's dashboard sidecar watches ConfigMaps with:
 *
 *     grafana_dashboard: "1"
 *
 * and automatically imports the JSON dashboard.
 */

const dashboard = {
    annotations: {
        list: [],
    },

    editable: true,

    graphTooltip: 0,

    links: [],

    panels: [
        // ---------------------------------------------------------------------
        // Guestbook Frontend Availability
        // ---------------------------------------------------------------------
        {
            id: 1,

            title: "Guestbook Frontend Availability",

            type: "stat",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr: 'probe_success{app="guestbook"}',

                    legendFormat: "Frontend",
                },
            ],

            fieldConfig: {
                defaults: {
                    min: 0,
                    max: 1,

                    mappings: [
                        {
                            type: "value",

                            options: {
                                "0": {
                                    text: "DOWN",
                                },

                                "1": {
                                    text: "UP",
                                },
                            },
                        },
                    ],

                    thresholds: {
                        mode: "absolute",

                        steps: [
                            {
                                value: null,
                            },

                            {
                                value: 1,
                            },
                        ],
                    },
                },

                overrides: [],
            },

            gridPos: {
                h: 8,
                w: 6,
                x: 0,
                y: 0,
            },
        },

        // ---------------------------------------------------------------------
        // Frontend Latency
        // ---------------------------------------------------------------------
        {
            id: 2,

            title: "Guestbook Frontend Probe Latency",

            type: "timeseries",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr:
                        'probe_duration_seconds{app="guestbook"}',

                    legendFormat:
                        "Frontend latency",
                },
            ],

            fieldConfig: {
                defaults: {
                    unit: "s",
                },

                overrides: [],
            },

            gridPos: {
                h: 8,
                w: 10,
                x: 6,
                y: 0,
            },
        },

        // ---------------------------------------------------------------------
        // Redis Availability
        // ---------------------------------------------------------------------
        {
            id: 3,

            title: "Redis Availability",

            type: "timeseries",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr:
                        "redis_up",

                    legendFormat:
                        "{{service}} / {{pod}}",
                },
            ],

            fieldConfig: {
                defaults: {
                    min: 0,
                    max: 1,
                },

                overrides: [],
            },

            gridPos: {
                h: 8,
                w: 8,
                x: 16,
                y: 0,
            },
        },

        // ---------------------------------------------------------------------
        // Redis Connected Clients
        // ---------------------------------------------------------------------
        {
            id: 4,

            title: "Redis Connected Clients",

            type: "timeseries",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr:
                        "redis_connected_clients",

                    legendFormat:
                        "{{service}} / {{pod}}",
                },
            ],

            gridPos: {
                h: 8,
                w: 12,
                x: 0,
                y: 8,
            },
        },

        // ---------------------------------------------------------------------
        // Redis Memory Usage
        // ---------------------------------------------------------------------
        {
            id: 5,

            title: "Redis Memory Usage",

            type: "timeseries",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr:
                        "redis_memory_used_bytes",

                    legendFormat:
                        "{{service}} / {{pod}}",
                },
            ],

            fieldConfig: {
                defaults: {
                    unit: "bytes",
                },

                overrides: [],
            },

            gridPos: {
                h: 8,
                w: 12,
                x: 12,
                y: 8,
            },
        },

        // ---------------------------------------------------------------------
        // Redis Commands Processed
        // ---------------------------------------------------------------------
        {
            id: 6,

            title: "Redis Command Rate",

            type: "timeseries",

            datasource: {
                type: "prometheus",
                uid: "prometheus",
            },

            targets: [
                {
                    refId: "A",

                    expr:
                        "rate(redis_commands_processed_total[5m])",

                    legendFormat:
                        "{{service}} / {{pod}}",
                },
            ],

            fieldConfig: {
                defaults: {
                    unit: "ops",
                },

                overrides: [],
            },

            gridPos: {
                h: 8,
                w: 24,
                x: 0,
                y: 16,
            },
        },
    ],

    refresh: "10s",

    schemaVersion: 39,

    tags: [
        "guestbook",
        "prometheus",
        "pulumi",
        "kubernetes",
    ],

    templating: {
        list: [],
    },

    time: {
        from: "now-15m",
        to: "now",
    },

    timezone: "browser",

    title:
        "Guestbook Application Monitoring",

    uid:
        "guestbook-monitoring",

    version: 1,
};

// -----------------------------------------------------------------------------
// Grafana Dashboard ConfigMap
// -----------------------------------------------------------------------------

export const guestbookDashboard =
    new k8s.core.v1.ConfigMap(
        "guestbook-grafana-dashboard",
        {
            metadata: {
                name:
                    "guestbook-grafana-dashboard",

                namespace:
                    monitoringNamespace.metadata.name,

                labels: {
                    grafana_dashboard:
                        "1",

                    "app.kubernetes.io/part-of":
                        "guestbook-monitoring",
                },
            },

            data: {
                "guestbook-dashboard.json":
                    JSON.stringify(
                        dashboard,
                        null,
                        2,
                    ),
            },
        },
        {
            dependsOn: [
                monitoringStack,
            ],
        },
    );