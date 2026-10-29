'use client'

/**
 * The root layout itself failed, so there are no providers (no translations, no antd): plain
 * markup and literal Armenian copy only.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang='hy'>
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100dvh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Ինչ-որ բան սխալ գնաց</h1>
          <button type='button' onClick={reset} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Կրկին փորձել
          </button>
        </div>
      </body>
    </html>
  )
}
