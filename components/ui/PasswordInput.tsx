'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export function PasswordInput({ className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input pr-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200 transition"
        tabIndex={-1}
        aria-label={visible ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
