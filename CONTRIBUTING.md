# Contributing

## Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Update the `CHANGELOG.md` with your changes under `[Unreleased]`
4. Open a PR and get it reviewed
5. Merge to `main`
6. Run the release script

## Changelog

Before merging, add your changes to the `[Unreleased]` section of `CHANGELOG.md`.

### Writing Changelog Entries

Write entries manually or use an LLM with this prompt:

```
Create a release commit

1) Look at the diff against the origin branch
   - If on a feature branch already check against main/master
   - Otherwise compare against origin of main/master
2) Update the CHANGELOG with these RULES:
   - Keep it minimal and easy to read for humans
   - No LLM talk
   - Dont get too much into the details about files
   - Do not mention what has been tested
   - Make the message contain semantic meaning on not just a description of the changed lines of code
   - Do not mention updating of changelog
3) Create a commit with the commit message
   - Stage the changelog
   - Only use staged files
   - Do NOT ADD Co-Authored-By:
   - Do NOT override the author
4) Create a feature branch in git flow convention
5) Create a PR with description and title from the changelog
   - Use same rules as for the CHANGELOG
   - Do not include a section with the test plan

Rules:
   - When making a new commit just include the changelog with that commit otherwise create a commit just for the changelog
   - Do not mention updating of changelog
   - Do not mention any adding of tests or documentation this is self-explanatory

### What NOT to Include

\`\`\`markdown
# Bad: Self-explanatory test coverage
Added comprehensive test coverage for custom schema directory functionality

# Bad: Self-explanatory documentation
- Documentation for bundling from custom schema directories
`\`\`\
```

## Releasing

Releases are done from the `main` branch using the release script.

### Prerequisites

1. Be logged into npm with access to `@tokens-studio` org:

   ```sh
   npm login
   ```

2. Ensure you have no uncommitted changes
3. Be on the `main` branch

### Running the Release

```sh
# Patch release (0.3.2 -> 0.3.3)
npm run release patch

# Minor release (0.3.2 -> 0.4.0)
npm run release minor

# Preview what would happen
npm run release patch --dry-run
```

The release script will:

1. Update the changelog (moves `[Unreleased]` to new version)
2. Run tests
3. Build the project
4. Bump version and create git tag
5. Publish to npm
6. Push commits and tags to remote
