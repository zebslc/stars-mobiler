# Service Refactor Playbook

Use this checklist whenever you need to shrink long functions or split an oversized Angular service.

## 1. Discover long functions

```bash
npm run analyze:functions -- <path-to-service-or-folder>
```

- Defaults to a 20 line threshold; override with `--max-lines=<n>` if needed.
- Pass either a single file or a directory. Specs are ignored automatically.

## 2. Refactor iteratively

1. Start with the highest line counts first.
2. Extract cohesive helpers; favour pure functions for easy unit tests.
3. If a class mixes unrelated responsibilities, route the new helpers into a dedicated service and inject it.
4. Replace magic numbers or strings with named constants near the top of the file.
5. Keep public APIs stable unless you have tests ready to update callers.

## 3. Protect behaviour

- Update or add specs for every new helper or service.
- Run `npm run test:ci` (or the closest targeted test command) before you finish.
- When adding new services, ensure they are exported in the nearest `index.ts` barrel if one exists.

## 4. Repeat quickly

The analyzer can be re-run at any time to confirm all functions are now under the threshold. Pair its output with the checklist above to keep the fleet services maintainable without repeating these instructions.
