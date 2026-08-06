'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Begininhoud (HTML). Wordt enkel bij het monteren ingelezen — geef een
   *  nieuwe `key` mee om de editor te resetten. */
  initialHtml?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Lichte WYSIWYG-editor (contentEditable + execCommand, geen externe library).
 * Ondersteunt vet, cursief, opsommingen en links. Plakken gebeurt als platte
 * tekst tegen rommelige opmaak. De HTML-output hoort bij weergave gesanitized
 * te worden (zie sanitizeRichText in lib/utils).
 */
export function RichTextEditor({ initialHtml = '', onChange, placeholder = 'Schrijf hier…', className }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Begininhoud één keer imperatief zetten. Bewust GEEN dangerouslySetInnerHTML:
  // dat zou de editor bij elke re-render (bv. door onChange in het formulier)
  // resetten, waardoor typen onmogelijk wordt. Zo beheert de browser de inhoud.
  useEffect(() => {
    if (editorRef.current && initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    onChange(editorRef.current?.innerHTML ?? '');
  }

  // De knoppen gebruiken onMouseDown+preventDefault zodat de selectie in de
  // editor behouden blijft wanneer je op een knop klikt.
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    emit();
  }

  function addLink() {
    const url = window.prompt('Link-URL (bv. https://…):');
    if (url) exec('createLink', url.trim());
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  }

  const toolbarBtn = 'p-1.5 rounded text-ink-300 hover:bg-ink-800 hover:text-white transition';

  return (
    <div>
      {/* Opmaak-werkbalk */}
      <div className="flex items-center gap-1 mb-1.5 rounded-md border border-ink-700 bg-ink-900/50 px-1.5 py-1 w-fit">
        <button type="button" title="Vet" className={toolbarBtn}
          onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Cursief" className={toolbarBtn}
          onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')}>
          <Italic className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-ink-700 mx-0.5" />
        <button type="button" title="Opsomming" className={toolbarBtn}
          onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Genummerde lijst" className={toolbarBtn}
          onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-ink-700 mx-0.5" />
        <button type="button" title="Link toevoegen" className={toolbarBtn}
          onMouseDown={e => e.preventDefault()} onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        className={cn('rte-editor input min-h-[180px] max-h-[520px] overflow-auto leading-relaxed', className)}
        onInput={emit}
        onPaste={handlePaste}
      />
      <p className="text-xs text-ink-500 mt-1">Selecteer tekst en klik op een knop om op te maken. Plakken gebeurt als platte tekst.</p>
    </div>
  );
}
