/**
 * Seamless, draggable, infinitely-looping horizontal marquee.
 *
 * Adapted from GSAP's official `horizontalLoop` helper
 * (https://gsap.com/docs/v3/HelperFunctions/#loop), trimmed to what this
 * project actually uses: autoplay, drag-with-inertia, and snapping to the
 * nearest item on release. The helper's carousel navigation (next /
 * previous / toIndex / center / onChange) is dropped.
 *
 * Why not a CSS keyframe (what this replaced): a CSS translate can loop,
 * but it can't be grabbed, thrown, or snapped. This animates each item's
 * own xPercent on a shared timeline and wraps each item individually once
 * it passes the left edge, so the strip stays seamless while a Draggable
 * proxy scrubs that same timeline.
 *
 * Measure note: items are measured, not their images. Every cell has a
 * fixed width in CSS, so the loop geometry is correct even before lazy
 * images decode — no layout shift mid-loop.
 */
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

export interface HorizontalLoopConfig {
  /** Roughly 100px per second at speed 1. */
  speed?: number
  /** Start paused — used for the reduced-motion path, where drag still works. */
  paused?: boolean
  draggable?: boolean
  /** Extra gap after the last item before the first wraps back in. */
  paddingRight?: number
}

export interface HorizontalLoop {
  timeline: gsap.core.Timeline
  /**
   * Eases the loop forward by exactly one item, always moving the same
   * visual direction even across the wrap point — the raw item `time()` for
   * index 0 is numerically SMALLER than the last item's, so a naive
   * `tweenTo(times[0])` from the last item would play backward. `modifiers`
   * keeps the tween's rendered time wrapped into [0, duration) every frame
   * while the underlying tween value itself keeps counting up past
   * `duration`, which is what makes the direction consistent through the
   * seam. Adapted from GSAP's own horizontalLoop helper's `toIndex`.
   */
  next: (vars?: gsap.TweenVars) => gsap.core.Tween
  destroy: () => void
}

export function horizontalLoop(
  itemsInput: gsap.DOMTarget | HTMLCollection,
  config: HorizontalLoopConfig = {}
): HorizontalLoop | null {
  const items = gsap.utils.toArray<HTMLElement>(itemsInput as gsap.DOMTarget)
  const length = items.length
  if (length === 0) return null

  const startX = items[0]!.offsetLeft
  const times: number[] = []
  const widths: number[] = []
  const spaceBefore: number[] = []
  const xPercents: number[] = []
  const pixelsPerSecond = (config.speed ?? 1) * 100
  const snap = gsap.utils.snap(1)

  let totalWidth = 0
  let timeWrap: (value: number) => number = (v) => v
  let proxy: HTMLDivElement | undefined
  let draggable: Draggable | undefined

  const tl = gsap.timeline({
    repeat: -1,
    paused: config.paused,
    defaults: { ease: 'none' },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100)
    },
  })

  const getTotalWidth = () => {
    const last = items[length - 1]!
    return (
      last.offsetLeft +
      (xPercents[length - 1]! / 100) * widths[length - 1]! -
      startX +
      spaceBefore[0]! +
      last.offsetWidth * (gsap.getProperty(last, 'scaleX') as number) +
      (config.paddingRight ?? 0)
    )
  }

  const populateWidths = () => {
    const container = items[0]!.parentNode as HTMLElement
    let b1 = container.getBoundingClientRect()
    items.forEach((el, i) => {
      widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px') as string)
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, 'x', 'px') as string) / widths[i]!) * 100 +
          (gsap.getProperty(el, 'xPercent') as number)
      )
      const b2 = el.getBoundingClientRect()
      spaceBefore[i] = b2.left - (i ? b1.right : b1.left)
      b1 = b2
    })
    gsap.set(items, { xPercent: (i: number) => xPercents[i]! })
    totalWidth = getTotalWidth()
  }

  const populateTimeline = () => {
    tl.clear()
    for (let i = 0; i < length; i++) {
      const item = items[i]!
      const curX = (xPercents[i]! / 100) * widths[i]!
      const distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0]!
      const distanceToLoop = distanceToStart + widths[i]! * (gsap.getProperty(item, 'scaleX') as number)
      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]!) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0
      )
        .fromTo(
          item,
          { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]!) * 100) },
          {
            xPercent: xPercents[i]!,
            duration: (totalWidth - distanceToLoop) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond
        )
        .add('label' + i, distanceToStart / pixelsPerSecond)
      times[i] = distanceToStart / pixelsPerSecond
    }
    timeWrap = gsap.utils.wrap(0, tl.duration())
  }

  /** Index of the value in `values` closest to `value`, accounting for wrap. */
  const getClosest = (values: number[], value: number, wrap: number) => {
    let i = values.length
    let closest = 1e10
    let index = 0
    while (i--) {
      let d = Math.abs(values[i]! - value)
      if (d > wrap / 2) d = wrap - d
      if (d < closest) {
        closest = d
        index = i
      }
    }
    return index
  }

  const refresh = (deep?: boolean) => {
    const progress = tl.progress()
    tl.progress(0, true)
    populateWidths()
    if (deep) populateTimeline()
    tl.progress(progress, true)
  }

  const next = (vars: gsap.TweenVars = {}) => {
    // Recomputed from the timeline's actual current time rather than a
    // remembered index — a manual drag moves `tl`'s playhead without going
    // through this function, so trusting a stale index would tween from the
    // wrong item after any drag.
    const curIndex = getClosest(times, tl.time(), tl.duration())
    const newIndex = curIndex + 1 >= length ? 0 : curIndex + 1
    let time = times[newIndex]!
    // Crossing the wrap point (last item → first item): the target time is
    // numerically behind the current one, which would play the tween
    // backward. Extending the target past `duration` and wrapping the
    // RENDERED time every frame (via `modifiers`) keeps playback moving in
    // the same direction through the seam.
    if (newIndex === 0) {
      time += tl.duration()
      vars.modifiers = { time: timeWrap }
    }
    vars.overwrite = true
    return tl.tweenTo(time, vars)
  }

  const onResize = () => refresh(true)

  gsap.set(items, { x: 0 })
  populateWidths()
  populateTimeline()
  window.addEventListener('resize', onResize)
  tl.progress(1, true).progress(0, true) // pre-render for smoother first frames

  if (config.draggable) {
    proxy = document.createElement('div')
    const wrapProgress = gsap.utils.wrap(0, 1)
    let ratio = 0
    let startProgress = 0
    let lastSnap = 0
    let initChangeX = 0
    let wasPlaying = false

    const align = () => tl.progress(wrapProgress(startProgress + (draggable!.startX - draggable!.x) * ratio))

    draggable = Draggable.create(proxy, {
      trigger: items[0]!.parentNode as HTMLElement,
      type: 'x',
      inertia: true,
      // Inertia must not overshoot past a snap point and spring back — the
      // strip should settle straight onto the nearest logo.
      overshootTolerance: 0,
      onPressInit(this: Draggable) {
        const x = this.x
        gsap.killTweensOf(tl)
        wasPlaying = !tl.paused()
        tl.pause()
        startProgress = tl.progress()
        refresh()
        ratio = 1 / totalWidth
        initChangeX = startProgress / -ratio - x
        gsap.set(proxy!, { x: startProgress / -ratio })
      },
      onDrag: align,
      onThrowUpdate: align,
      snap(this: Draggable, value: number) {
        // A press+release mid-throw yanks proxy.x in onPressInit, which can
        // report a wild velocity; fall back to the last snap in that case.
        if (Math.abs(startProgress / -ratio - this.x) < 10) return lastSnap + initChangeX
        const time = -(value * ratio) * tl.duration()
        const wrappedTime = timeWrap(time)
        const snapTime = times[getClosest(times, wrappedTime, tl.duration())]!
        let dif = snapTime - wrappedTime
        if (Math.abs(dif) > tl.duration() / 2) dif += dif < 0 ? tl.duration() : -tl.duration()
        lastSnap = (time + dif) / tl.duration() / -ratio
        return lastSnap
      },
      onThrowComplete: () => {
        if (wasPlaying) tl.play()
      },
    })[0]
  }

  return {
    timeline: tl,
    next,
    destroy() {
      window.removeEventListener('resize', onResize)
      draggable?.kill()
      proxy?.remove()
      tl.kill()
    },
  }
}
