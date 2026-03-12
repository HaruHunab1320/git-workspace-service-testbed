# API Reference

## GET /api/health

Returns the current health status of the application, including version info, uptime, and database connectivity.

### Request

No request body or query parameters required.

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

```json
{
  "status": "ok",
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "database": "connected"
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `status` | `"ok"` \| `"error"` | Overall health status. `"ok"` when all checks pass; `"error"` when any check (e.g., database) fails. |
| `version` | `string` | Application version, read from the `APP_VERSION` environment variable. Defaults to `"unknown"` if not set. |
| `commit` | `string` | Git commit SHA of the running build, read from the `GIT_COMMIT` environment variable. Defaults to `"unknown"` if not set. |
| `uptime` | `number` | Server uptime in seconds, sourced from `process.uptime()`. |
| `database` | `"connected"` \| `"disconnected"` | Result of a lightweight database ping. `"connected"` on success; `"disconnected"` if the check fails. |

### Status Logic

The `status` field reflects the aggregate health of the service:

- **`"ok"`** — The application is running and the database is reachable.
- **`"error"`** — The application is running but one or more checks failed (e.g., the database is unreachable). The endpoint still returns `200 OK` so that monitoring tools can read the response body for details.

### Example: Degraded State

When the database is unreachable, the endpoint returns:

```json
{
  "status": "error",
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 7200.15,
  "database": "disconnected"
}
```

### Notes

- The endpoint always returns HTTP `200` regardless of internal check results. Consumers should inspect the `status` and `database` fields to determine service health.
- The database check uses a lightweight query (`SELECT 1`) wrapped in a try-catch to ensure the endpoint never crashes due to a database failure.
- Implementation: [`src/routes/health.js`](../src/routes/health.js)
