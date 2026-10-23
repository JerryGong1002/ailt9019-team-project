# Weekly report implementation plan

**Goal:** Generate an English weekly report using the supplied master prompt and aggregate spending data.

**Architecture:** A dependency-free Node server serves `dist` and a same-origin POST endpoint. Browser records remain local; only whitelisted aggregates leave the browser. The server validates period consistency, calculates comparison figures, and calls OpenAI Responses with a server-held key and prompt. The static-only deployment continues to work but cannot generate reports.

**Stack:** Node 22+, native HTTP/fetch, existing browser JavaScript, node:test.

1. Write failing summary and HTTP endpoint tests, including privacy, date boundaries, zero baseline, invalid summaries, provider failure and request limits.
2. Add shared summary code and server-side master prompt. Use integer cents internally and formatted figures for the model.
3. Add server endpoint, bounded requests, timeout, global hourly call limit.
4. Add explicit generation controls, loading/error/empty states and stale-response protection to the browser.
5. Document environment variables and deployment; run all tests and syntax checks. Live provider verification waits for credentials.

The user's supplied master prompt is authoritative: reports describe spending and do not offer recommendations. API provider is provisionally OpenAI pending the user's reply. No credentials are required for implementation or stubbed integration tests.

Update: the user supplied Alibaba course access and explicitly waived the request to read Ed first. Added configurable Chat Completions support, a per-process single-call concurrency guard, and private local environment configuration. The supplied key is excluded from repository files. Live verification uses synthetic demo data only.

Update: removed demo access-code UI, authentication and public-bind token requirement at the user’s request. Localhost remains the default. Request concurrency and hourly limits remain.
