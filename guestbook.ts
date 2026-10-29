import * as k8s from "@pulumi/kubernetes";

/**
 * Kubernetes Guestbook application.
 *
 * Architecture:
 *
 * Frontend (3 replicas)
 *       |
 *       +----> Redis Leader
 *       |
 *       +----> Redis Replicas
 *
 * The resource labels are intentionally consistent because the monitoring
 * layer will use them later for Prometheus/Grafana observability.
 */

// -----------------------------------------------------------------------------
// Namespace
// -----------------------------------------------------------------------------

export const guestbookNamespace = new k8s.core.v1.Namespace(
    "guestbook-namespace",
    {
        metadata: {
            name: "guestbook",
            labels: {
                "app.kubernetes.io/part-of": "guestbook",
            },
        },
    },
);

// -----------------------------------------------------------------------------
// Redis Leader
// -----------------------------------------------------------------------------

const redisLeaderLabels = {
    app: "redis",
    role: "leader",
    tier: "backend",
};

export const redisLeaderDeployment = new k8s.apps.v1.Deployment(
    "redis-leader",
    {
        metadata: {
            name: "redis-leader",
            namespace: guestbookNamespace.metadata.name,
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: redisLeaderLabels,
            },
            template: {
                metadata: {
                    labels: redisLeaderLabels,
                },
                spec: {
                    containers: [
                        {
                            name: "redis-leader",
                            image: "redis:7-alpine",
                            ports: [
                                {
                                    name: "redis",
                                    containerPort: 6379,
                                },
                            ],
                            resources: {
                                requests: {
                                    cpu: "100m",
                                    memory: "100Mi",
                                },
                                limits: {
                                    cpu: "250m",
                                    memory: "256Mi",
                                },
                            },
                            readinessProbe: {
                                tcpSocket: {
                                    port: "redis",
                                },
                                initialDelaySeconds: 5,
                                periodSeconds: 5,
                            },
                            livenessProbe: {
                                tcpSocket: {
                                    port: "redis",
                                },
                                initialDelaySeconds: 10,
                                periodSeconds: 10,
                            },
                        },
                    ],
                },
            },
        },
    },
);

export const redisLeaderService = new k8s.core.v1.Service(
    "redis-leader-service",
    {
        metadata: {
            name: "redis-leader",
            namespace: guestbookNamespace.metadata.name,
            labels: redisLeaderLabels,
        },
        spec: {
            selector: redisLeaderLabels,
            ports: [
                {
                    name: "redis",
                    port: 6379,
                    targetPort: "redis",
                },
            ],
        },
    },
);

// -----------------------------------------------------------------------------
// Redis Replicas
// -----------------------------------------------------------------------------

const redisReplicaLabels = {
    app: "redis",
    role: "replica",
    tier: "backend",
};

export const redisReplicaDeployment = new k8s.apps.v1.Deployment(
    "redis-replica",
    {
        metadata: {
            name: "redis-replica",
            namespace: guestbookNamespace.metadata.name,
        },
        spec: {
            replicas: 2,
            selector: {
                matchLabels: redisReplicaLabels,
            },
            template: {
                metadata: {
                    labels: redisReplicaLabels,
                },
                spec: {
                    containers: [
                        {
                            name: "redis-replica",
                            image: "pulumi/guestbook-redis-replica",
                            ports: [
                                {
                                    name: "redis",
                                    containerPort: 6379,
                                },
                            ],
                            resources: {
                                requests: {
                                    cpu: "100m",
                                    memory: "100Mi",
                                },
                                limits: {
                                    cpu: "250m",
                                    memory: "256Mi",
                                },
                            },
                            readinessProbe: {
                                tcpSocket: {
                                    port: "redis",
                                },
                                initialDelaySeconds: 5,
                                periodSeconds: 5,
                            },
                            livenessProbe: {
                                tcpSocket: {
                                    port: "redis",
                                },
                                initialDelaySeconds: 10,
                                periodSeconds: 10,
                            },
                        },
                    ],
                },
            },
        },
    },
    {
        dependsOn: [redisLeaderService],
    },
);

export const redisReplicaService = new k8s.core.v1.Service(
    "redis-replica-service",
    {
        metadata: {
            name: "redis-replica",
            namespace: guestbookNamespace.metadata.name,
            labels: redisReplicaLabels,
        },
        spec: {
            selector: redisReplicaLabels,
            ports: [
                {
                    name: "redis",
                    port: 6379,
                    targetPort: "redis",
                },
            ],
        },
    },
);

// -----------------------------------------------------------------------------
// Guestbook Frontend
// -----------------------------------------------------------------------------

const frontendLabels = {
    app: "guestbook",
    tier: "frontend",
};

export const frontendDeployment = new k8s.apps.v1.Deployment(
    "frontend",
    {
        metadata: {
            name: "frontend",
            namespace: guestbookNamespace.metadata.name,
        },
        spec: {
            replicas: 3,
            selector: {
                matchLabels: frontendLabels,
            },
            template: {
                metadata: {
                    labels: frontendLabels,
                },
                spec: {
                    containers: [
                        {
                            name: "frontend",
                            image: "pulumi/guestbook-php-redis",
                            ports: [
                                {
                                    name: "http",
                                    containerPort: 80,
                                },
                            ],
                            resources: {
                                requests: {
                                    cpu: "100m",
                                    memory: "100Mi",
                                },
                                limits: {
                                    cpu: "250m",
                                    memory: "256Mi",
                                },
                            },
                            readinessProbe: {
                                httpGet: {
                                    path: "/",
                                    port: "http",
                                },
                                initialDelaySeconds: 5,
                                periodSeconds: 5,
                            },
                            livenessProbe: {
                                httpGet: {
                                    path: "/",
                                    port: "http",
                                },
                                initialDelaySeconds: 10,
                                periodSeconds: 10,
                            },
                        },
                    ],
                },
            },
        },
    },
    {
        dependsOn: [
            redisLeaderService,
            redisReplicaService,
        ],
    },
);

export const frontendService = new k8s.core.v1.Service(
    "frontend-service",
    {
        metadata: {
            name: "frontend",
            namespace: guestbookNamespace.metadata.name,
            labels: frontendLabels,
        },
        spec: {
            type: "LoadBalancer",
            selector: frontendLabels,
            ports: [
                {
                    name: "http",
                    port: 80,
                    targetPort: "http",
                },
            ],
        },
    },
);

// -----------------------------------------------------------------------------
// Values required later by monitoring.ts
// -----------------------------------------------------------------------------

export const namespaceName = guestbookNamespace.metadata.name;

export const frontendServiceName =
    frontendService.metadata.name;

export const redisLeaderServiceName =
    redisLeaderService.metadata.name;

export const redisReplicaServiceName =
    redisReplicaService.metadata.name;