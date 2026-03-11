# API Specification

## Endpoints

### GET /api/health

Returns the current health status of the application, including version information, uptime, and database connectivity.

**Purpose:** Production monitoring endpoint for verifying application vitals and database connectivity.

#### Request

No request body or query parameters required.

#### Response

**Content-Type:** `application/json`

| Field      | Type   | Description                                                        |
|------------|--------|--------------------------------------------------------------------|
| `status`   | string | Overall health status. `"ok"` if healthy, `"error"` if degraded.   |
| `version`  | string | Application version from `package.json`.                           |
| `commit`   | string | Git commit hash, sourced from the `GIT_COMMIT` environment variable. |
| `uptime`   | number | Server uptime in seconds (via `process.uptime()`).                 |
| `database` | string | Database connectivity state: `"connected"` or `"disconnected"`.    |

#### Status Codes

| Code  | Condition                                      |
|-------|------------------------------------------------|
| `200` | Application is healthy and database is connected. |
| `503` | Database connectivity check failed.            |

#### Example: Healthy Response

```http
GET /api/health HTTP/1.1
```

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "database": "connected"
}
```

#### Example: Degraded Response

```http
GET /api/health HTTP/1.1
```

```json
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "status": "error",
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "database": "disconnected"
}
```

#### Notes

- The `commit` field reflects the value of the `GIT_COMMIT` environment variable at startup. If the variable is not set, the value may be empty or a default placeholder.
- The `uptime` value is a floating-point number representing seconds since the process started.
- A `503` response indicates the application is running but the database is unreachable. All other fields are still populated to aid debugging.
