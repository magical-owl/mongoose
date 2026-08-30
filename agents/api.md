# AI Agent API Instructions

Start with [`agents/04-data-architecture.md`](04-data-architecture.md), the relevant workflow in [`agents/workflows/`](workflows/), and [`agents/compliance-gates.md`](compliance-gates.md). Use this file as the detailed API integration reference.

## Use Axios with Interceptors
- Use Axios as the primary HTTP client for all API requests.
- Create a singleton Axios instance with a base URL, default headers, and a reasonable timeout.
- Attach request interceptors for: injecting auth tokens, logging outgoing requests (PII stripped), setting request fingerprints.
- Attach response interceptors for: unwrapping response envelopes, transforming dates, logging errors, triggering token refresh on 401.
- Define the Axios instance in a dedicated `api/client.ts` module and export it for use across repositories.

## Implement Request/Response Transformation
- Use request interceptors to serialize payloads to the wire format expected by the API (e.g., snake_case keys, ISO 8601 dates).
- Use response interceptors to deserialize responses into the application's domain models (e.g., camelCase keys, Date objects).
- Keep transformation logic centralized in the interceptors; individual call sites should not need to transform data.
- Handle envelope unwrapping (e.g., `{ data: ..., meta: ... }` → just the inner payload) in the response interceptor.

## Handle Authentication Tokens
- Store access tokens and refresh tokens in `expo-secure-store` (see security.md).
- In the request interceptor, read the access token from SecureStore and attach it as a `Bearer` header.
- In the response interceptor, detect 401 responses and attempt a token refresh before retrying the original request.
- If token refresh fails (e.g., refresh token expired), clear stored tokens and emit an `auth:logout` event for the UI to redirect to login.
- Guard against concurrent refresh requests: queue pending requests during refresh and replay them once the new token is obtained.

## Implement Retry Logic with Exponential Backoff
- Automatically retry failed requests for transient errors (network timeouts, 5xx server errors, rate-limit 429 responses).
- Use exponential backoff with jitter: start at 1s, multiply by 2 each retry, add random jitter ±500ms.
- Set a maximum retry count of 3. After exhausting retries, surface the final error to the caller.
- Do NOT retry on 4xx client errors (400, 401, 403, 404, 422) — these indicate a problem with the request itself.
- Implement retry logic in the response interceptor so it applies globally.

## Cancel Requests on Unmount
- Use Axios cancellation tokens (`AbortController` in Axios >=0.22) to cancel in-flight requests when a component unmounts.
- Expose a `useCancellableRequest` hook or similar utility that ties request lifecycle to component mount state.
- Cancel requests silently (do not log or surface errors for intentional cancellations).
- Ensure cancelled requests do not trigger error states, retries, or token refresh logic.

## Handle Network Errors Gracefully
- Detect network-level errors (no internet, DNS failure, timeout) in the response interceptor.
- Map network errors to a typed `NetworkError` result so calling code can distinguish them from server errors.
- Show user-friendly UI states for offline/network-error scenarios (e.g., a banner, a retry button, cached data fallback).
- Avoid displaying raw Axios error messages or stack traces to the user.
- Provide a global `onNetworkError` callback in the Axios instance that the app can subscribe to for showing toast notifications.
