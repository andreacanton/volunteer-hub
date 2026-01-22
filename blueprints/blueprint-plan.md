# Plan Blueprint Template

## 0. Overview
**Feature Name:** [Brief descriptive name]
**Priority:** [High / Medium / Low]
**Date:** [creation date]

## 1. Context & goals

### Problem statement

    1. ...

### Primary Goals
    1. ...

## 2. Scope & Non-Goals

### In Scope
    1...

### Out of scope
    1...

## 3. Requirements & Acceptance Criteria

### Functional requirements

    1. ... (example: order creation)
    2. ... (example: order cancellation)

### Non-Functional requirements

    1. ... (example: Code quality or style)
    2. ... (example: API standards)

## 4. Assumption & Open Questions

### Assumptions
    1. ...

### Blockers / Open Questions
    1. ... (mark blockers clearly)

## 5. Architecture & Integration

    1. Affected components/layers: ...
    2. Pattern to follow based on workspace convetions...
    3. External integrations...

## 6. Data Model / Contracts

### Models & Enum

**Model**:    
    - field
    - field

### API Contracts
    1. endpoints, verbs, payloads

### Validation Rules
    - ...

### Status Transition (if applicable)
    - ...

## 7. Error Handling & Observability

    1. error strategy ...
    2. logging / metrics / tracing notes
    3. (optional) Table format: 
        - Exception | HTTP | Response | Logging

## 8. Risk Edge cases

    1. Risk ...
    2. Edge cases ...

## 9. Implementation Plan (Phased)

### Phase 1: Title (Objective: ...)
    - Step 1.1: action (File: ...; Depends on: ...; Done wen: ...)
    - Step 1.2: ...

### Phase 2: Title (Objective: ...)
    - Step 2.1: ...
    - Step 2.2: ...
    - Step 2.3: ...

(Keep step concise, each with dependency + done-when. Add more phases if needed)

## 10. Testing Strategy

### Unit Tests
    1. ....

### Integration/API Tests

### Negative/Error Cases

### Fixtures/Data

## 11. Rollout / Mitigation / Compatibility
    1. Mitigation steps (if any)
    2. Backward compatibility
    3. Feature flags / toggles
    4. Deployment configurations

## 12. Checklist Before Handoff to TODO

    1. Open Questions? (yes/no; list if no)
    2. Dependencies caputured per step? (yes/no)
    3. Acceptance criteria alined with test? (yes/no)

## Appendix: Key Design Decision (Optional)

    1. Decision: ... (Rationale: ...)
