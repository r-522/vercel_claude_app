# Documentation Checklist

Run when making any significant change to the codebase.

---

## CLAUDE.md

- [ ] Updated if a new hook was added (name, location, purpose, usage pattern)
- [ ] Updated if a new architectural pattern was established (e.g., how to handle a new concern)
- [ ] Updated if a new file was created that changes the directory structure described in the Architecture section
- [ ] Updated if a key constraint or convention was added or changed

---

## context/ Files

- [ ] `context/patterns.md` updated if a new pattern was introduced (e.g., new ref pattern, new hook composition pattern)
- [ ] `context/anti-patterns.md` updated if a new anti-pattern was identified (e.g., a mistake that was made and reverted, a tempting but wrong approach)
- [ ] `context/decisions.md` updated if an architectural decision was made (include what was decided, why, and what alternatives were rejected)
- [ ] `context/common-errors.md` updated if a new bug or error pattern was encountered (TypeScript error, runtime error, Vercel deploy error) so it can be recognised and fixed faster next time
- [ ] `context/architecture.md` updated if the data flow, component hierarchy, or module boundaries changed

---

## Environment Variables

- [ ] `.env.local.example` updated if a new environment variable was added (include the variable name and a one-line description of its purpose and format; never include a real value)

---

## Code Comments

- [ ] Comments explain WHY the code does something non-obvious — not WHAT it does
- [ ] No comments that restate what the code already makes clear
- [ ] `// eslint-disable` directives have a comment explaining the intentional exception (e.g., `// transport must not be recreated after mount`)

---

## Claude Code Environment Files

- [ ] New agent definitions in `.claude/agents/` are cross-referenced from `CLAUDE.md` if they affect how tasks should be delegated
- [ ] New skill files in `.claude/skills/` are cross-referenced from `CLAUDE.md` if they affect standard workflows
- [ ] New rule files in `.claude/rules/` are cross-referenced from `CLAUDE.md` so they are discoverable
- [ ] New command files in `.claude/commands/` are listed in `CLAUDE.md` under the slash commands section
- [ ] New checklist files in `.claude/checklists/` are listed in `CLAUDE.md` under the checklists section
- [ ] New template files in `.claude/templates/` are referenced wherever they should be used (e.g., in `architecture.md` checklist for ADRs)
