import type { BlockStyle, CvContent, CvDesign } from './cvDocument.js'

/**
 * The free download: the CV's own text in one fixed black-and-white design. Everything the
 * user styled (template, palette, fonts, per-block overrides, the photo) belongs to the paid
 * PDF. Twin of the web's `BASIC_DESIGN` (`src/constants/templates.ts`) and `basicContent`
 * (`src/helpers/basicCv.ts`), pinned by `tests/unit/server/twins.spec.ts`, so the download
 * dialog previews exactly what this prints.
 */
export const BASIC_DESIGN: CvDesign = {
  templateId: 'classic',
  palette: {
    accent: '#000000',
    background: '#ffffff',
    text: '#000000',
    heading: '#000000',
    muted: '#555555',
    sidebarBackground: '#ffffff',
    sidebarText: '#000000',
  },
  headingFont: 'ghea-grapalat',
  bodyFont: 'ghea-grapalat',
  fontScale: 1,
  lineHeight: 1.45,
  spacing: 'normal',
  photoShape: 'circle',
  showPhoto: false,
  showIcons: false,
  levelStyle: 'text',
}

const PLAIN_STYLE: BlockStyle = { background: null, text: null, heading: null, font: null }

/** The content with every block override and the photo dropped. */
export const basicContent = (content: CvContent): CvContent => ({
  basics: { ...content.basics, photo: null, style: PLAIN_STYLE },
  sections: content.sections.map((section) => ({ ...section, style: PLAIN_STYLE })),
})
