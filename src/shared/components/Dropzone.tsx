import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Upload } from 'lucide-react'

import { partitionImageFiles } from '@/shared/utils/imageValidation'

type DropzoneProps = {
  onFilesAccepted: (files: File[]) => void | Promise<void>
  variant?: 'full' | 'compact'
  disabled?: boolean
}

export function Dropzone({ onFilesAccepted, variant = 'full', disabled = false }: DropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelection = async (files: File[]) => {
    if (disabled) {
      return
    }
    const { accepted, rejected } = partitionImageFiles(files)

    if (rejected.length > 0) {
      setError('Unsupported file type. Use JPG or PNG.')
    } else {
      setError(null)
    }

    if (accepted.length > 0) {
      await onFilesAccepted(accepted)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Choose files or drop images"
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) {
              setIsDragging(true)
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (event) => {
            event.preventDefault()
            setIsDragging(false)
            if (!disabled) {
              await handleFileSelection(Array.from(event.dataTransfer.files))
            }
          }}
          className={[
            'flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            isDragging && !disabled ? 'border-accent bg-surface-muted' : 'border-border',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            multiple
            disabled={disabled}
            aria-label="Choose files"
            className="sr-only"
            onChange={async (event) => {
              const input = event.currentTarget
              const nextFiles = Array.from(input.files ?? [])
              await handleFileSelection(nextFiles)
              input.value = ''
            }}
          />
          <Upload size={20} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Upload images</span>
        </div>
        {error ? (
          <p className="text-xs text-danger" role="alert">{error}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Choose files or drop images"
        aria-disabled={disabled}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) {
            await handleFileSelection(Array.from(event.dataTransfer.files))
          }
        }}
        className={[
          'flex items-center gap-3 rounded-md border border-dashed px-4 py-6',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          isDragging && !disabled ? 'border-accent bg-surface-muted' : 'border-border',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          multiple
          disabled={disabled}
          aria-label="Choose files"
          className="sr-only"
          onChange={async (event) => {
            const input = event.currentTarget
            const nextFiles = Array.from(input.files ?? [])
            await handleFileSelection(nextFiles)
            input.value = ''
          }}
        />
        <Upload size={16} className="shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Choose files</span> or drop here
        </span>
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">{error}</p>
      ) : null}
    </div>
  )
}
