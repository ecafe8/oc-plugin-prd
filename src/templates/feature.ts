import { FEATURE_FILE_NAMES } from "@/utils/constants";

export const featureTemplates = {
  [FEATURE_FILE_NAMES.index]: `# Feature Summary

## Identity

- ID: 
- Title: 
- Status: 

## Documents

- Foundation: ./01-foundation.md
- Product: ./02-product.md
- UI/UX: ./03-ui-ux.md
- Technical: ./04-technical.md
- Plan: ./05-plan.md

## Dependencies / Blockers

- 
`,
  [FEATURE_FILE_NAMES.foundation]: `# Foundation

## Terms

- 

## Actors / Permissions

- 

## Scope Boundaries

- 

## Assumptions / Dependencies

- 

## Non-Goals

- 
`,
  [FEATURE_FILE_NAMES.product]: `# Product

## User Goal

- 

## Business Rules

- 

## State Transitions

- 

## Happy Path

- 

## Exception Flows

- 

## Acceptance Criteria

- Given 
- When 
- Then 
`,
  [FEATURE_FILE_NAMES.uiUx]: `# UI / UX

## Surface

- 

## Component Boundaries

- 

## User Feedback

- 

## States

- Loading:
- Empty:
- Error:
- Success:
`,
  [FEATURE_FILE_NAMES.technical]: `# Technical

## Data Contracts

- 

## API Contracts

- 

## Observability

- 

## Migration / Rollback

- 
`,
  [FEATURE_FILE_NAMES.plan]: `# Plan

## Tasks

- [ ] Define implementation slice

## Dependencies

- 

## Verification

- 
`,
} as const;
