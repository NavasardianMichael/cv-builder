'use client'

import type { FC } from 'react'
import type { CvLevelStyle } from '@store/cvs/single/types'
import { LEVEL_LABELS, MAX_LEVEL, type SectionType } from '@constants/sections'
import { cn } from '@helpers/cn'

type Props = {
  level: number
  style: CvLevelStyle
  sectionType: SectionType
  /** Present in the editor: clicking a step sets the level. */
  onChange?: (level: number) => void
}

const STEPS = Array.from({ length: MAX_LEVEL }, (_, index) => index + 1)

/** A tag's level as dots, a bar, or a word ("Մայրենի"). */
export const Level: FC<Props> = ({ level, style, sectionType, onChange }) => {
  if (style === 'none') return null

  if (style === 'text') {
    const labels = sectionType === 'languages' ? LEVEL_LABELS.languages : LEVEL_LABELS.default
    if (!onChange) return level > 0 ? <span className='cv-level-text'>{labels[level]}</span> : null
    return (
      <button
        type='button'
        className='cv-level-text cv-level-button'
        title='Փոխել մակարդակը'
        onClick={() => onChange(level >= MAX_LEVEL ? 1 : level + 1)}
      >
        {labels[level] || labels[1]}
      </button>
    )
  }

  const kind = style === 'bars' ? 'cv-level-bars' : 'cv-level-dots'
  return (
    <span className={cn('cv-level', kind)} role='img' aria-label={`${level} / ${MAX_LEVEL}`}>
      {STEPS.map((step) =>
        onChange ? (
          <button
            key={step}
            type='button'
            className={cn('cv-level-step', step <= level && 'is-on')}
            aria-label={`${step} / ${MAX_LEVEL}`}
            onClick={() => onChange(step === level ? step - 1 : step)}
          />
        ) : (
          <span key={step} className={cn('cv-level-step', step <= level && 'is-on')} />
        )
      )}
    </span>
  )
}
