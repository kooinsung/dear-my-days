'use client'

import { Component, type ReactNode } from 'react'
import { css } from '@/styled-system/css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '40px 20px',
            textAlign: 'center',
          })}
        >
          <h2
            className={css({
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
            })}
          >
            문제가 발생했습니다
          </h2>
          <p className={css({ color: 'gray.600', marginBottom: '24px' })}>
            페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={css({
              padding: '10px 20px',
              backgroundColor: 'blue.500',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              _hover: { backgroundColor: 'blue.600' },
            })}
          >
            페이지 새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
