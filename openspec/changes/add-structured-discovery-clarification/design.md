## Context

Discovery currently stores `questions.md` as Markdown bullet lines. `discovery_update` can add or remove questions by matching their text, but text is not a stable identity and no metadata records why a question exists or whether it blocks PRD drafting.

The next stage should turn discovery into a controlled clarification loop without forcing all uncertainty to be resolved. The user should be able to answer blocking questions, defer optional ones, and explicitly confirm when the remaining uncertainty is acceptable.

## Goals / Non-Goals

**Goals:**

- Give every question a stable ID and lifecycle.
- Distinguish blocking questions from non-blocking questions.
- Preserve answers as structured discovery context.
- Make clarification progress visible and auditable.
- Integrate with the existing explicit `discovery_confirm` gate.

**Non-Goals:**

- Automatically inventing questions without model or user input.
- Requiring every question to be answered before drafting.
- Replacing the existing discovery context fields.
- Adding multi-model discussion; that belongs to the consensus change.

## Decisions

### 1. Use structured question records

Proposed shape:

```yaml
questions:
  - id: discovery-q1
    question: "Who gives final approval for a payment exception?"
    category: actors
    blocking: true
    status: open
  - id: discovery-q2
    question: "Is historical data import required?"
    category: scope
    blocking: false
    status: answered
    answer: "Yes, import the previous 12 months."
```

Field definitions:

- `questions`: Ordered list of structured discovery-question records.
- `questions[].id`: Stable non-empty string identifying one question. Used for answer, defer, resolve, and audit operations.
- `questions[].question`: Non-empty user-facing question text.
- `questions[].category`: Extensible string such as `actors`, `scope`, `constraints`, `success_measures`, or `technical`; not a closed enum.
- `questions[].blocking`: Boolean. `true` means an open question prevents `discovery_confirm`; `false` means the question may remain deferred.
- `questions[].status`: Lifecycle value: `open`, `answered`, or `deferred`.
- `questions[].answer`: Optional string containing the accepted answer or decision. Required when status is `answered`.

Usage:

- Create a question with `status: open` when clarification is needed.
- Set `blocking: true` only when drafting cannot safely proceed without an answer.
- Answer or defer questions by `id`, never by matching question text.
- Keep deferred non-blocking questions visible so they can become assumptions or future scope items.

Question categories SHALL be extensible strings rather than a closed enum.

### 2. Stable IDs replace text matching

Question updates SHALL address IDs. Text remains user-visible, but changing wording must not create duplicate history or accidentally resolve a different question.

### 3. Blocking questions gate confirmation

`discovery_confirm` SHALL reject when any question is both `status: open` and `blocking: true`. Non-blocking open questions SHALL be reported but may remain unresolved when the user explicitly confirms.

### 4. Answers feed discovery context

Resolved answers SHALL be included in a structured answers or assumptions field used by authoring context. The original question and answer history SHALL remain available for traceability.

### 5. Preserve a human-readable representation

The project SHALL retain a readable `questions.md`, whether it remains the source file with structured sections or is rendered from a structured store. The format must be understandable without a special viewer.

## Risks / Trade-offs

- [More state than a simple Markdown list] -> Mitigation: render a concise human-readable view and keep schema defaults.
- [Question lifecycle complexity] -> Mitigation: start with `open`, `answered`, and `deferred` statuses.
- [Over-blocking progress] -> Mitigation: only unresolved blocking questions prevent confirmation.
