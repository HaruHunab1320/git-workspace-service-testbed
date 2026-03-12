# API Documentation

## Health Check

### `GET /api/health`

Returns the current health status of the application, including version metadata, uptime, and database connectivity.

This endpoint is designed for use by monitoring systems, load balancers, and operational dashboards.

### Response

**Content-Type:** `application/json`

| Field      | Type   | Description                                                                 |
|------------|--------|-----------------------------------------------------------------------------|
| `status`   | string | Overall health status. `"ok"` when all checks pass, `"error"` otherwise.   |
| `version`  | string | Application version, sourced from the `APP_VERSION` environment variable.   |
| `commit`   | string | Git commit hash, sourced from the `GIT_COMMIT` environment variable.        |
| `uptime`   | number | Time in seconds since the application process started.                      |
| `database` | string | Database connectivity status. `"connected"` or `"disconnected"`.            |

### Status Codes

| Code | Condition                                                        |
|------|------------------------------------------------------------------|
| 200  | All systems operational (`status` is `"ok"`).                    |
| 503  | One or more checks failed (`status` is `"error"`), e.g. database is unreachable. |

### Example Responses

**Healthy system:**

```json
{
  "status": "ok",
  "version": "1.2.3",
  "commit": "a1b2c3d",
  "uptime": 86400,
  "database": "connected"
}
```

**Database unreachable:**

```json
{
  "status": "error",
  "version": "1.2.3",
  "commit": "a1b2c3d",
  "uptime": 86400,
  "database": "disconnected"
}
```

### Configuration

The endpoint reads the following environment variables at startup:

| Variable      | Description                          | Example     |
|---------------|--------------------------------------|-------------|
| `APP_VERSION` | Semantic version of the application. | `"1.2.3"`   |
| `GIT_COMMIT`  | Short SHA of the deployed commit.    | `"a1b2c3d"` |

### Notes

- The database check performs a lightweight connectivity ping. It does not execute any business-logic queries.
- `uptime` is calculated from the process start time and reported as a whole or fractional number of seconds.
- This endpoint requires no authentication and is safe to expose to health-check probes.
