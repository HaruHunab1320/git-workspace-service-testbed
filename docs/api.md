# API Reference

## Health Check

### `GET /api/health`

Returns the current health status of the application, including deployment metadata and database connectivity.

Use this endpoint for uptime monitoring, load-balancer health probes, and deployment verification.

### Response

| Field              | Type   | Description                                                                 |
|--------------------|--------|-----------------------------------------------------------------------------|
| `version`          | string | Application version, sourced from the `APP_VERSION` environment variable. Returns `"unknown"` if not set. |
| `git_commit`       | string | Git commit hash of the running build, sourced from `GIT_COMMIT_HASH`. Returns `"unknown"` if not set. |
| `uptime_seconds`   | number | Time in seconds since the application process started. Always a non-negative number. |
| `database_status`  | string | `"connected"` if the database is reachable, `"disconnected"` otherwise.     |

### Status Codes

| Code  | Condition                          |
|-------|------------------------------------|
| `200` | Database is connected and healthy. |
| `503` | Database connectivity check failed. The JSON payload is still returned so that monitoring tools can inspect the failure reason. |

### Example: Healthy (200 OK)

```http
GET /api/health HTTP/1.1
Host: example.com
```

```json
{
  "version": "1.4.2",
  "git_commit": "a1b2c3d4e5f6",
  "uptime_seconds": 86400,
  "database_status": "connected"
}
```

### Example: Degraded (503 Service Unavailable)

```json
{
  "version": "1.4.2",
  "git_commit": "a1b2c3d4e5f6",
  "uptime_seconds": 86400,
  "database_status": "disconnected"
}
```

### Notes

- The database check is lightweight and non-blocking; it will not slow down other requests.
- All JSON keys use `snake_case`.
- If `APP_VERSION` or `GIT_COMMIT_HASH` environment variables are not configured, the corresponding fields default to `"unknown"`.
