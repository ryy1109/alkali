# Component integration

Primary package: @ryy1109/web-components 1.1.3.

The package's dist/index.js includes "use client". Stateful UI lives in client
components, while layouts and data loading can remain server components.
Only the public package export is used. node_modules is never edited.
The published README is a Vite starter README; implementation and declaration
files were inspected directly.

Load @ryy1109/web-components/theme.css before app/globals.css.
CSS variables provide the package theme; MUI ThemeProvider aligns underlying
controls and dialogs. AppRouterCacheProvider handles streamed Emotion styles.
DateInput uses the Dayjs localization adapter.

## Actual reuse

- Header: public and authenticated header.
- Button: primary, secondary, icon-only, loading, and destructive actions.
- Input: authentication, subjects, task title, resource link, effort estimate, and search.
- Card: authentication panel, subject cards, dashboard summaries, public content.
- Checkbox: Privacy Policy acknowledgement and task completion.
- Breadcrumbs: planner hierarchy.
- Modal: subject/task forms, deletion confirmations, profile, calendar daily deadlines.
- Table: upcoming deadlines and task listing.
- Select: subject, status, priority, filters.
- Textarea: task descriptions.
- DateInput: due dates and optional planned start dates.
- Section: grouped content and empty states.
- Spinner: loading the protected workspace.

Button variants/sizes are capitalized; Card variants/sizes are lowercase.
Card main content uses the content prop. Modal action variants are MUI variants.
Table sorting/pagination callbacks are controlled by application code.
The package's TableColumn.render row type is loose; callbacks use concrete
application row types.

The Checkbox link implementation sets target=_blank and rel=noopener noreferrer.
The acknowledgement form stays open when the policy opens.
The compact checkbox styles remove package zoom and reduce label size.

Header's package CSS hides primary actions on narrow screens; shared styles
restore them. Navigation is a separate accessible responsive planner sidebar.
MUI icons fill icon capabilities, and providers handle framework integration.
No replacement component system has been introduced.

The deadline calendar uses a semantic month table with package Section, Button,
and Modal controls. The package does not export a month calendar, so its grid
is application-owned and requires no additional calendar dependency.

Section renders its title as a heading and emptyMessage as a paragraph. Pass plain text titles and use children for rich empty-state layouts to preserve valid HTML.
