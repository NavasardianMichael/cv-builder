/**
 * Where the PDF's pages break, drawn on the editor's sheet.
 *
 * The editor's sheet is not the PDF's layout: it also shows empty fields as placeholders,
 * empty entries and tags, hidden and empty sections, an empty photo slot. So the breaks are
 * found on a copy rendered the way the PDF renders it (no edit context), then carried over
 * to the editor element by element: each break is pinned to an element of the copy and drawn
 * at the same offset from that element's twin on the sheet.
 *
 * On the copy, the breaks follow what Chrome does when it prints CvPage: each page holds A4
 * minus twice the repeated padding of the flow; a `break-inside: avoid` box (an entry, some
 * templates' sections) that the line cuts starts the next page (and breaks there only if it
 * is taller than a page); a section title is
 * kept with its first content (`break-after: avoid`); a paragraph breaks between lines, with
 * at least two lines on each side. Columns break where their own content does, so one break
 * can be drawn as a segment per column, and from then on each column pages on its own; what
 * follows them starts below the longest.
 */

/** Twin elements of the copy and the sheet carry the same key: items of a list, which look alike. */
const PAGE_BREAK_KEY = 'cvKey'

export type PageBreakSegment = { top: number; left: number; right: number }

/** Segments of one break, left to right: one across the sheet, or one per column. */
export type PageBreak = PageBreakSegment[]

export type PageBreaks = { pages: number; breaks: PageBreak[] }

export const NO_PAGE_BREAKS: PageBreaks = { pages: 1, breaks: [] }

type Box = { top: number; bottom: number; left: number; right: number; height: number }

/** Boxes in a sheet's own pixels (unscaled: the editor zooms it), from its top-left corner. */
type Frame = { box: (element: Element) => Box; rect: (rect: DOMRect) => Box }

const frameOf = (root: HTMLElement): Frame => {
  const origin = root.getBoundingClientRect()
  const ratio = origin.width / root.offsetWidth || 1
  const rect = ({ top, bottom, left, right }: DOMRect): Box => ({
    top: (top - origin.top) / ratio,
    bottom: (bottom - origin.top) / ratio,
    left: (left - origin.left) / ratio,
    right: (right - origin.left) / ratio,
    height: (bottom - top) / ratio,
  })
  return { rect, box: (element) => rect(element.getBoundingClientRect()) }
}

/** Sub-pixel slack: a box that ends exactly on the line is not cut by it. */
const EPSILON = 0.5
/** Chrome's default `orphans` and `widows`. */
const MIN_LINES = 2
/** A runaway guard; no CV has this many pages. */
const MAX_PAGES = 40

/** Where a page ends: a point of the copy, pinned to one of its elements. */
type Cut = {
  /** The guide's height on the copy. */
  at: number
  /** Where the next page's content starts: past the margin a break swallows. */
  resume: number
  anchor: Element
  /** `at` relative to the anchor's top. */
  offset: number
}

/** The innermost element that holds them all. */
const commonAncestor = (elements: Element[]): Element | null => {
  for (let ancestor = elements[0]?.parentElement ?? null; ancestor; ancestor = ancestor.parentElement) {
    const candidate = ancestor
    if (elements.every((element) => candidate.contains(element))) return elements.length > 1 ? candidate : elements[0]
  }
  return null
}

const isInFlowBlock = (element: Element): boolean => {
  const style = getComputedStyle(element)
  return style.display !== 'inline' && style.display !== 'none' && style.position !== 'absolute' && style.position !== 'fixed'
}

/** Line boxes of an element's text, top to bottom. */
const linesOf = (element: Element, frame: Frame): Array<{ top: number; bottom: number }> => {
  const range = document.createRange()
  range.selectNodeContents(element)
  const rects = Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => {
      const { top, bottom } = frame.rect(rect)
      return { top, bottom }
    })
    .sort((a, b) => a.top - b.top)
  const lines: Array<{ top: number; bottom: number }> = []
  for (const rect of rects) {
    const last = lines.at(-1)
    // Fragments on one line overlap vertically by most of their height.
    if (last && rect.top < last.bottom - Math.min(rect.bottom - rect.top, last.bottom - last.top) / 2) {
      last.top = Math.min(last.top, rect.top)
      last.bottom = Math.max(last.bottom, rect.bottom)
    } else lines.push({ ...rect })
  }
  return lines
}

/**
 * Finds the copy's page breaks and draws them on the sheet. `printed` and `sheet` are the
 * `.cv-root` of the print-like copy and of the editor's sheet.
 */
export const measurePageBreaks = (printed: HTMLElement, sheet: HTMLElement, pageHeight: number): PageBreaks => {
  const printedBody = printed.querySelector('.cv-body')
  const sheetBody = sheet.querySelector('.cv-body')
  if (!printedBody || !sheetBody) return NO_PAGE_BREAKS

  const frame = frameOf(printed)
  const { box } = frame
  const sheetFrame = frameOf(sheet)
  const pad = printed.querySelector<HTMLElement>('.cv-flow-pad')?.offsetHeight ?? 0
  const pageContent = pageHeight - 2 * pad
  const end = box(printedBody).bottom
  if (pageContent <= 0) return NO_PAGE_BREAKS

  /** Where a column's content ends: a grid stretches it to its row, past its last child. */
  const contentEnd = (column: Element): number => {
    const children = Array.from(column.children).filter((child) => box(child).height > 0 && isInFlowBlock(child))
    if (!children.length) return box(column).bottom
    const { paddingBottom, borderBottomWidth } = getComputedStyle(column)
    const last = Math.max(...children.map((child) => box(child).bottom))
    return Math.min(box(column).bottom, last + parseFloat(paddingBottom) + parseFloat(borderBottomWidth))
  }

  /** The innermost boxes the line runs through, one per column (or per cell of a row). */
  const crossedLeaves = (element: Element, line: number): Element[] => {
    const crossed = Array.from(element.children).filter((child) => {
      const { top, bottom } = box(child)
      return top < line - EPSILON && bottom > line + EPSILON && isInFlowBlock(child)
    })
    return crossed.length ? crossed.flatMap((child) => crossedLeaves(child, line)) : [element]
  }

  /**
   * The page's end in a box the line runs through, before any rule moves it up; null when
   * the line only runs through the box's empty end (a padding, a grid column stretched to
   * its row): its content ends on this page.
   */
  const cutIn = (leaf: Element, line: number, start: number): Cut | null => {
    const leafBox = box(leaf)
    const blocks = Array.from(leaf.children).filter((child) => box(child).height > 0 && isInFlowBlock(child))
    if (blocks.length) {
      // The line runs through a gap between child boxes: the margin there is dropped.
      const below = blocks.filter((child) => box(child).top >= line - EPSILON).sort((a, b) => box(a).top - box(b).top)[0]
      return below ? { at: line, resume: box(below).top, anchor: below, offset: line - box(below).top } : null
    }

    // Text: the break falls between lines, never through one.
    const lines = linesOf(leaf, frame)
    let kept = lines.filter((entry) => entry.bottom <= line + EPSILON).length
    if (kept === lines.length) return { at: line, resume: line, anchor: leaf, offset: line - leafBox.top }
    const strict = kept
    kept = Math.min(kept, lines.length - MIN_LINES)
    if (kept < MIN_LINES) kept = 0
    let at = kept ? lines[kept].top : leafBox.top
    // A paragraph taller than what is left of the page has to break anyway.
    if (at <= start + EPSILON) at = strict ? lines[strict].top : line
    return { at, resume: at, anchor: leaf, offset: at - leafBox.top }
  }

  /** The outermost unbreakable box the line cuts: it moves to the next page. */
  const keptWhole = (leaf: Element, line: number, start: number): Cut | null => {
    let whole: Element | null = null
    for (let element: Element | null = leaf; element && element !== printedBody; element = element.parentElement) {
      const { top } = box(element)
      const breakInside = getComputedStyle(element).breakInside
      if ((breakInside === 'avoid' || breakInside === 'avoid-page') && top > start + EPSILON && top < line) {
        whole = element
      }
    }
    if (!whole) return null
    const { top } = box(whole)
    return { at: top, resume: top, anchor: whole, offset: 0 }
  }

  /** A section title left alone at the page's foot goes down with its content. */
  const withTitle = (cut: Cut, start: number): Cut => {
    const section = cut.anchor.closest('.cv-section')
    const title = section?.querySelector(':scope > .cv-section-title')
    const body = section?.querySelector(':scope > .cv-section-body')
    if (!title || !body) return cut
    const titleBox = box(title)
    if (titleBox.bottom > cut.at + EPSILON || titleBox.top <= start + EPSILON) return cut
    const first = Array.from(body.children).find((child) => box(child).height > 0 && isInFlowBlock(child)) ?? body
    if (box(first).top < cut.at - EPSILON) return cut
    return { at: titleBox.top, resume: titleBox.top, anchor: title, offset: 0 }
  }

  /**
   * Content that pages on its own: the whole body at first; once columns break at different
   * heights, each column, with what follows them (`group.after`) waiting until the last one
   * ends. `start` is where the current page's part of it begins.
   */
  type Flow = { root: Element; start: number; end: number; group: Group | null }
  type Group = { open: number; endPage: number; endOffset: number; resumeAt: number; after: Flow }

  const cuts: Cut[][] = []
  let flows: Flow[] = [{ root: printedBody, start: pad, end, group: null }]
  while (flows.length && cuts.length < MAX_PAGES) {
    const page = cuts.length
    const pageCuts: Cut[] = []
    const next: Flow[] = []
    const queue = [...flows]

    const finish = (flow: Flow, offset: number): void => {
      const { group } = flow
      if (!group) return
      if (page > group.endPage) Object.assign(group, { endPage: page, endOffset: offset })
      else group.endOffset = Math.max(group.endOffset, offset)
      if (--group.open) return
      // The last column has ended: what comes after them starts below the longest, on this page.
      const { after } = group
      if (after.end - group.resumeAt <= 1) finish(after, group.endOffset)
      else queue.push({ ...after, start: group.resumeAt - group.endOffset })
    }

    while (queue.length) {
      const flow = queue.shift() as Flow
      if (flow.end - flow.start <= pageContent + 2) {
        finish(flow, flow.end - flow.start)
        continue
      }
      const line = flow.start + pageContent
      const leaves: Element[] = []
      const flowCuts: Cut[] = []
      for (const leaf of crossedLeaves(flow.root, line)) {
        const cut = keptWhole(leaf, line, flow.start) ?? cutIn(leaf, line, flow.start)
        if (!cut) continue
        leaves.push(leaf)
        flowCuts.push(withTitle(cut, flow.start))
      }
      if (!flowCuts.length) {
        finish(flow, pageContent)
        continue
      }
      pageCuts.push(...flowCuts)
      const resumes = flowCuts.map((cut) => cut.resume)
      const advance = (resume: number): number => (resume > flow.start + 1 ? resume : line)

      const common = commonAncestor(leaves)
      const crossing = common ? Array.from(common.children).filter((child) => leaves.some((leaf) => child.contains(leaf))) : []
      if (Math.max(...resumes) - Math.min(...resumes) <= 1 || !common || crossing.length < 2) {
        next.push({ ...flow, start: advance(Math.max(...resumes)) })
        continue
      }

      // Columns break at different heights: each pages on from its own break.
      const rowTop = Math.min(...crossing.map((child) => box(child).top))
      const columns = Array.from(common.children).filter((child) => {
        const { top, bottom, height } = box(child)
        return height > 0 && top < line && bottom > rowTop && isInFlowBlock(child)
      })
      const group: Group = {
        open: 0,
        endPage: -1,
        endOffset: 0,
        resumeAt: Math.max(...columns.map((column) => box(column).bottom)),
        after: flow,
      }
      for (const column of columns) {
        const own = flowCuts.filter((_, index) => column.contains(leaves[index]))
        if (!own.length) continue
        group.open++
        next.push({ root: column, start: advance(Math.max(...own.map((cut) => cut.resume))), end: contentEnd(column), group })
      }
      // Columns that end above the line end on this page.
      for (const column of columns) {
        if (!flowCuts.some((_, index) => column.contains(leaves[index]))) {
          group.endPage = page
          group.endOffset = Math.max(group.endOffset, contentEnd(column) - flow.start)
        }
      }
    }

    flows = next
    if (pageCuts.length) cuts.push(pageCuts)
    else break
  }

  const width = sheet.offsetWidth
  const breaks = cuts.map((pageCuts) =>
    toSegments(
      pageCuts.map((cut) => onSheet(cut, printedBody, sheetBody, box, sheetFrame.box)),
      sheetFrame.box,
      width
    )
  )
  return { pages: breaks.length + 1, breaks }
}

const EDITOR_CLASSES = new Set(['cv-editable', 'cv-editable-multiline', 'cv-block-editable', 'cv-item-editable', 'cv-level-button'])

/** What an element is, by its classes minus the editor's own (`is-*` are states). */
const signatureOf = (element: Element): string => {
  const classes = Array.from(element.classList).filter((name) => !EDITOR_CLASSES.has(name) && !name.startsWith('is-'))
  return classes.length ? classes.join(' ') : element.tagName
}

const keyOf = (element: Element): string | undefined => (element as HTMLElement).dataset?.[PAGE_BREAK_KEY]

/**
 * A copy element's twin among the sheet element's children: by key, else the n-th alike. A
 * keyed item the sheet places elsewhere is still found, anywhere on the sheet.
 */
const twinOf = (element: Element, sheetParent: Element, sheetBody: Element): Element | null => {
  const children = Array.from(sheetParent.children)
  const key = keyOf(element)
  if (key) {
    const isTwin = (other: Element): boolean => keyOf(other) === key
    return children.find(isTwin) ?? Array.from(sheetBody.querySelectorAll('[data-cv-key]')).find(isTwin) ?? null
  }
  const signature = signatureOf(element)
  const siblings = Array.from(element.parentElement?.children ?? []).filter((child) => signatureOf(child) === signature)
  return children.filter((child) => signatureOf(child) === signature)[siblings.indexOf(element)] ?? null
}

/** A cut, on the sheet: at the same offset from the anchor's twin, or from its nearest ancestor's that has one. */
const onSheet = (
  cut: Cut,
  printedBody: Element,
  sheetBody: Element,
  box: (element: Element) => Box,
  sheetBox: (element: Element) => Box
): { top: number; element: Element } => {
  const path: Element[] = []
  for (let element: Element | null = cut.anchor; element && element !== printedBody; element = element.parentElement) path.unshift(element)
  let printed = printedBody
  let twin = sheetBody
  for (const step of path) {
    const next = twinOf(step, twin, sheetBody)
    if (!next) break
    printed = step
    twin = next
  }
  const at = box(cut.anchor).top + cut.offset
  return { top: sheetBox(twin).top + at - box(printed).top, element: twin }
}

const round = (value: number): number => Math.round(value * 2) / 2

/**
 * One line across the sheet when every column breaks at one height (within a couple of
 * pixels); otherwise a segment per column, meeting halfway between columns.
 */
const toSegments = (points: Array<{ top: number; element: Element }>, sheetBox: (element: Element) => Box, width: number): PageBreak => {
  const tops = points.map((point) => point.top)
  if (Math.max(...tops) - Math.min(...tops) <= 2) return [{ top: round(Math.min(...tops)), left: 0, right: width }]

  // A column is the ancestor of a point just below the one ancestor all points share.
  const chains = points.map((point) => {
    const chain: Element[] = []
    for (let element: Element | null = point.element; element; element = element.parentElement) chain.unshift(element)
    return chain
  })
  let depth = 0
  while (chains.every((chain) => chain[depth + 1] && chain[depth + 1] === chains[0][depth + 1])) depth++
  const columns = new Map<Element, number>()
  points.forEach((point, index) => {
    const column = chains[index][depth + 1] ?? point.element
    columns.set(column, Math.min(columns.get(column) ?? Infinity, point.top))
  })
  if (columns.size < 2) return [{ top: round(Math.min(...tops)), left: 0, right: width }]

  const spans = Array.from(columns, ([column, top]) => {
    const { left, right } = sheetBox(column)
    return { top, left, right }
  }).sort((a, b) => a.left - b.left)
  return spans.map((span, index) => ({
    top: round(span.top),
    left: index ? round((spans[index - 1].right + span.left) / 2) : 0,
    right: index < spans.length - 1 ? round((span.right + spans[index + 1].left) / 2) : width,
  }))
}

export const samePageBreaks = (a: PageBreaks, b: PageBreaks): boolean => JSON.stringify(a) === JSON.stringify(b)
