# Service Refactor Playbook

Use this checklist whenever you need to shrink long functions or split an oversized Angular service.

## 1. Discover long functions

```bash
npm run analyze:functions -- <path-to-service-or-folder>
```

- Defaults to a 20 statement threshold; override with `--max-lines=<n>` if needed.
- Pass either a single file or a directory. Specs are ignored automatically.

## 2. Refactor iteratively

1. Start with the highest line counts first then identify the most complex functions.
2. Extract cohesive helpers; favour pure functions for easy unit tests.
3. If a class mixes unrelated responsibilities, route the new helpers into a dedicated service and inject it.
4. Replace magic numbers or strings with named constants near the top of the file.
5. Keep public APIs stable unless you have tests ready to update callers.
6. When adding new services, ensure they are exported in the nearest `index.ts` barrel if one exists.
7. Once a service has had the functions refactored, check it is single responsibility. If not, consider splitting it into multiple services.
8. Rerun the analyzer to confirm progress.
9. If multiple services have been created, consider moving them into a dedicated folder.
10. Update imports in callers as needed.
11. If there are many services in a folder, consider adding an `index.ts` barrel to simplify imports.

## 3. Protect behaviour

- Update or add specs for every new helper or service.
- Run `npm run test:ci` (or the closest targeted test command) before you finish.
- When adding new services, ensure they are exported in the nearest `index.ts` barrel if one exists.

## 4. Repeat quickly

The analyzer can be re-run at any time to confirm all functions are now under the threshold. Pair its output with the checklist above to keep the fleet services maintainable without repeating these instructions.
