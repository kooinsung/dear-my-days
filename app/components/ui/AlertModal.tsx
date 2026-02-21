'use client'

import { useEffect } from 'react'
import { css, cx } from '@/styled-system/css'
import { button } from '@/styled-system/recipes'

type AlertType = 'error' | 'info'

interface AlertModalProps {
  message: string | null
  type?: AlertType
  autoHideMs?: number
  onClose: () => void
}

const titleMap: Record<AlertType, string> = {
  error: '오류',
  info: '안내',
}

const colorMap: Record<
  AlertType,
  { bg: string; color: string; border: string }
> = {
  error: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  info: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
}

export function AlertModal({
  message,
  type = 'info',
  autoHideMs = 3000,
  onClose,
}: AlertModalProps) {
  useEffect(() => {
    if (!message) {
      return
    }
    const timer = setTimeout(onClose, autoHideMs)
    return () => clearTimeout(timer)
  }, [message, autoHideMs, onClose])

  useEffect(() => {
    if (!message) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [message, onClose])

  if (!message) {
    return null
  }

  const colors = colorMap[type]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={css({
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      })}
    >
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className={css({
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        })}
      />

      <div
        className={css({
          position: 'relative',
          width: '100%',
          maxWidth: '320px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px 20px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        })}
      >
        <div
          className={css({
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            marginBottom: '12px',
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
          })}
        >
          <span
            className={css({
              fontSize: '18px',
              fontWeight: 700,
              color: colors.color,
            })}
          >
            {type === 'error' ? '!' : 'i'}
          </span>
        </div>

        <h3
          className={css({
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#111827',
          })}
        >
          {titleMap[type]}
        </h3>

        <p
          className={css({
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#4b5563',
            marginBottom: '20px',
            wordBreak: 'keep-all',
          })}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={cx(button({ variant: 'primary' }), css({ width: '100%' }))}
        >
          확인
        </button>
      </div>
    </div>
  )
}
