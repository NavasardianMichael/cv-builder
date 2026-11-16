#!/usr/bin/env node
/**
 * `pnpm content:video` — records the tutorial video (`public/content/video/`) from the real app:
 * choose a template, type on the CV, change colours and template, download the PDF.
 *
 * Needs the web and the API running (`pnpm dev`) and ffmpeg on the PATH (or FFMPEG). Uses the
 * API's Puppeteer. The captions, the title cards and the visible cursor are injected into the
 * page for the recording only; the app ships none of them. The music is synthesised by
 * `music.mjs` (original, no licence involved).
 *
 * Writes `<NAME>.mp4` (H.264 + AAC, 1920×1080, faststart), `<NAME>.jpg` (the poster) and
 * `<NAME>.vtt` (the captions, timed as recorded), and
 * prints the duration to put in the guide's `video` field (`src/content/guides`).
 */
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { musicWav } from './music.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const ORIGIN = (process.env.CONTENT_VIDEO_ORIGIN ?? 'http://localhost:7009').replace(/\/+$/, '')
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'
const FFPROBE = process.env.FFPROBE ?? 'ffprobe'
const NAME = 'inchpes-steghtsel-inqnakensagrakan'
const OUT_DIR = path.join(ROOT, 'public/content/video')
/** The layout size, in CSS pixels: what the app is laid out for while recording. */
const VIEW = { width: 1280, height: 720 }
/** Device pixels per CSS pixel: a 1280×720 layout captured as 1920×1080. */
const SCALE = 1.5
const OUT = { width: VIEW.width * SCALE, height: VIEW.height * SCALE }
const FPS = 30
/**
 * The finished video plays this many times faster than the recording: the app is recorded at
 * a pace a person follows, then sped up. What must stay readable (the title cards, the
 * download screen) is held longer while recording, so it lasts long enough after.
 */
const SPEED = 2
/** Recorded 4 px taller: the extra strip at the bottom carries the cue marker, cropped off at the end. */
const MARK_PX = 4
const MARK_DEVICE_PX = MARK_PX * SCALE
/** Cue n is drawn in the strip as grey 20 + 24n, readable back from the decoded frames. */
const markGrey = (index) => 20 + 24 * index
const DOMAIN = 'cv-builder.eapps.site'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Installed in every document of the recording: the overlay styles, a cursor that follows the
 * mouse (headless Chrome draws none), the caption pill, and the title cards. The current
 * caption survives navigations through sessionStorage.
 */
const OVERLAY = () => {
  const install = () => {
    if (document.getElementById('rec-style')) return
    const style = document.createElement('style')
    style.id = 'rec-style'
    style.textContent = `
      nextjs-portal { display: none !important; }
      #rec-cursor { position: fixed; z-index: 2147483647; left: 0; top: 0; width: 26px; height: 26px; pointer-events: none;
        transform: translate(-3px, -2px); filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
      body:has(#rec-card) #rec-cursor { opacity: 0; }
      #rec-cursor.down::after { content: ''; position: absolute; left: -14px; top: -14px; width: 34px; height: 34px; border-radius: 50%;
        background: rgba(242,140,40,.35); animation: rec-ring .45s ease-out forwards; }
      @keyframes rec-ring { from { transform: scale(.4); opacity: 1 } to { transform: scale(1.4); opacity: 0 } }
      #rec-caption { position: fixed; z-index: 2147483646; left: 50%; bottom: 28px; transform: translateX(-50%);
        max-width: 80vw; padding: 12px 26px; border-radius: 999px; background: rgba(20,24,45,.92); color: #fff;
        font: 600 22px/1.3 Mardoto, 'GHEA Grapalat', system-ui, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,.25);
        transition: opacity .35s; pointer-events: none; }
      #rec-caption:empty { opacity: 0; }
      #rec-card { position: fixed; inset: 0; z-index: 2147483646; display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 18px; background: #14182d; color: #fff; text-align: center; transition: opacity .6s;
        font-family: Mardoto, 'GHEA Grapalat', system-ui, sans-serif; }
      #rec-card .t { font-size: 54px; font-weight: 700; max-width: 1000px; line-height: 1.15; }
      #rec-card .s { font-size: 26px; color: #f2a65a; font-weight: 600; }
      #rec-card .d { font-size: 22px; color: rgba(255,255,255,.7); }
      #rec-marker { position: fixed; left: 0; right: 0; bottom: 0; height: 4px; z-index: 2147483647; pointer-events: none; }`
    document.head.append(style)
    const cursor = document.createElement('div')
    cursor.id = 'rec-cursor'
    cursor.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l15 11.2-6.6 1 3.9 6.9-2.6 1.4-3.9-6.9L5 20z" fill="#fff" stroke="#14182d" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const caption = document.createElement('div')
    caption.id = 'rec-caption'
    caption.textContent = sessionStorage.getItem('rec-caption') ?? ''
    const marker = document.createElement('div')
    marker.id = 'rec-marker'
    marker.style.background = sessionStorage.getItem('rec-mark') ?? 'rgb(20,20,20)'
    document.body.append(cursor, caption, marker)
    const at = sessionStorage.getItem('rec-xy')
    if (at) {
      const [x, y] = at.split(',')
      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
    }
    addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`
      cursor.style.top = `${e.clientY}px`
      sessionStorage.setItem('rec-xy', `${e.clientX},${e.clientY}`)
    }, true)
    addEventListener('mousedown', () => {
      cursor.classList.remove('down')
      void cursor.offsetWidth
      cursor.classList.add('down')
    }, true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
}

/**
 * Records the page with Chrome's own screencast, at device resolution (Puppeteer's
 * `page.screencast` takes CSS-pixel frames, 1280 wide at most). Frames come only when the screen
 * changes; each is placed on a 30 fps timeline by Chrome's timestamp, repeated until the next,
 * and piped as JPEG (quality 95) into a near-lossless H.264 intermediate. Returns `stop()`.
 */
const startRecording = async (page, file) => {
  const client = await page.createCDPSession()
  const ffmpeg = spawn(
    FFMPEG,
    [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
      '-vf', `scale=${OUT.width}:${OUT.height + MARK_DEVICE_PX}:force_original_aspect_ratio=decrease,pad=${OUT.width}:${OUT.height + MARK_DEVICE_PX}`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p',
      file,
    ],
    { stdio: ['pipe', 'ignore', 'inherit'] }
  )
  const finished = new Promise((resolve, reject) => ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)))))
  const put = (frame) => new Promise((resolve) => (ffmpeg.stdin.write(frame) ? resolve() : ffmpeg.stdin.once('drain', resolve)))

  let first = null
  let last = null
  let lastAt = 0
  let lastWall = 0
  let written = 0
  let queue = Promise.resolve()
  const fillTo = async (timestamp) => {
    const target = Math.round((timestamp - first) * FPS)
    while (last && written < target) {
      await put(last)
      written += 1
    }
  }
  client.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    client.send('Page.screencastFrameAck', { sessionId }).catch(() => undefined)
    const frame = Buffer.from(data, 'base64')
    const at = metadata.timestamp ?? Date.now() / 1000
    queue = queue.then(async () => {
      if (first === null) first = at
      await fillTo(at)
      last = frame
      lastAt = at
      lastWall = Date.now() / 1000
    })
  })
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 95,
    maxWidth: OUT.width,
    maxHeight: OUT.height + MARK_DEVICE_PX,
    everyNthFrame: 1,
  })

  return async () => {
    await client.send('Page.stopScreencast')
    queue = queue.then(async () => {
      // The screen held still since the last frame: hold it to the moment recording stopped.
      await fillTo(lastAt + (Date.now() / 1000 - lastWall))
      if (last) await put(last)
      ffmpeg.stdin.end()
    })
    await queue
    await finished
    await client.detach()
  }
}

const main = async () => {
  for (const [bin, args] of [[FFMPEG, ['-version']], [FFPROBE, ['-version']]]) {
    try {
      execFileSync(bin, args, { stdio: 'ignore' })
    } catch {
      throw new Error(`${bin} is not on the PATH (set FFMPEG / FFPROBE)`)
    }
  }
  try {
    await fetch(`${ORIGIN}/`, { signal: AbortSignal.timeout(120_000) })
  } catch {
    throw new Error(`the web is not answering at ${ORIGIN}: start the app (pnpm dev) and run again`)
  }

  const puppeteer = createRequire(path.join(ROOT, 'server/package.json'))('puppeteer')
  // Puppeteer hides scrollbars by default; a visitor sees them, and scrolling reads as scrolling.
  const browser = await puppeteer.launch({
    headless: 'shell',
    ignoreDefaultArgs: ['--hide-scrollbars'],
    args: [`--window-size=${VIEW.width},${VIEW.height + MARK_PX}`],
  })
  const work = path.join(os.tmpdir(), `cv-video-${Date.now()}`)
  mkdirSync(work, { recursive: true })

  let page = null
  try {
    page = await browser.newPage()
    await page.emulateTimezone('Asia/Yerevan')
    // Chrome's capture is the whole viewport, scrollbars included (as a visitor sees it):
    // 1280×724 CSS pixels at 1.5× is 1920×1086, the cue strip being the last 6 rows.
    await page.setViewport({ width: VIEW.width, height: VIEW.height + MARK_PX, deviceScaleFactor: SCALE })

    // Warm every page first: a dev server compiling mid-recording shows as a long blank wait.
    for (const warm of ['/', '/templates', '/templates/tech', '/editor/new?template=tech&sample=1']) {
      await page.goto(`${ORIGIN}${warm}`, { waitUntil: 'networkidle0', timeout: 180_000 })
    }
    await page.evaluate(() => localStorage.clear())
    await page.evaluateOnNewDocument(OVERLAY)

    // Captions for the <track>. Each caption or card is cue n, and the page paints grey n in
    // the marker strip; reading the strip back from the recording times the cues exactly.
    const cues = []
    const mark = async (text) => {
      cues.push({ index: cues.length + 1, text })
      const grey = markGrey(cues.length)
      await page.evaluate((colour) => {
        sessionStorage.setItem('rec-mark', colour)
        const element = document.getElementById('rec-marker')
        if (element) element.style.background = colour
      }, `rgb(${grey},${grey},${grey})`)
    }

    const caption = async (text) => {
      if (process.env.CONTENT_VIDEO_DEBUG) console.log(`  step: ${text || '(blank)'}`)
      await mark(text)
      await page.evaluate((value) => {
        sessionStorage.setItem('rec-caption', value)
        const element = document.getElementById('rec-caption')
        if (element) element.textContent = value
      }, text)
    }
    const card = async (title, subtitle, detail, ms) => {
      await mark(`${subtitle}․ ${title}։ ${detail}։`)
      await page.evaluate(
        (t, s, d) => {
          // A card fills the screen: the page's scrollbar must not show through at its edge.
          document.documentElement.style.overflow = 'hidden'
          const element = document.createElement('div')
          element.id = 'rec-card'
          element.innerHTML = `<div class="s">${s}</div><div class="t">${t}</div><div class="d">${d}</div>`
          document.body.append(element)
        },
        title,
        subtitle,
        detail
      )
      await wait(ms)
    }
    const dropCard = async () => {
      await mark('')
      await page.evaluate(() => {
        const element = document.getElementById('rec-card')
        if (!element) return
        // Back before the fade, while the card still covers the page settling under it.
        document.documentElement.style.overflow = ''
        element.style.opacity = '0'
        setTimeout(() => element.remove(), 700)
      })
      await wait(700)
    }
    /**
     * Where an element sits relative to what shows it: its nearest scrolling ancestor (an editor
     * panel) or the window. `offset` is how far that container must scroll to centre the
     * element; `x`/`y` a point inside the container to put the cursor while scrolling it.
     */
    const placement = (handle) =>
      handle.evaluate((element) => {
        let box = null
        // The document itself scrolls as the window, not as a panel.
        for (let node = element.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
          const style = getComputedStyle(node)
          if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
            box = node
            break
          }
        }
        const view = box ? box.getBoundingClientRect() : { top: 0, bottom: innerHeight, left: 0, right: innerWidth }
        const rect = element.getBoundingClientRect()
        const margin = 48
        const visible = rect.top >= view.top + margin && rect.bottom <= view.bottom - margin
        const offset = visible ? 0 : rect.top + rect.height / 2 - (view.top + view.bottom) / 2
        const x = Math.min(Math.max(rect.left + rect.width / 2, view.left + 24), view.right - 24)
        return { offset, x, y: (view.top + view.bottom) / 2 }
      })
    /**
     * Scrolls an element into view the way a person does: the cursor moves over the panel, then
     * the wheel turns in small steps (the scrollbar and the content move visibly), re-measuring
     * as it goes, until the element is comfortably on screen.
     */
    const scrollTo = async (handle) => {
      let plan = await placement(handle)
      if (Math.abs(plan.offset) < 4) return
      await page.mouse.move(plan.x, plan.y, { steps: 22 })
      await wait(250)
      let still = 0
      for (let i = 0; i < 240 && Math.abs(plan.offset) >= 4; i += 1) {
        // Faster mid-way, slower at the ends: a hand on the wheel, not a constant crawl.
        const step = Math.sign(plan.offset) * Math.min(Math.abs(plan.offset), 18 + Math.min(i, 8) * 7)
        await page.mouse.wheel({ deltaY: step })
        await wait(24)
        const next = await placement(handle)
        // Chrome animates each wheel tick, so one still reading means nothing yet; many in a
        // row mean the container cannot scroll further. Stop then rather than spin.
        still = Math.abs(next.offset - plan.offset) < 1 ? still + 1 : 0
        if (still >= 10) break
        plan = next
      }
      await wait(250)
    }
    /** The element's box once it has stopped moving (a wheel scroll glides on after the last tick). */
    const settled = async (handle) => {
      let previous = null
      for (let i = 0; i < 40; i += 1) {
        const box = await handle.boundingBox()
        if (box && previous && Math.abs(box.x - previous.x) < 0.5 && Math.abs(box.y - previous.y) < 0.5) return box
        previous = box
        await wait(50)
      }
      return previous
    }
    /** Scrolls the element into view if it is not (`scrollTo`), glides the cursor to it and clicks. */
    const clickOn = async (handle, pause = 350) => {
      if (process.env.CONTENT_VIDEO_DEBUG) console.log(`    click: ${(await handle.evaluate((element) => element.textContent?.trim().slice(0, 30) || element.getAttribute('aria-label'))) ?? '?'} @ ${page.url()}`)
      await scrollTo(handle)
      const box = await settled(handle)
      if (!box) throw new Error('element not visible')
      if (box.y < 0 || box.y + box.height > VIEW.height || box.x < 0 || box.x + box.width > VIEW.width) {
        throw new Error(`could not bring "${await handle.evaluate((element) => element.textContent?.trim().slice(0, 30))}" into view`)
      }
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 })
      await wait(pause)
      // Measured again: what lies under the cursor now is what gets clicked.
      const at = (await settled(handle)) ?? box
      if (Math.abs(at.x - box.x) > 1 || Math.abs(at.y - box.y) > 1) await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2, { steps: 8 })
      await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2)
    }
    /**
     * Drags an element (a section's handle) onto another's place, as a hand does: press, a
     * slow glide, a beat over the target, release.
     */
    const dragOnto = async (handle, target) => {
      await scrollTo(handle)
      const from = await settled(handle)
      const to = await settled(target)
      if (!from || !to) throw new Error('drag: element not visible')
      const x = from.x + from.width / 2
      const y = from.y + from.height / 2
      await page.mouse.move(x, y, { steps: 26 })
      await wait(350)
      await page.mouse.down()
      await wait(200)
      // Just past the target's handle: far enough to take its place, not the one above it.
      const dy = (to.y + to.height / 2 - y) * 0.7
      for (let i = 1; i <= 30; i += 1) {
        await page.mouse.move(x, y + dy * (i / 30))
        await wait(28)
      }
      await wait(350)
      await page.mouse.up()
    }
    const byText = (selector, text) =>
      page.waitForFunction(
        (s, t) => [...document.querySelectorAll(s)].find((element) => element.textContent?.trim() === t && element.getBoundingClientRect().width > 0),
        { timeout: 60_000 },
        selector,
        text
      )
    const byLabel = (label) => page.waitForSelector(`[aria-label="${label}"]`, { visible: true, timeout: 60_000 })
    /** The first visible element whose text starts with `text` (an option showing a name and a sample). */
    const startsWith = (selector, text) =>
      page.waitForFunction(
        (s, t) => [...document.querySelectorAll(s)].find((element) => element.textContent?.trim().startsWith(t) && element.getBoundingClientRect().width > 0),
        { timeout: 60_000 },
        selector,
        text
      )
    /**
     * A control inside one section's row of the Sections tab: the row is found by its drag
     * handle, labelled with the section's title; `text`, when given, narrows to that label.
     */
    const inSectionRow = (title, selector, text) =>
      findInSectionRow(title, selector, text).catch(async (error) => {
        // Say what the page held instead: the rows' handles and the open tab.
        const seen = await page.evaluate(() => ({
          tab: document.querySelector('[role=tab][aria-selected=true]')?.textContent,
          handles: [...document.querySelectorAll('button[aria-label*="«"]')].map((b) => b.getAttribute('aria-label').slice(0, 28)),
          options: [...document.querySelectorAll('[role=tabpanel] label.ant-segmented-item')].map((l) => l.textContent.trim()).slice(0, 9),
        }))
        await page.screenshot({ path: path.join(work, 'failed.png') })
        throw new Error(`${error.message} — looking for ${title} / ${text ?? selector}; page had ${JSON.stringify(seen)}; screenshot ${path.join(work, 'failed.png')}`)
      })
    const findInSectionRow = (title, selector, text) =>
      page.waitForFunction(
        (t, s, x) => {
          const handle = [...document.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label').includes(`«${t}»`))
          for (let row = handle?.parentElement; row; row = row.parentElement) {
            if (row.querySelectorAll('button[aria-label*="«"]').length > 1) return null
            const found = [...row.querySelectorAll(s)].find((element) => !x || element.textContent?.trim() === x)
            if (found) return found
          }
          return null
        },
        { timeout: 15_000 },
        title,
        selector,
        text ?? ''
      )
    /** Scrolls the page by `dy` with the wheel, at the cursor, over about `ms`. */
    const scrollBy = async (dy, ms) => {
      const steps = Math.max(1, Math.round(ms / 24))
      for (let i = 0; i < steps; i += 1) {
        await page.mouse.wheel({ deltaY: dy / steps })
        await wait(24)
      }
    }

    await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle0' })
    await page.mouse.move(VIEW.width * 0.62, VIEW.height * 0.55)
    const stopRecording = await startRecording(page, path.join(work, 'screen.mkv'))

    // Opening card, then the site.
    await card('Ինչպես ստեղծել ինքնակենսագրական', 'Իմ ինքնակենսագրականը', 'Հայերեն՝ մի քանի րոպեում', 2600 * SPEED)
    await dropCard()
    await wait(900)

    // 1. Choose a template.
    await caption('1. Ընտրեք ձևանմուշը')
    await clickOn(await byText('header nav a', 'Ձևանմուշներ'))
    await page.waitForFunction(() => location.pathname === '/templates')
    await wait(1200)
    await scrollBy(520, 1600)
    await wait(600)
    await scrollBy(-520, 900)
    await clickOn(await byText('main h2', 'Տեխնոլոգիական'))
    await page.waitForFunction(() => location.pathname === '/templates/tech')
    await wait(1500)
    await clickOn(await byText('main a', 'Սկսել օրինակով'))
    await page.waitForFunction(() => location.pathname.startsWith('/editor/draft'), { timeout: 120_000 })
    await page.waitForSelector('.cv-name', { visible: true })
    await wait(800)
    const close = await page.$('[aria-label="Փակել"]')
    if (close) await close.click()
    await wait(700)

    // 2. Type on the CV itself.
    await caption('2. Լրացրեք տեքստը հենց թերթիկի վրա')
    await clickOn(await page.waitForSelector('.cv-name', { visible: true }))
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.type('Անի Պետրոսյան', { delay: 110 })
    await wait(600)
    await clickOn(await page.waitForSelector('.cv-headline', { visible: true }))
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.keyboard.type('Մարքեթինգի մենեջեր', { delay: 90 })
    await wait(900)

    // 3. Colours, template, fonts. The template first: switching it resets the design, so
    // the font and the colour picked after it are what stays.
    await caption('3. Փոխեք գույները, ձևանմուշը և տառատեսակները')
    await clickOn(await byText('[role=tab]', 'Դիզայն'))
    await wait(700)
    for (const palette of ['Սևան', 'Նուռ']) {
      await clickOn(await byLabel(palette), 250)
      await wait(1100)
    }
    await clickOn(await byText('[role=tab]', 'Ձևանմուշ'))
    await wait(800)
    // Away and back: the switch shows, and the sections step below works on Տեխնոլոգիական,
    // whose upper sections (the ones on screen) it changes.
    for (const template of ['Էլեգանտ', 'Տեխնոլոգիական']) {
      await clickOn(await byText('[role=tabpanel] *', template), 300)
      await wait(1500)
    }
    await clickOn(await byText('[role=tab]', 'Դիզայն'))
    await wait(700)
    // The heading font: open its list, pick a display face.
    const fontSelect = await page.waitForSelector('[role=tabpanel] .ant-select', { visible: true })
    const currentFont = await fontSelect.evaluate((element) => element.textContent ?? '')
    await clickOn(fontSelect)
    await wait(700)
    await clickOn(await startsWith('.ant-select-item-option', currentFont.startsWith('Artsakh') ? 'Braind Amanor' : 'Artsakh'), 300)
    await wait(1400)
    // One colour by hand: the accent, from the picker's colour field.
    await clickOn(await page.waitForSelector('[role=tabpanel] .ant-color-picker-trigger', { visible: true }))
    await wait(700)
    const field = await page.waitForSelector('.ant-color-picker-saturation', { visible: true, timeout: 60_000 })
    const area = await field.boundingBox()
    await page.mouse.move(area.x + area.width * 0.78, area.y + area.height * 0.22, { steps: 24 })
    await wait(250)
    await page.mouse.click(area.x + area.width * 0.78, area.y + area.height * 0.22)
    await wait(1100)
    await page.keyboard.press('Escape')
    await wait(800)

    // 4. Sections, each change in the CV's upper part, on screen as it happens: reorder by
    // dragging, hide one from the sidebar while it is still in view, then move the summary
    // into the sidebar.
    await caption('4. Կարգավորեք բաժինները')
    await clickOn(await byText('[role=tab]', 'Բաժիններ'))
    await wait(800)
    await dragOnto(await inSectionRow('Կրթություն', 'button[aria-label*="«"]'), await inSectionRow('Աշխատանքային փորձ', 'button[aria-label*="«"]'))
    await wait(1400)
    if (process.env.CONTENT_VIDEO_DEBUG) {
      console.log(`    order: ${await page.evaluate(() => [...document.querySelectorAll('button[aria-label*="«"]')].map((b) => b.getAttribute('aria-label').match(/«(.+?)»/)?.[1]).join(' > '))}`)
    }
    await clickOn(await inSectionRow('Լեզուներ', 'button[aria-label="Թաքցնել"]'))
    await wait(1400)
    await clickOn(await inSectionRow('Իմ մասին', 'label.ant-segmented-item', 'Կողային'))
    await wait(1400)

    // 5. Download.
    await caption('5. Ներբեռնեք PDF')
    await clickOn(await byLabel('Ներբեռնել PDF'))
    await wait(2400 * SPEED)

    // Closing card.
    await caption('')
    await card(DOMAIN, 'Իմ ինքնակենսագրականը', 'Առանց գրանցման․ սև-սպիտակ PDF-ն՝ անվճար', 3000 * SPEED)
    await mark('')
    await wait(300)
    await stopRecording()

    // The picture first, sped up (the screencast's WebM carries no duration), then music cut to its
    // length, then both into the final file.
    const screen = path.join(work, 'screen.mkv')
    const silent = path.join(work, 'silent.mp4')
    execFileSync(FFMPEG, [
      '-y', '-loglevel', 'error', '-i', screen,
      '-vf', `setpts=PTS/${SPEED},fps=${FPS},crop=${OUT.width}:${OUT.height}:0:0,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-an',
      silent,
    ])
    const seconds = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', silent]).toString().trim())
    if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('could not read the duration of the recording')
    const music = path.join(work, 'music.wav')
    writeFileSync(music, musicWav(seconds))
    mkdirSync(OUT_DIR, { recursive: true })
    const mp4 = path.join(OUT_DIR, `${NAME}.mp4`)
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', music, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4])
    // The captions file: when each cue's grey first shows in the strip, on the same sped-up
    // 30 fps timeline as the encoded picture.
    const strip = execFileSync(FFMPEG, [
      '-loglevel', 'error', '-i', screen,
      '-vf', `setpts=PTS/${SPEED},fps=${FPS},crop=${OUT.width}:${MARK_DEVICE_PX}:0:${OUT.height},scale=1:1:flags=area,format=gray`,
      '-f', 'rawvideo', '-',
    ], { maxBuffer: 64 * 1024 * 1024 })
    if (process.env.CONTENT_VIDEO_DEBUG) {
      const runs = []
      strip.forEach((grey, frame) => {
        if (!runs.length || Math.abs(runs.at(-1).grey - grey) > 3) runs.push({ grey, frame })
      })
      console.log(runs.map((run) => `${run.frame}:${run.grey}`).join(' '))
    }
    const firstFrame = new Map()
    strip.forEach((raw, frame) => {
      // The decode expands video (16-235) range to 0-255; undo it to get the painted grey.
      const grey = (raw * 219) / 255 + 16
      const index = Math.round((grey - markGrey(0)) / 24)
      if (index >= 1 && index <= cues.length && Math.abs(grey - markGrey(index)) <= 6 && !firstFrame.has(index)) firstFrame.set(index, frame)
    })
    const timed = cues
      .map((cue) => ({ ...cue, start: firstFrame.has(cue.index) ? firstFrame.get(cue.index) / FPS : null }))
      .filter((cue) => cue.start !== null)
    for (const [i, cue] of timed.entries()) cue.end = timed[i + 1]?.start ?? seconds
    // A blank gap shown for a frame or two may go unseen; a caption or card never should.
    const lost = cues.filter((cue) => cue.text && !firstFrame.has(cue.index))
    if (lost.length) throw new Error(`captions not found in the recording: ${lost.map((cue) => cue.text).join(' | ')}`)
    const stamp = (t) => {
      const ms = Math.round(Math.min(Math.max(t, 0), seconds) * 1000)
      const pad = (n, w = 2) => String(n).padStart(w, '0')
      return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`
    }
    const vtt = ['WEBVTT', '', ...timed.filter((cue) => cue.text && cue.end > cue.start).flatMap((cue, index) => [String(index + 1), `${stamp(cue.start)} --> ${stamp(cue.end)}`, cue.text, ''])]
    writeFileSync(path.join(OUT_DIR, `${NAME}.vtt`), vtt.join(String.fromCharCode(10)))

    // The poster: the editor mid-way, a CV on screen.
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(Math.round(seconds * 0.55)), '-i', mp4, '-frames:v', '1', '-q:v', '2', path.join(OUT_DIR, `${NAME}.jpg`)])
    console.log(`video: ${mp4} (${seconds.toFixed(1)} s, ${Math.round(statSync(mp4).size / 1024)} KB)`)
    console.log(`put durationSeconds: ${Math.round(seconds)} in the guide's video field`)
  } catch (error) {
    // What was on screen when it failed, beside the kept recording.
    const shot = path.join(work, 'failed.png')
    await page?.screenshot({ path: shot }).catch(() => undefined)
    console.log(`  screen at failure: ${shot}`)
    throw error
  } finally {
    await browser.close()
    // Windows can hold a file a moment after ffmpeg exits; a leftover temp folder is harmless.
    // CONTENT_VIDEO_KEEP=1 keeps it, to look at the raw recording.
    if (process.env.CONTENT_VIDEO_KEEP) console.log(`  kept ${work}`)
    else try {
      rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 })
    } catch {
      console.log(`  (could not remove ${work})`)
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
