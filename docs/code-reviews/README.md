# Code Reviews

This directory contains periodic code reviews of the Stars Mobile game codebase.

## Review Format

Each review follows the naming convention: `code-review-YYYY-MM-DD.md`

## How to Run a Review

Use the code review skill:

```bash
/code-review
```

The skill will automatically:
- Analyze the codebase using senior developer standards
- Check for YAGNI, DRY violations, god classes
- Measure test coverage
- Identify performance issues
- Check Angular 21 best practices
- Save the review to this directory with today's date

## Review Criteria

Reviews evaluate code against these standards:

### Engineering Principles
- **DRY (Don't Repeat Yourself)**
- **YAGNI (You Aren't Gonna Need It)**
- **No God Classes** (services with 8+ dependencies or 15+ methods)
- **Data-Driven Architecture**
- **Strong Typing** (no `any`)

### Angular Best Practices
- Signals-first architecture
- OnPush change detection
- Zoneless architecture
- Standalone components
- Input signals (not @Input + OnChanges)
- Computed signals (no unnecessary asReadonly())

### Code Quality
- Test coverage (target 60%+)
- Proper error handling
- No console.log statements
- Immutable state updates
- Performance optimizations

## Review History

- **2026-01-12** - Current status review with command pattern improvements
- **2026-01-10** - Initial comprehensive review (CODE_REVIEW.md)

## Using Reviews

After each review:
1. Review the Critical Issues (🔴) section
2. Prioritize High Priority Issues (🟡)
3. Plan work for Medium Priority Issues (🟢)
4. Track progress in the next review
5. Run `/code-review` again after making improvements

Reviews should be run:
- Weekly during active development
- Before major releases
- After architectural changes
- When adding significant features
