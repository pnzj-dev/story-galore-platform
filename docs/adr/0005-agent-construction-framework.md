# ADR-0005: Agent Construction Framework

## Status
Accepted

## Context
StoryGalore is a multi-agent implementation with shared contracts, security-sensitive domains, and many cross-cutting UI/API/workflow dependencies.

## Decision
Use task contracts, explicit ownership, a contract registry, machine-readable Definition of Done, bounded build loops, impact analysis, migration safety rules, and structured handoffs.

## Consequences
Agents have smaller context windows and clearer boundaries, but cross-domain work requires explicit coordination and review. The framework becomes part of the V1 release gate.
