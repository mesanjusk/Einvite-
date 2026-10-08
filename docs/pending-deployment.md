# Combined admin studio release — October 8, 2026

The user authorized a new PR, merge, and one combined production deployment on October 8. The earlier deployment hold is superseded.

This release combines the account navigation menu, private/published website themes, removal of public fallback themes, full unsaved theme preview and media status checks, and the desktop theme studio. The studio has section navigation at the top, tools on the left, settings on the right, and Templates/Video/Music/Content libraries in the footer. It supports editing preloaded text, duplication, deletion, hide/restore, typography, positioning, and undo/redo. Customer invitation rendering remains mobile friendly.

Verification: 26 focused tests pass across seven files. Browser checks exercised unsaved content editing, styling, drag positioning, hide/restore, duplicate/delete, undo, library switching without navigation, valid/failed selected media, and the full guest preview. Disposable verification routes and media were removed before release. A fresh production compilation passed after the earlier transient Google Fonts response failure; no dependency patch is part of the release.

Release target: mesanjusk/Einvite-, production branch claude/new-session-mz697f, Vercel project prj_GSMHWzt7BQRAiF0SZCRdEbVIhP0y, team sanju-sks-projects, domain invite.sanjusk.in. The release branch has Git deployments disabled in vercel.json to avoid consuming a preview deployment before the production merge.

Authenticated upload/save was not exercised against the production database during sandbox validation. Reports and Instagram retain their existing workflows; a full redesign of those screens is not included in this theme editor release.
