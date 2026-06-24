# Panel Prompt Template

Per-panel prompt assembled by `generate_panels.py`. Concatenated as:

```
{base_style.md content}

PANEL CONTEXT:
Issue: {issue_title} ({stage_id})
Page {page_number}, panel {panel_number} of {total_panels_on_page}.

CHARACTERS IN THIS PANEL:
{for each character_id in panel.characters: inject canon.md + ref images}

ART DIRECTION:
{panel.art_prompt}

LAYOUT NOTES:
- Frame this as one panel within a manga-style page.
- Leave room for a speech bubble in the {bubble_zone} area; bubble will be
  typeset in post-processing. Do NOT render the speech text in the art.
- Approximate aspect ratio: {aspect_ratio} (default 4:3 for narrow panels,
  16:9 for establishing shots).

CONTINUITY:
- Maintain character appearance from previous panels and prior issues.
- Lighting should match the page's mood (set in art_notes of issue.yaml).

SFX (if present):
- Render the following SFX as art-baked all-caps lettering, manga-style:
  {panel.sfx}
- Use the single-story `a` rule even for SFX letters.
```

## Notes for the prompt builder

- `bubble_zone`: heuristic — top-left if speaker is on the left, top-right
  if on the right, top-center if a single character. Override per panel via
  `panel.bubble_zone` if needed.
- `aspect_ratio`: from `panel.aspect_ratio` if set, else default by panel
  count: 1 panel → 16:9, 2-3 panels → 4:3, 4+ panels → 1:1.
- Re-roll seeds: `generate_panels.py` stores the model seed per panel so
  `regenerate_panel.py` can reproduce or alter it surgically.
