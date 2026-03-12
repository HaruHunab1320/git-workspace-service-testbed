# API Documentation

## Endpoints

### GET /api/health

Returns the current health status of the application, including version information, uptime, and the results of dependency connectivity checks.

This endpoint is intended for use by load balancers, orchestrators (e.g., Kubernetes liveness/readiness probes), and monitoring systems.

#### Response

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Overall health status. `"ok"` when all checks pass, `"error"` when one or more checks fail. |
| `version` | `string` | Application version, sourced from the `APP_VERSION` environment variable. Defaults to `"development"` if unset. |
| `commit` | `string` | Git commit SHA of the running build, sourced from the `GIT_COMMIT` environment variable. Defaults to `"development"` if unset. |
| `uptime` | `number` | Time in seconds since the application process started. |
| `checks` | `object` | Results of individual dependency health checks. |
| `checks.database` | `string` | Database connectivity status. `"connected"` if the database is reachable, `"disconnected"` otherwise. |

#### HTTP Status Codes

| Status Code | Condition |
|-------------|-----------|
| `200 OK` | All health checks pass (`status` is `"ok"`). |
| `503 Service Unavailable` | One or more health checks fail (`status` is `"error"`), e.g., the database is disconnected. |

#### Example: Healthy Response

**`200 OK`**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "checks": {
    "database": "connected"
  }
}
```

#### Example: Unhealthy Response

**`503 Service Unavailable`**

```json
{
  "status": "error",
  "version": "1.0.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "checks": {
    "database": "disconnected"
  }
}
```

#### Notes

- The `uptime` value is measured in seconds from when the Node.js process started, using `process.uptime()`.
- The database check is non-destructive (e.g., a simple `SELECT 1` or `ping` query).
- All JSON keys use camelCase.
