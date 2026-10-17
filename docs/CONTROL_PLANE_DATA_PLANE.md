# Control Plane / Data Plane Contract

## Control plane

Dynamic policies, configuration, provider/model registry, agent capabilities/leases, approvals, operational state and feature flags live here.

## Data plane

Users, creators, content, reading, AI/media execution, payments, ads, search and notifications live here.

## Rule

The control plane governs the data plane. Normal user traffic must not depend on the Admin UI. Policy changes propagate through the Dynamic Configuration Service and Policy Engine.

Infrastructure configuration remains deployment-managed and is not treated as hot business configuration.
