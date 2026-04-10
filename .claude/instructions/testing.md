# Testing Rules

## Unit Tests (Vitest)

- Test files: `*.spec.ts` alongside source files
- Test runner: Vitest with Angular `TestBed`
- Run via Nx: `npx nx test <project>` (never `vitest` directly)
- Use `describe` + `it` structure
- Use `TestBed.configureTestingModule` for Angular component tests
- Use `fixture.componentRef.setInput()` to set signal inputs in tests

## E2E Tests (Playwright)

- Test files: `apps/client/e2e/*.spec.ts`
- Run via Nx: `npx nx e2e client` (never `playwright` directly)
- Use `data-testid` attributes for stable selectors
- Prefer `getByRole` over CSS selectors
- Assert visibility with `toBeVisible()`, not existence

## Selector Priority

| Priority | Selector | Example |
|----------|----------|---------|
| 1st | `data-testid` | `page.getByTestId('game-board')` |
| 2nd | Accessible role | `page.getByRole('button', { name: 'Create' })` |
| 3rd | Label/placeholder | `page.getByLabel('Room ID')` |
| Avoid | CSS selectors | `page.locator('.game-board')` |

## Coverage

- New features must include unit tests
- UI interactions must have e2e coverage
- Pure logic (board library) must have full unit coverage

For running test commands, invoke the `playwright` or `nx-run-tasks` skill.
