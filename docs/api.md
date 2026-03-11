# API Documentation

## Health Check

### `GET /api/health`

Returns the current health status of the application, including version information, uptime, and database connectivity. This endpoint is designed for use with load balancers and monitoring systems.

### Response Body

| Field      | Type   | Description                                                        |
|------------|--------|--------------------------------------------------------------------|
| `version`  | string | Application version, sourced from the `APP_VERSION` env variable. Defaults to `"development"` if unset. |
| `commit`   | string | Git commit hash, sourced from the `GIT_COMMIT` env variable. Defaults to `"development"` if unset. |
| `uptime`   | number | Application uptime in seconds (via `process.uptime()`).           |
| `database` | string | `"connected"` if the database is reachable, `"disconnected"` otherwise. |

### Status Codes

| Code  | Meaning               | Condition                          |
|-------|-----------------------|------------------------------------|
| `200` | OK                    | Database is connected and healthy. |
| `503` | Service Unavailable   | Database is disconnected or unreachable. |

### Example: Healthy Response (200 OK)

```json
{
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "database": "connected"
}
```

### Example: Unhealthy Response (503 Service Unavailable)

```json
{
  "version": "1.2.0",
  "commit": "a1b2c3d",
  "uptime": 3661.42,
  "database": "disconnected"
}
```

### Load Balancer Integration

Configure your load balancer to poll `GET /api/health` at a regular interval (e.g., every 10 seconds). If the endpoint returns a `503` status code, the load balancer should stop routing traffic to this instance until it begins returning `200` again. The `503` response indicates that the application cannot serve requests that depend on database access.
