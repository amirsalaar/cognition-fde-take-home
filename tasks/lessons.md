# Lessons

- Next.js standalone in Docker binds to the container hostname by default. Set
  HOSTNAME=0.0.0.0 or in-container healthchecks against 127.0.0.1 fail.
- The mcr.microsoft.com/playwright image runs tests as pwuser but WORKDIR /app
  is root-owned. Chown /app (and copied node_modules) or Playwright cannot
  create test-results.
- With Auth.js Credentials in Compose, do not set AUTH_URL to localhost. Use
  AUTH_TRUST_HOST=true so redirects follow the request host, which lets the same
  stack serve both the host browser and a containerized E2E runner.
- Playwright logout/relogin in a single page context is flaky with server-action
  auth. Use one browser context per role instead.
