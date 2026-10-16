# Branching and review

Promotion: feature/* -> integration -> development -> main.

Start independent features from synchronized integration. Feature branches that
depend on an unmerged feature may be stacked temporarily; review and merge the
parent first, using merge commits, so shared commits remain recognizable.

Use Create a merge commit for feature merges and long-lived branch promotions.
Do not squash or rebase promotions. Do not force-push shared branches.
Merge into integration only after CI and review pass. Promote tested integration
to development in a separate PR. Main changes only for an intentional release.

Recommended GitHub rules for main, development, and integration:

- Require a pull request.
- Require the CI status named Lint, types, and build.
- Require conversations to be resolved.
- Block force pushes and branch deletion.
- Require review when another reviewer is available.

Rules may depend on repository visibility and GitHub plan. They are not claimed
as configured merely because documented here.
