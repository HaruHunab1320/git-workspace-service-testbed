# API Documentation

## GET /api/health

Returns the current health status of the application, including version info, uptime, and database connectivity.

### Description

The health endpoint provides a lightweight, production-safe check of application vitals. It is intended for use by load balancers, monitoring systems, and operational dashboards. The database connectivity check uses a non-blocking ping query (`SELECT 1`) to minimize overhead.

### Response

**Status Code:** `200 OK`

**Content-Type:** `application/json`

#### Response Body

| Field      | Type   | Description                                                                 |
|------------|--------|-----------------------------------------------------------------------------|
| `version`  | string | The application version (e.g., from `package.json`).                        |
| `commit`   | string | The git commit SHA of the currently deployed build.                          |
| `uptime`   | number | The number of seconds the application has been running.                      |
| `database` | string | Database connectivity status: `"connected"` or `"disconnected"`.            |

#### `database` Status Values

- **`"connected"`** — The application successfully executed a ping query against the database.
- **`"disconnected"`** — The database ping query failed or timed out. This may indicate a network issue, database outage, or misconfiguration.

#### Example Response

```json
{
  "version": "1.2.0",
  "commit": "a1b2c3d4e5f6",
  "uptime": 3621,
  "database": "connected"
}
```

### OpenAPI 3.0 Specification

```yaml
paths:
  /api/health:
    get:
      summary: Application health check
      description: >
        Returns application version, git commit, uptime in seconds,
        and database connectivity status. The database check is a
        non-blocking ping query (SELECT 1).
      responses:
        '200':
          description: Health status retrieved successfully
          content:
            application/json:
              schema:
                type: object
                required:
                  - version
                  - commit
                  - uptime
                  - database
                properties:
                  version:
                    type: string
                    description: Application version
                    example: "1.2.0"
                  commit:
                    type: string
                    description: Git commit SHA of the deployed build
                    example: "a1b2c3d4e5f6"
                  uptime:
                    type: number
                    description: Seconds since the application started
                    example: 3621
                  database:
                    type: string
                    enum:
                      - connected
                      - disconnected
                    description: Database connectivity status
                    example: "connected"
              example:
                version: "1.2.0"
                commit: "a1b2c3d4e5f6"
                uptime: 3621
                database: "connected"
```
