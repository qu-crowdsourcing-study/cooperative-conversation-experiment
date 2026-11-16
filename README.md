# Cooperative conversation experiment

TU Berlin conversation study using React, TypeScript, Vite and plain CSS, with a local Node endpoint for saving results.

## Run locally

Use Node.js 24 (matching CI). Install with npm ci, then run npm run dev and open Vite's local URL. On Windows with a restricted PowerShell script policy, use npm.cmd instead of npm.

- npm test: scenario, browser storage, result filenames and real HTTP/filesystem submission checks.
- npm run lint: ESLint.
- npm run build: TypeScript and production build in dist/.
- npm run preview: serve the production build with the same local results endpoint.

## Scenario 1: British Rail Travel Information

The task closely follows Examples.pdf pages 4–5 (ITU-T P.805, Appendix V, printed pp. 57–58). One participant is Thompson, the caller; the other is the British Rail travel service. They exchange journey and reservation information, fill their own worksheet gaps and record an agreed response to an additional question.

Roles are assigned by the research team. There is no participant role picker. For developer review, change role in src/data/assignment.ts from traveler to employee and start a new session. The fixture replaces future server-issued assignments and does not actually pair two browsers.

## Walk through the participant flow

1. Join the experiment and see the assigned role in the waiting room.
2. Open your worksheet and complete its gaps.
3. Try simulated mute, disconnect and reconnect.
4. Submit to save JSON automatically in the project's results/ folder, then review the saved answers.
5. Return to welcome for another session; submitted records remain saved.

Pairing and voice are not connected yet. There is no microphone access, audio recording, transcription or voice SDK. The only backend request is the local results submission. Timetable data and names are historical scenario material, not current travel advice; use scenario names rather than real participant details.

## Where answers are saved

Every successful submission is saved automatically in **results/** at the project root, next to package.json. This works with both npm run dev and npm run preview. There is no folder picker or browser download. The app sends POST /api/results and waits for the server to finish writing the JSON file before showing confirmation. A failed save leaves the worksheet open for retry.

Names have this format:

```text
<UTC-session-time>__<task>__v<version>__<role>__<session-UUID>.json
2026-11-16T12-00-00-000Z__p805-scenario-1__v1__traveler__243d539b-6c0e-42fa-a2bb-72d3d970315d.json
```

The timestamp is the session creation time, with Windows-safe punctuation. The full UUID distinguishes sessions even if they start at the same instant; the role distinguishes caller and receiver. Retrying the same submission returns the saved file, and conflicting answers do not overwrite it. Files contain all answers, task/version, role, session ID, browser lifecycle timestamps and a server receivedAt timestamp. Generated files are ignored by Git and are not served as public assets.

An optional browser copy is saved under localStorage key tu-berlin.conversation.responses.v1. Browser storage being blocked does not prevent a successful project save. Reload returns to Welcome and discards unsaved entries; it does not delete result files. Keep backups of results/ separately.

The results folder belongs to the machine running the Vite server. A static-only deployment of dist/ cannot write results: it needs an equivalent server endpoint and persistent storage. This local endpoint is not an authenticated research backend; Supabase-based shared storage is planned.

## Manual checks

- Review both roles by changing the developer assignment fixture.
- Confirm participants cannot choose or change their role.
- Compare each worksheet with PDF pages 4–5.
- Check the Appendix V-style purpose, conditions, obtain/give, information and discussion symbols alongside their text labels.
- Check required blanks and whitespace-only answers; berth counts must be positive integers.
- Verify keyboard navigation, focus after transitions and phone-width layouts.
- Submit, inspect the JSON file in results/ and its answers/metadata, then reload to confirm file persistence.
- Verify joining never asks for a folder and submission does not download a file to the participant's device.
- Stop the server or deny a results/ write and verify the worksheet stays open for retry.
- Block browser storage and verify a successful project save still confirms submission.
- Check voice controls disable after submission.

See [docs/architecture.md](docs/architecture.md) for component ownership, source details, persistence limits and planned services.
