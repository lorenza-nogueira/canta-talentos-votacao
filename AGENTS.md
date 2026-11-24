<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Website import
- Keep the recovered Figma Make experience and its view functions in the home route; the Figma editor is not the application.
- Retain the actual source stylesheet separately and express its colors through global semantic tokens to preserve the captured layout.
- Persist votes in Cloud behind validated server functions and opaque HttpOnly voter-session cookies; identification is self-declared, not verified email ownership, to match the requested name/email-only flow.
- Keep voter records locked to service-role access; expose only aggregate totals publicly and enforce one vote per normalized email and talent in PostgreSQL to prevent duplicate counting.
- Mirror active votes to fixed Google Sheets rows using each immutable vote ID and RAW values, clearing withdrawn rows; retry unsynced versions on vote actions and mark only the exported revision to avoid duplicate counting and lost changes.
- Keep the recovered experience and legacy view functions in the home route, and isolate voting rules, server calls, and the identification form in focused modules for testing and secure boundaries.
- Share the home feed with the voting entry route and gate voting through a reusable identification dialog; confirm the server reads the session before dismissing it to avoid silent registration failures.
- Use Secure, SameSite=None, Partitioned HttpOnly voter cookies on HTTPS, and matching deletion attributes; cross-site preview frames must retain identification without exposing tokens to browser scripts.
- Soft-withdraw votes under the validated voter session, retaining the unique email/talent row for reactivation; public totals and personal selections count only active rows, and state changes obey the voting deadline.
- Reserve media geometry with measured asset dimensions and refine from loaded image/video metadata in AdaptiveMedia; keep each asset's natural ratio and contain sizing so feed and details never crop content.
- Use TalentPreview for both feed and details: uploaded videos play inline, PDF/external-video covers link directly to their material, and ordinary images retain the details action to avoid nested interactive controls.
- Normalize YouTube video links and resolve submitted channel links to the matching preview video for both covers and material buttons so neither opens the channel by mistake.
- Use MaterialAccess for PDF and social-player access: show official embeds in a dialog to avoid sandbox-inherited popup blocks without weakening browser protections; register fixed uploaded PDFs with their prebuilt page images and document title, retain the original downloadable asset, and use dynamic pdf.js only for documents without page previews.
- Keep participant IDs stable in the public registration snapshot and extend the database voting constraint when adding an ID, because the server validator and spreadsheet export both read that snapshot.
- Retire removed registrations from the active snapshot without reusing IDs or deleting historical votes; the active snapshot defines voting eligibility and tally rows.
- Register batch-imported PDFs in a data manifest with prebuilt page images so MaterialAccess can read them without fetching private Drive links.
- Keep category scrolling native for touch and trackpads, with a synchronized design-system slider as the always-visible scrollbar because operating systems can hide native scrollbar indicators.
- Bound the media inside the project details dialog so the participant, category, description and material links stay visible without scrolling; unbounded natural-ratio media fills the panel and hides the project's information.
- Draw the project details dialog's vertical scrollbar in the DOM (right-edge track with a thumb synced to the scroll position) and keep the native bar hidden inside the dialog, because browsers and operating systems can hide native indicators and two bars must never show at once.
