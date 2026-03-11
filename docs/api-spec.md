# API Specification

## GET /api/health

Returns the current health status of the application, including version information, uptime, and database connectivity.

**Authentication:** None required.

### Response

**Status Code:** `200 OK`

**Content-Type:** `application/json`

#### Response Body

```json
{
  "status": "ok",
  "version": "1.0.0",
  "commit": "abc1234",
  "uptime": 3600,
  "database": "connected"
}
```

#### Fields

| Field      | Type     | Description                                                                                          |
|------------|----------|------------------------------------------------------------------------------------------------------|
| `status`   | `string` | Overall health status. `"ok"` when the application is running normally, `"error"` if any check fails. |
| `version`  | `string` | Application version, sourced from `package.json`.                                                     |
| `commit`   | `string` | Git commit hash of the running build, read from the `GIT_COMMIT` environment variable.                |
| `uptime`   | `number` | Time in seconds since the application process started, via `process.uptime()`.                        |
| `database` | `string` | Database connectivity status. `"connected"` if a ping query succeeds, `"disconnected"` otherwise.     |

### Example

**Request**

```
GET /api/health HTTP/1.1
```

**Successful Response**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "commit": "a1b2c3d",
  "uptime": 1234.56,
  "database": "connected"
}
```

**Degraded Response** (database unreachable)

```json
{
  "status": "error",
  "version": "1.0.0",
  "commit": "a1b2c3d",
  "uptime": 1234.56,
  "database": "disconnected"
}
```

### Notes

- The database check performs a lightweight query (`SELECT 1`) with a short timeout to avoid adding latency.
- The endpoint always returns `200 OK`, even when `status` is `"error"`. Consumers should inspect the `status` and `database` fields to determine health.
- The `commit` value depends on the `GIT_COMMIT` environment variable being set at deploy time.
