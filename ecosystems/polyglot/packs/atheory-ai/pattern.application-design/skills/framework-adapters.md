---
name: "Keep hooks at the framework boundary"
description: "Use when exposing owned state and capabilities through React hooks or native observation adapters without duplicating domain behavior."
topics: ["application-design", "framework-adapters"]
tags: ["app-builder", "contracts", "adapters"]
---

# Keep hooks at the framework boundary

Hooks and equivalent framework mechanisms adapt application contracts to component lifecycles and rendering. Domain operations and interaction policies have explicit owners outside that adapter. A framework-specific adapter is optional when direct dependency injection already fits the platform.

An adapter exposes state snapshots, commands, and relevant capability access. It handles subscription cleanup and rendering updates. It does not create a separate selection store, duplicate validation rules, or translate every ordinary function call into an event.

Simple view-only behavior can stay local to its view. Shared contracts are useful when several features need consistent behavior or independently testable operations; creating a service and event for every local toggle adds indirection without supplying that benefit.

## Example

A React `useSelection()` hook reads the selection model and unsubscribes when its component unmounts. An inspector and canvas observe the same selected IDs. A native view uses its platform's observation mechanism against the same contract responsibilities; it need not imitate React hooks.

## Verify

Mounting a second view does not create another domain state owner. Unmounted views stop receiving updates. Command behavior can be tested without mounting a component. Framework examples label their assumptions instead of making one framework mandatory for the entire application design pack.
