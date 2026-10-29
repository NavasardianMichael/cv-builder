'use client'

import {
  type ClipboardEvent,
  type FC,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'
import { cn } from '@helpers/cn'
import { useCvEdit } from './CvEditContext'

type EditableTag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  as?: EditableTag
  multiline?: boolean
  className?: string
  /** View mode renders a link when set (email, phone, website). */
  href?: string
}

/**
 * One piece of CV text, edited in place.
 *
 * In view mode it is plain markup, and nothing at all when empty. In edit mode it is a
 * `plaintext-only` contentEditable, so paste and typing never bring markup in.
 *
 * The element is **uncontrolled while focused**: React writes `value` into it only when the
 * user is not typing there, otherwise every keystroke would re-render the text and throw the
 * caret to the start. Undo, which changes `value` from outside, lands once focus leaves.
 */
export const Editable: FC<Props> = ({ value, onChange, placeholder, as: Tag = 'span', multiline, className, href }) => {
  const edit = useCvEdit()

  if (!edit) {
    if (!value) return null
    if (href) {
      return (
        <a href={href} className={className}>
          {value}
        </a>
      )
    }
    return <Tag className={className}>{value}</Tag>
  }

  return <EditableField value={value} onChange={onChange} placeholder={placeholder} as={Tag} multiline={multiline} className={className} />
}

/**
 * The element's text as typed. Not `innerText`: that returns text *as rendered*, so a
 * template that uppercases its titles (`text-transform`) would save every keystroke uppercased.
 * Line breaks come back from a `<br>` or a block the browser inserted on Enter.
 */
const readText = (element: HTMLElement): string => {
  let text = ''
  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) text += child.textContent ?? ''
      else if (child.nodeName === 'BR') text += '\n'
      else {
        if ((child.nodeName === 'DIV' || child.nodeName === 'P') && text && !text.endsWith('\n')) text += '\n'
        walk(child)
      }
    }
  }
  walk(element)
  return text
}

/** Multiline fields are `white-space: pre-wrap`, so plain text with `\n` renders its breaks. */
const writeText = (element: HTMLElement, value: string): void => {
  if (readText(element) !== value) element.textContent = value
}

const normalize = (raw: string, multiline: boolean): string => {
  // A contentEditable emptied by the user often keeps one stray line break.
  const text = raw.replace(/\r/g, '').replace(/\n$/, '')
  return multiline ? text : text.replace(/\n+/g, ' ')
}

const EditableField: FC<Required<Pick<Props, 'value' | 'onChange' | 'placeholder' | 'as'>> & Pick<Props, 'multiline' | 'className'>> = ({
  value,
  onChange,
  placeholder,
  as: Tag,
  multiline = false,
  className,
}) => {
  const ref = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || document.activeElement === element) return
    writeText(element, value)
    element.dataset.empty = String(!value)
  }, [value])

  const handleInput = useCallback(
    (event: FormEvent<HTMLElement>) => {
      const text = normalize(readText(event.currentTarget), multiline)
      event.currentTarget.dataset.empty = String(!text)
      onChange(text)
    },
    [multiline, onChange]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape' || (event.key === 'Enter' && !multiline)) {
        event.preventDefault()
        event.currentTarget.blur()
      }
    },
    [multiline]
  )

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      event.preventDefault()
      const text = event.clipboardData.getData('text/plain')
      // `insertText` keeps the browser's own undo stack intact, unlike writing the DOM.
      document.execCommand('insertText', false, multiline ? text : text.replace(/\s*\n+\s*/g, ' '))
    },
    [multiline]
  )

  // Re-sync on blur: the store may have coalesced or the user may have undone mid-edit.
  const handleBlur = useCallback(() => {
    const element = ref.current
    if (element) writeText(element, value)
  }, [value])

  return (
    <Tag
      ref={(element: HTMLElement | null) => {
        ref.current = element
      }}
      className={cn('cv-editable', multiline && 'cv-editable-multiline', className)}
      contentEditable='plaintext-only'
      suppressContentEditableWarning
      role='textbox'
      aria-multiline={multiline}
      aria-label={placeholder}
      tabIndex={0}
      spellCheck
      data-placeholder={placeholder}
      data-empty={String(!value)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
    />
  )
}
