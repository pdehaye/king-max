# Red Green Refactor Checklist

## Red
- [ ] Behavior change is stated as an acceptance rule.
- [ ] Failing scenario is documented before code changes.
- [ ] Failure signal is explicit (wrong state, wrong output, or incorrect UI behavior).

## Green
- [ ] Smallest implementation change is applied.
- [ ] Failing scenario now passes.
- [ ] Existing core checks still pass: new game, clear, hint, difficulty search, win flow.

## Refactor
- [ ] Cleanup keeps behavior unchanged.
- [ ] Naming and structure are improved where needed.
- [ ] Risk notes are updated.
