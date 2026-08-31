/**
 * Shared phase-step data shape for the Systems pages. "Our approach"
 * (PhasesScroll) renders a per-system `steps` array, and the case-study
 * template (src/pages/projects/[slug].astro) maps its own `approach` entries
 * onto the same shape — this type is the single source of truth for it, so
 * neither caller invents its own.
 *
 * A second, horizontal-carousel "Our approach" (SystemApproachStepper) used
 * to consume this too; it was retired in favour of one approach section per
 * page, and PhasesScroll absorbed its em-dash number convention (see that
 * component's `numberOf()`).
 */
export interface PhaseStep {
  number: string
  title: string
  description: string
}
