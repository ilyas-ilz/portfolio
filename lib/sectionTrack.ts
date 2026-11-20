/**
 * One definition of "the active section", shared by the nav and the flight
 * guide so they always agree, in both scroll directions.
 *
 * A section becomes active once its top edge passes the middle of the
 * viewport. The last section is clamped so it can still become active on a
 * page whose footer is too short to bring its top up to the middle.
 */

export interface SectionTrack {
  /** ids in DOM (visual) order */
  ids: string[];
  els: HTMLElement[];
  /** scroll offset at which section i becomes active (starts[0] = 0) */
  starts: number[];
  maxScroll: number;
}

export function measureSections(ids: readonly string[]): SectionTrack | null {
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

  const found = ids
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)
    .map((el) => ({ el, top: el.getBoundingClientRect().top + scrollY }))
    .sort((p, q) => p.top - q.top);
  if (found.length === 0) return null;

  const starts = found.map((s, i) => (i === 0 ? 0 : Math.min(maxScroll - 1, Math.max(0, s.top - vh * 0.5))));
  for (let i = 1; i < starts.length; i++) starts[i] = Math.max(starts[i], starts[i - 1] + 1);

  return { ids: found.map((s) => s.el.id), els: found.map((s) => s.el), starts, maxScroll };
}

/** Index (into track.ids) of the section active at a scroll offset. */
export function sectionIndexAt(track: SectionTrack, scrollY: number): number {
  let i = 0;
  while (i + 1 < track.starts.length && scrollY >= track.starts[i + 1]) i++;
  return i;
}
