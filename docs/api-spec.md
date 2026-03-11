# API Specification

## GET /api/health

Returns the current health status of the application, including version info, uptime, and database connectivity.

### Request

No request body or query parameters required.

### Response

**Content-Type:** `application/json`

#### Status Codes

| Code | Meaning |
|------|---------|
| `200 OK` | All checks pass; the application is healthy. |
| `503 Service Unavailable` | One or more checks failed (e.g., database is unreachable). |

#### Response Body

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"ok"` \| `"error"` | Overall health status. `"ok"` when all checks pass, `"error"` when any check fails. |
| `version` | `string` | Application version, read from the project manifest (e.g., `package.json`). |
| `commit` | `string` | Git commit SHA of the running build, sourced from the `GIT_COMMIT` environment variable. |
| `uptime` | `number` | Process uptime in seconds. |
| `database` | `"connected"` \| `"disconnected"` | Result of a lightweight database connectivity check (`SELECT 1`). |

#### Example: Healthy Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "status": "ok",
  "version": "1.2.0",
  "commit": "a1b2c3d4e5f6",
  "uptime": 86400,
  "database": "connected"
}
```

#### Example: Unhealthy Response (Database Down)

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
```

```json
{
  "status": "error",
  "version": "1.2.0",
  "commit": "a1b2c3d4e5f6",
  "uptime": 86400,
  "database": "disconnected"
}
```

### Implementation Notes

- **No authentication required.** This endpoint is intended for load balancers, orchestrators, and monitoring systems.
- **Database check** performs a minimal `SELECT 1` query to verify connectivity without adding load.
- **`version`** is read from the project manifest at startup.
- **`commit`** is read from the `GIT_COMMIT` environment variable. If unset, the value may be an empty string or `"unknown"`.
- **`uptime`** reflects the process uptime in seconds (e.g., via `process.uptime()` in Node.js).
- **No new dependencies** are introduced; the endpoint relies solely on built-in capabilities.
