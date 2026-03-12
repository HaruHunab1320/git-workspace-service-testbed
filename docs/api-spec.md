# API Specification

## GET /api/health

Returns the current health status of the application, including version information, uptime, and database connectivity.

### Request

```
GET /api/health
```

No request body or query parameters are required.

### Response

#### 200 OK

Returned when the application is healthy and the database is connected.

```json
{
  "version": "1.2.3",
  "commit": "abc1234",
  "uptime": 3621.47,
  "database": "connected"
}
```

#### 503 Service Unavailable

Returned when the database is disconnected or unreachable. The response body still includes all fields so that operators can inspect version and uptime information during an outage.

```json
{
  "version": "1.2.3",
  "commit": "abc1234",
  "uptime": 3621.47,
  "database": "disconnected"
}
```

### Response Fields

| Field      | Type   | Description                                                                 |
|------------|--------|-----------------------------------------------------------------------------|
| `version`  | string | Application version, read from the `APP_VERSION` environment variable.      |
| `commit`   | string | Git commit hash of the running build, read from the `GIT_COMMIT` environment variable. |
| `uptime`   | number | Time in seconds since the process started (via `process.uptime()`).         |
| `database` | string | Database connectivity status: `"connected"` or `"disconnected"`.            |

### Environment Variables

| Variable      | Purpose                          |
|---------------|----------------------------------|
| `APP_VERSION` | Populates the `version` field.   |
| `GIT_COMMIT`  | Populates the `commit` field.    |

### Notes

- The endpoint is unauthenticated so that load balancers and monitoring tools can poll it without credentials.
- All JSON keys use camelCase.
- The `uptime` value is a floating-point number representing seconds.
