'use client'

import { createContext, useContext } from 'react'

/**
 * Whether the CV's name, section titles and item titles render as `<h1>`–`<h3>`. Yes in the
 * editor and the PDF, where the CV is the document. No in a preview inside a page
 * (`CvPreview`): there the page has its own `<h1>`, and a second one naming a sample person —
 * plus the CV's section titles mixed into the page's outline — tells search engines the page
 * is about something else. The CV's styles set their own size and weight, so a `<div>` looks
 * the same.
 */
const CvHeadingsContext = createContext(true)

export const CvHeadingsProvider = CvHeadingsContext.Provider

export const useCvHeadings = (): boolean => useContext(CvHeadingsContext)
