export type WorksheetSymbolKind = 'purpose' | 'conditions' | 'obtain' | 'give' | 'information' | 'discussion'

// Simple vector counterparts to the pictograms in Appendix V, pp. 57–58.
// Adjacent text supplies the meaning, so these symbols are decorative.
export function WorksheetSymbol({ kind }: { kind: WorksheetSymbolKind }) {
  return (
    <svg className="worksheet-symbol" viewBox="0 0 48 48" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'purpose' && <>
        <circle cx="24" cy="24" r="19" />
        <path d="M17 17a7 7 0 0 1 14 0c0 5-7 5-7 11" />
        <circle cx="24" cy="35" r="1.6" fill="currentColor" stroke="none" />
      </>}
      {kind === 'conditions' && <>
        <rect x="10" y="9" width="28" height="34" rx="3" />
        <rect x="18" y="5" width="12" height="8" rx="2" fill="var(--symbol-paper, white)" />
        <path d="m16 22 3 3 5-6m-8 15 3 3 5-6m5-8h3m-3 12h3" />
      </>}
      {(kind === 'obtain' || kind === 'give') && <>
        <path d="M5 24v-7h14l5 5h18v19H5" />
        <path d="m6 28 7 13h29l-7-13z" fill="#f1d9a5" />
        <path d="m24 24 12-13 8 7-10 10" />
        {kind === 'obtain'
          ? <path d="M11 4v17m-5-5 5 5 5-5" />
          : <path d="M11 21V4m-5 5 5-5 5 5" />}
      </>}
      {kind === 'information' && <>
        <circle cx="24" cy="24" r="19" />
        <path d="M24 21v14m-4 0h8m-8-14h4" />
        <circle cx="24" cy="13" r="1.8" fill="currentColor" stroke="none" />
      </>}
      {kind === 'discussion' && <>
        <rect x="3" y="3" width="42" height="42" rx="2" />
        <circle cx="16" cy="16" r="5" fill="currentColor" stroke="none" />
        <circle cx="32" cy="16" r="5" fill="currentColor" stroke="none" />
        <path d="M9 37v-9a7 7 0 0 1 14 0v9m2 0v-9a7 7 0 0 1 14 0v9M16 29v8m16-8v8" />
      </>}
    </svg>
  )
}
