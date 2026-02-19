# Bruno Integration Tests

This directory contains automated API integration tests using [Bruno](https://www.usebruno.com/), a lightweight, git-friendly alternative to Postman with CLI support.

## Overview

Bruno tests provide fast feedback for API development by testing real endpoints with a real database. Tests are organized by API module and include both success and error scenarios.

## Directory Structure

```
tests/bruno/
├── bruno.json                    # Collection configuration
├── collection.bru                # Base URL and headers
├── environments/
│   └── local.bru                 # Local environment variables
├── Health/
│   └── check-health.bru          # GET /api/v1/health
└── Auth/
    ├── register-user.bru         # POST /api/v1/auth/register
    ├── register-duplicate.bru    # Test 409 error
    ├── login-success.bru         # POST /api/v1/auth/login
    └── login-invalid.bru         # Test 401 error
```

## Setup

### 1. Install Dependencies

Bruno CLI is installed as a dev dependency:

```bash
bun install
```

### 2. Start the API Server

Tests run against a live server on `http://localhost:3000`:

```bash
bun run dev
```

Keep the server running in a separate terminal.

### 3. Seed Test Users

Some tests require pre-existing users in the database:

```bash
bun run seed:test
```

This creates:
- `test-user@example.com` - For successful login tests
- `duplicate-test@example.com` - For duplicate registration error tests

You only need to run this once per database. The script is idempotent (safe to run multiple times).

## Running Tests

### All Tests

Run all integration tests:

```bash
bun run test:bruno
```

### Specific Module

Run tests for a specific module:

```bash
bun run test:bruno:health   # Health check tests only
bun run test:bruno:auth     # Auth tests only
```

### All Tests (Unit + Integration)

Run both unit tests and Bruno integration tests:

```bash
bun run test:all
```

### CI Mode with JUnit Report

For CI/CD pipelines (generates JUnit XML):

```bash
bun run test:bruno:ci
```

Report saved to `results/bruno-junit.xml`.

## Test Organization

Tests are organized by API module (Health, Auth, User, etc.). Each test file:

1. **Follows naming convention**: `action-scenario.bru`
   - `check-health.bru` - Health check endpoint
   - `login-success.bru` - Successful login
   - `login-invalid.bru` - Invalid credentials

2. **Uses standard API response format**:
   ```json
   {
     "success": boolean,
     "data": T | null,
     "error": { code: string, message: string } | null,
     "timestamp": string
   }
   ```

3. **Tests both success and error cases**:
   - Success: Verify 2xx status, data structure, business logic
   - Error: Verify 4xx/5xx status, error codes, error messages

## Environment Variables

Configured in `environments/local.bru`:

```
vars {
  base_url: http://localhost:3000/api/v1
  test_email_prefix: bruno-test
  test_password: TestPassword123!
}
```

### Using Variables

In test files:
- Request URL: `{{base_url}}/auth/login`
- Request body: `"password": "{{test_password}}"`
- Generated values: `"email": "{{test_email_prefix}}-{{timestamp}}@example.com"`

### Collection Variables

Tests can store values for later use (e.g., auth tokens):

```javascript
// In script:post-response
bru.setVar("auth_token", body.data.accessToken);

// In subsequent requests
headers {
  Authorization: Bearer {{auth_token}}
}
```

## Writing New Tests

### 1. Create Test File

Create a new `.bru` file in the appropriate module folder:

```
touch tests/bruno/YourModule/your-test.bru
```

### 2. Basic Structure

```
meta {
  name: Test Name
  type: http
  seq: 1
}

post {
  url: {{base_url}}/your-endpoint
  body: json
  auth: none
}

body:json {
  {
    "field": "value"
  }
}

tests {
  test("should return 200 status", function() {
    expect(res.getStatus()).to.equal(200);
  });

  test("should have standard API response format", function() {
    const body = res.getBody();
    expect(body).to.have.property('success');
    expect(body).to.have.property('data');
    expect(body).to.have.property('error');
    expect(body).to.have.property('timestamp');
  });
}
```

### 3. Test Assertions

Bruno uses Chai assertion library:

```javascript
// Status codes
expect(res.getStatus()).to.equal(200);
expect(res.getStatus()).to.be.at.least(200);

// Response body
const body = res.getBody();
expect(body.success).to.be.true;
expect(body.data).to.be.an('object');
expect(body.data).to.have.property('id');
expect(body.error).to.be.null;

// Strings and patterns
expect(body.data.email).to.equal('test@example.com');
expect(body.error.message).to.include('Invalid');
expect(body.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T/);

// Arrays
expect(body.data.items).to.be.an('array');
expect(body.data.items).to.have.lengthOf(3);
```

### 4. Scripts

Pre-request and post-response scripts:

```javascript
// Pre-request: Generate dynamic values
script:pre-request {
  bru.setVar("timestamp", Date.now());
  bru.setVar("random_id", Math.random().toString(36).substring(7));
}

// Post-response: Capture values
script:post-response {
  const body = res.getBody();
  bru.setVar("user_id", body.data.id);
  bru.setVar("auth_token", body.data.accessToken);
}
```

### 5. Protected Endpoints

For endpoints requiring authentication:

```
meta {
  name: Protected Endpoint
  type: http
  seq: 5
}

get {
  url: {{base_url}}/protected-resource
  body: none
  auth: none
}

headers {
  Authorization: Bearer {{auth_token}}
}

tests {
  test("should return 200 with valid token", function() {
    expect(res.getStatus()).to.equal(200);
  });
}
```

## Test Data Strategy

### Unique Data Per Run

Use timestamp-based unique values to avoid conflicts:

```javascript
script:pre-request {
  bru.setVar("timestamp", Date.now());
}

// In body:
"email": "{{test_email_prefix}}-{{timestamp}}@example.com"
```

This prevents test failures from duplicate data and eliminates cleanup needs.

### Known Test Users

For tests requiring existing users (login, duplicate checks):

1. Add user to `tests/bruno/seed-test-users.ts`
2. Document in test file's `docs` section
3. Run `bun run seed:test` before testing

## Bruno GUI

While tests run via CLI, you can also use the Bruno desktop app for manual testing and debugging:

1. Download from [usebruno.com](https://www.usebruno.com/)
2. Open Collection → Browse to `webapi/tests/bruno/`
3. Select environment: `local`
4. Run requests individually or in folders

Changes made in the GUI sync to `.bru` files automatically.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        working-directory: ./webapi
        run: bun install

      - name: Run database migrations
        working-directory: ./webapi
        run: bun run migrate

      - name: Seed test users
        working-directory: ./webapi
        run: bun run seed:test

      - name: Start API server
        working-directory: ./webapi
        run: bun run start &

      - name: Wait for server
        run: sleep 5

      - name: Run integration tests
        working-directory: ./webapi
        run: bun run test:bruno:ci

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: bruno-test-results
          path: webapi/results/
```

## Troubleshooting

### Tests fail with connection errors

Ensure the API server is running:
```bash
bun run dev
```

### Tests fail with "user not found"

Seed the test users:
```bash
bun run seed:test
```

### Tests fail with "email already exists"

This is expected for `register-duplicate.bru` test. Make sure test users are seeded.

### Environment variables not working

Check that you're running with `--env local`:
```bash
bru run tests/bruno --env local
```

### Bruno CLI not found

Install dependencies:
```bash
bun install
```

## Benefits

- **Fast feedback**: Tests run in seconds
- **Git-friendly**: Plain text `.bru` files, easy to review and diff
- **No mocking**: Tests real API with real database
- **CI/CD ready**: Bruno CLI integrates with GitHub Actions
- **Developer experience**: Same collection works in GUI and CLI
- **Idempotent**: Timestamp-based data prevents conflicts

## Resources

- [Bruno Documentation](https://docs.usebruno.com/)
- [Bruno CLI Guide](https://docs.usebruno.com/bru-cli/overview)
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/)
