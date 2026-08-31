# Typography — how to ask for a change

The problem this solves: the Figma artboard is drawn at one width (1920), so
there is no name in it for "the size this text should be". On the site there
is. Every piece of text renders at one of twelve named steps, and the fastest
way to request a change is to name the step you want.

> **Change sizes in one place only.** The numbers live in the `@theme` block of
> [`src/styles/global.css`](../src/styles/global.css). Everything below is a way
> of *reading* them, never a second copy.

## The three tools

### 1. The inspector — `Shift+T` on any page (dev only)

Hover any text: it shows the step, the live px size at the current window
width, the leading, and the component + line it was written on. Click it and
that reference goes to your clipboard, e.g.

```
src/components/Hero.astro:34 — text-lead (20px @ 1920px) — "We design the system, then run it."
```

Paste that into a message and say what you want instead. That's the whole
workflow — no need to describe where the text is or which page it's on.

If the chip says **`off-scale`**, that text is on a hardcoded size rather than
a token. Worth flagging when you see it.

### 2. The reference page — `/styleguide/type`

Every step rendered side by side at the current window width, with its live px
value, what it's for, and — scanned from source, so it can't go stale — every
file that uses it. Resize the window to see how each step behaves between
mobile and desktop. It ends with a list of every arbitrary `text-[…]` size in
the codebase.

### 3. The names themselves

| Step | 375px → 1920px | For |
| --- | --- | --- |
| `text-display` | 44 → 88 | Hero headline. One per page, at most. |
| `text-h1` | 34 → 56 | Page/section headline, big pull-quotes. |
| `text-h2` | 27 → 38 | Section headline inside a page. |
| `text-h3` | 22 → 26 | Card titles, sub-section headings. |
| `text-h4` | 17.5 → 19 | Smallest heading — list/row labels. |
| `text-lead` | 19 → 20 | **Deck**: the 1–3 line paragraph under a heading. |
| `text-body` | 16 → 18 | Long-form running copy. Also Selected Projects row-2 card copy. |
| `text-body-sm` | 14 → 15 | Secondary copy, captions, fine print. |
| `text-nav` | 20 (fixed) | Desktop nav links — deliberately not fluid. |
| `text-separator` | 24 → 32 | One-off: the `·` in ProjectsFilter. |
| `text-meta` | 12.5 → 13 | Metadata — dates, counters, tags. |
| `text-eyebrow` | 12 → 12.5 | Uppercase label above a heading. |

`lead` vs `body` is the one distinction worth holding on to even though `body`
is no longer the larger, looser-leading step: `lead` is a deck under a
heading — short, 1–3 lines, sits close under a headline. `body` is running
prose that can wrap over many lines. Swapping one for the other because the
size looks close produces the wrong rhythm even when the px number matches.

## Three ways to phrase a request

1. **By step** — the precise one. *"Systems hero deck → `text-h4` instead of
   `text-lead`."*
2. **By clipboard reference** — paste what the inspector copied, then say what
   you want. Best when you don't want to look up the step name.
3. **By anchor pair** — when no existing step fits: *"Card titles should be
   20px on mobile and 30px at 1920."* That's a request to re-anchor `text-h3`,
   or to add a step; say which.

Anything vaguer ("a bit bigger", "like the other page") means a round trip to
work out which text you mean.

## When a change is bigger than one element

Because the steps are shared, changing a token changes it everywhere — the
`/styleguide/type` usage list tells you how far a change reaches before it's
made. If a step is right in nine places and wrong in one, the fix is to move
that one element to a different step, not to re-anchor the token.
