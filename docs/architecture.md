# Cooperative conversation experiment

## Requirements and current scope

TU Berlin research experiment built with React, TypeScript, Vite and plain CSS. Two participants receive researcher-assigned roles and different worksheets for the same scenario. They exchange information in a live voice conversation, fill gaps in their own sheets and submit their answers. Participants never choose or change roles.

No audio recording or transcription is permitted. Future research records contain structured task responses, session status, timing and necessary connection metadata only.

The frontend has a local Node results endpoint attached to Vite's development and preview servers. Pairing and voice controls remain simulated; there is no microphone access, voice SDK, analytics or recruitment integration. Role assignment comes from a researcher-controlled fixture. Participant-facing language describes the study without development labels, but no live connection is claimed in the waiting-room or call status. Submission saves JSON in the project's results/ directory and optionally keeps a localStorage copy. This is not an authenticated research backend or a production consent/recruitment flow.

## Source and implemented scenario

The first implemented task is Scenario 1, British Rail Travel Information, from the user-provided Examples.pdf: PDF pages 4–5, printed pages 57–58 of ITU-T P.805 (04/2007), Appendix V. The preceding travel-agent exercise is a practice scenario and is not implemented.

The two worksheets closely follow the source:

- Caller: Thompson, London King's Cross to Inverness on July 20th, night sleeper, through train if possible. Gaps: departure time, arrival time and train number. Information to provide: one berth, first class, non-smoker.
- Receiver: British Rail travel service, with the original three-column timetable including the York connection. Gaps: reservation name, berth count, class and smoking preference.
- Discussion: the caller asks when buffet-car breakfast begins. Neither worksheet supplies an answer; each participant records the solution agreed in conversation. Do not invent an authoritative answer or auto-grade it.

Use historical names, schedule and smoking categories only as scenario material, not real travel information. The name entered by the receiver is the scenario character's name, not the participant's real identity. HTML controls replace the printed blank lines and smoking checkboxes. Decorative SVG symbols accompany text headings, following Appendix V's question mark, information, incoming/outgoing folder and two-person discussion pictograms, plus a checklist for journey conditions. All gaps are required, but answers are not graded or prefilled. Raw text values are trimmed only at the edges. Arrival is explicitly labeled as the next day.

## Project structure and team ownership

- src/App.tsx: session lifecycle, transitions and save-before-confirmation.
- src/types/experiment.ts: roles, sessions, gap responses and stored record types.
- src/data/assignment.ts: researcher-controlled assignment fixture; defaults to traveler. Change to employee during developer review. No participant-facing selector or URL override.
- src/data/task.ts: versioned scenario content, timetable and role-specific field definitions.
- src/components/TaskInstructions.tsx: read-only role-specific worksheet information.
- src/components/AnswerForm.tsx: worksheet layout, gap fields and validation.
- src/components/SubmissionSummary.tsx: confirmation and saved answer summary.
- src/components/WorksheetSymbol.tsx: accessible decorative vector counterparts to Appendix V's section pictograms.
- src/components/VoiceControls.tsx: simulated mute, disconnect and reconnect.
- src/components/ExperimentLayout.tsx: shared header, progress, focus and footer.
- src/pages/: Welcome, Waiting Room and Experiment.
- src/services/responseStorage.ts: local response persistence behind a small adapter.
- src/services/responseExport.ts: submission to POST /api/results and receipt handling.
- src/services/responseFilename.ts: stable Windows-safe result filenames, shared by server and tests.
- server/results.ts: payload validation, atomic file publication, retry handling and HTTP middleware.
- server/resultsPlugin.ts: results endpoint registration for Vite development/preview, result-file access denial and watcher exclusions.
- results/: automatically saved JSON files, ignored by Git except .gitkeep.
- src/index.css and src/App.css: global defaults, design tokens and responsive styling.
- tests/: data and storage checks using Node's built-in test runner.

For five developers, work areas can be session flow/types; scenario content and instructions; response forms and storage; voice/connection UX; shared styling/accessibility/verification. Coordinate shared contract changes in review and keep SDK code behind future adapters.

## Flow and assignment

Welcome → Waiting Room → Experiment → saved submission summary. Joining creates a session ID and copies the configured role, without filesystem prompts. Opening the worksheet captures a start timestamp; no partner is contacted. Submission posts to the server and waits for the saved-file receipt. Restart discards the current draft/session but retains result files and browser copies. Reload returns to Welcome; unsaved drafts are lost. Screens use typed React state rather than URL routing.

Only the assigned worksheet is rendered. Both fixtures ship in the client bundle, so this is not access control. Production pairing and complementary role assignment must be enforced by the server; the local fixture does not simulate two synchronized participants.

## Answer storage

The form submits an answers object keyed by stable field IDs, not a transcript or freeform conversation log. A record contains schemaVersion, taskId, taskVersion, sessionId, role, joinedAt, startedAt, submittedAt and answers. Lifecycle timestamps use the local browser clock; the server adds receivedAt. Future production lifecycle timing must be server authoritative.

POST /api/results validates the known task/version, UUID, role, timestamps and exact role-specific fields, with a 16 KiB request limit and same-origin checks. It writes and flushes a temporary file inside results/, then publishes a complete JSON file using an exclusive hard link. Temporary files are cleaned up. The server never overwrites an existing result. Concurrent or later identical retries return the original file and stored response; different answers for that file return a conflict. No endpoint lists or reads saved results, and Vite denies static access to the directory.

Files are named <UTC-session-time>__<task>__v<version>__<role>__<session-UUID>.json. The timestamp is joinedAt with colons and decimal points replaced by hyphens, so filenames work on Windows and sort by session start. Full UUIDs and roles distinguish submissions; using session creation time makes retry filenames stable even if submittedAt changes. Server failures preserve the worksheet and display a retry message. Controls prevent duplicate submission or edits while writing. Confirmation appears only after the server acknowledges the file. There is no browser directory picker or automatic participant download.

After server acknowledgement, an optional copy is saved under localStorage key tu-berlin.conversation.responses.v1. Failure of that optional copy does not invalidate the project save. Clearing browser data, restarting or reloading does not remove project files. The folder is on the machine running Vite, outside dist/, so npm run build does not remove it. Run npm run dev or npm run preview to enable the endpoint; static-only hosting requires a separate backend. Use persistent storage and backups when deploying a server. This local endpoint does not provide researcher authentication, server-issued assignments or production study authorization.

## Planned production architecture (not implemented)

React → session/task and voice adapters → authenticated server endpoints → Supabase, LiveKit and Prolific.

- **Supabase:** participant management, paired sessions, server-assigned complementary roles, versioned tasks, per-field responses, lifecycle state, timing and connection metadata. Replace local storage with authenticated server submission, acknowledgement and retry-safe writes. Enforce ownership and role-specific reads with server authorization and row-level policies.
- **LiveKit:** live voice with short-lived room tokens issued by a trusted server for the assigned pair. Handle connecting, muted, disconnected, failed and ended states. Request microphone access only for the real call flow. Never enable recording, egress, transcription or speech-to-text.
- **Prolific:** recruitment identifiers and completion after an accepted submission. Validate identifiers and session ownership server-side; URL parameters are untrusted.

Model participants, paired sessions, role assignments, task versions, responses and connection events separately. Store structured gap answers, lifecycle status, server timestamps and necessary join/leave/reconnect metadata. Never store audio, transcripts or conversation content in telemetry. Define access, retention and withdrawal with the research team before recruitment. Handle partner dropout, cancellation, timeouts, duplicate submissions and reconnection explicitly.

## Verification

Run npm test, npm run lint and npm run build; CI runs all three. Review each assignment by changing the developer fixture, never through participant controls. Walk join → assigned waiting room → worksheet → server save → confirmation → restart. Check required fields, whitespace-only answers, positive integer berth counts, keyboard focus, narrow layouts and the scrollable timetable. Verify files appear in results/ with complete answers and metadata, server failure preserves the draft, and blocked browser storage still permits successful submission. Automated checks cover filenames, API submission, real HTTP/filesystem writes, concurrent retries, conflicts, invalid data, private-file access and write failures; real pairing, voice, recruitment and production authorization remain untested.
