# Pulumi Kubernetes Guestbook Monitoring

This project extends the official [Pulumi Kubernetes TypeScript Guestbook example](https://github.com/pulumi/examples/tree/master/kubernetes-ts-guestbook) by adding application monitoring with **Prometheus and Grafana**.

The original Guestbook architecture—frontend, Redis leader, and Redis replicas—is preserved while the project is organized into separate application, monitoring, and dashboard modules for maintainability.

The complete environment is deployed declaratively using **Pulumi TypeScript**.

## Architecture

```text
                              Pulumi
                                |
                +---------------+---------------+
                |                               |
        Guestbook Namespace             Monitoring Namespace
                |                               |
        +-------+-------+               kube-prometheus-stack
        |               |                       |
     Frontend          Redis              +-----+------+
     3 replicas    Leader + Replicas      |            |
        |               |              Prometheus    Grafana
        |               |                  |
        |        redis_exporter             |
        |             :9121                 |
        |               |                   |
        |        ServiceMonitor ------------+
        |
        +-------- Blackbox Exporter
                       |
                  HTTP probes
                       |
                  ServiceMonitor
                       |
                   Prometheus
```

## What This Project Adds

The Pulumi Guestbook example is extended with:

- Prometheus
- Grafana
- Prometheus Operator
- Redis Exporter
- Prometheus Blackbox Exporter
- kube-state-metrics
- Kubernetes `ServiceMonitor` resources
- Secure Grafana credential generation
- Automatically provisioned Grafana dashboard
- Application health and latency monitoring
- Container health probes and resource limits

## Project Structure

```text
.
├── Pulumi.yaml
├── README.md
├── dashboard.ts
├── guestbook.ts
├── index.ts
├── monitoring.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── screenshots/
    └── grafana-dashboard.png
```

### `guestbook.ts`

Defines the Guestbook application:

- Guestbook namespace
- Redis leader
- Redis replicas
- Frontend replicas
- Kubernetes Services
- Redis Exporter sidecars
- Readiness and liveness probes
- Resource requests and limits

### `monitoring.ts`

Defines the observability stack:

- Prometheus
- Grafana
- Prometheus Operator
- kube-state-metrics
- Blackbox Exporter
- Redis `ServiceMonitor` resources
- Cross-namespace ServiceMonitor discovery
- Grafana access configuration
- Secure Grafana password generation

### `dashboard.ts`

Defines an automatically provisioned Grafana dashboard containing application and Redis health metrics.

### `index.ts`

Exports useful deployment information such as:

- Guestbook namespace
- Monitoring namespace
- Grafana URL
- Grafana username
- Grafana password
- Prometheus verification queries

## Design Decisions

### Redis Monitoring

Redis does not expose Prometheus metrics directly.

A `redis_exporter` sidecar is therefore deployed alongside each Redis container.

```text
Redis
  |
redis_exporter :9121
  |
Service
  |
ServiceMonitor
  |
Prometheus
```

This provides metrics including:

```promql
redis_up
redis_connected_clients
redis_memory_used_bytes
redis_commands_processed_total
redis_keyspace_hits_total
redis_keyspace