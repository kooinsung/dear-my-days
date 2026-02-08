'use client'

import Link from 'next/link'
import { useState } from 'react'
import { NativeBridge, useIsNativeApp } from '@/libs/native-bridge'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

interface WebViewStackItem {
  id: string
  url: string
  title: string
}

export default function WebViewTestPage() {
  const [stack, setStack] = useState<WebViewStackItem[]>([])
  const [inputUrl, setInputUrl] = useState('')
  const [inputTitle, setInputTitle] = useState('')
  const isNativeApp = useIsNativeApp()

  const handlePush = () => {
    if (!inputUrl.trim()) {
      return
    }

    const newItem: WebViewStackItem = {
      id: Date.now().toString(),
      url: inputUrl.trim(),
      title: inputTitle.trim() || inputUrl.trim(),
    }

    // 네이티브 앱에서 실행 중이면 postMessage
    if (NativeBridge.openWebView(newItem.url, newItem.title)) {
      // 웹 앱의 스택도 동기화 (표시용)
      setStack([...stack, newItem])
    } else {
      // 웹 브라우저에서는 경고 표시
      alert('이 기능은 React Native 모바일 앱에서만 동작합니다.')
    }

    setInputUrl('')
    setInputTitle('')
  }

  const handlePop = () => {
    if (NativeBridge.closeWebView()) {
      setStack(stack.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (NativeBridge.clearWebViewStack()) {
      setStack([])
    }
  }

  const presetUrls = [
    { url: 'https://www.google.com', title: 'Google' },
    { url: 'https://www.naver.com', title: 'Naver' },
    { url: 'https://www.github.com', title: 'GitHub' },
    { url: 'https://reactnative.dev', title: 'React Native Docs' },
    { url: `${window.location.origin}/`, title: '홈 (내부)' },
    { url: `${window.location.origin}/calendar`, title: '캘린더 (내부)' },
    { url: `${window.location.origin}/settings`, title: '설정 (내부)' },
    {
      url: `${window.location.origin}/settings/account`,
      title: '계정 설정 (내부)',
    },
  ]

  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'background',
      })}
    >
      {/* Header */}
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'border',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        })}
      >
        <div
          className={flex({
            maxWidth: 'container',
            margin: '0 auto',
            padding: '0 24px',
            justify: 'space-between',
            align: 'center',
          })}
        >
          <h1
            className={css({
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
            })}
          >
            웹뷰 테스트
          </h1>
          <Link href="/settings" className={button({ variant: 'secondary' })}>
            설정으로
          </Link>
        </div>
      </header>

      <main
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        {/* Status Banner */}
        <div
          className={css({
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: isNativeApp ? '#d4edda' : '#fff3cd',
            border: '1px solid',
            borderColor: isNativeApp ? '#c3e6cb' : '#ffc107',
            borderRadius: '8px',
          })}
        >
          <div className={css({ fontWeight: 600, marginBottom: '8px' })}>
            {isNativeApp
              ? '✅ React Native 앱에서 실행 중'
              : '⚠️ 웹 브라우저에서 실행 중'}
          </div>
          <p className={css({ margin: 0, fontSize: '14px' })}>
            {isNativeApp
              ? '웹뷰 스택 기능을 사용할 수 있습니다. 새 URL을 열면 전체 화면 WebView가 위로 쌓입니다.'
              : '이 기능은 React Native 모바일 앱에서만 동작합니다. iOS/Android 앱으로 실행해주세요.'}
          </p>
        </div>

        {/* Controls */}
        <section className={cx(card(), css({ marginBottom: '24px' }))}>
          <h2
            className={css({
              fontSize: '18px',
              marginTop: 0,
              marginBottom: '16px',
            })}
          >
            웹뷰 컨트롤
          </h2>

          {/* URL Input */}
          <div
            className={vstack({
              gap: '12px',
              alignItems: 'stretch',
              marginBottom: '16px',
            })}
          >
            <div>
              <label
                htmlFor="url-input"
                className={css({
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                })}
              >
                URL
              </label>
              <input
                id="url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com 또는 /page"
                className={css({
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid',
                  borderColor: 'border',
                  borderRadius: '8px',
                  fontSize: '14px',
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePush()
                  }
                }}
              />
            </div>

            <div>
              <label
                htmlFor="title-input"
                className={css({
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                })}
              >
                제목 (선택)
              </label>
              <input
                id="title-input"
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="페이지 제목"
                className={css({
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid',
                  borderColor: 'border',
                  borderRadius: '8px',
                  fontSize: '14px',
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePush()
                  }
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={flex({ gap: '8px', wrap: 'wrap' })}>
            <button
              type="button"
              onClick={handlePush}
              disabled={!inputUrl.trim() || !isNativeApp}
              className={button({ variant: 'primary' })}
            >
              ➕ 웹뷰 열기
            </button>
            <button
              type="button"
              onClick={handlePop}
              disabled={stack.length === 0 || !isNativeApp}
              className={button({ variant: 'secondary' })}
            >
              ⬅️ 뒤로가기
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={stack.length === 0 || !isNativeApp}
              className={button({ variant: 'secondary' })}
            >
              🗑️ 모두 닫기
            </button>
          </div>

          {/* Preset URLs */}
          <div className={css({ marginTop: '16px' })}>
            <div
              className={css({
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
              })}
            >
              빠른 테스트:
            </div>
            <div className={flex({ gap: '8px', wrap: 'wrap' })}>
              {presetUrls.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => {
                    if (NativeBridge.openWebView(preset.url, preset.title)) {
                      setStack([
                        ...stack,
                        { id: Date.now().toString(), ...preset },
                      ])
                    }
                  }}
                  disabled={!isNativeApp}
                  className={css({
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: isNativeApp ? 'pointer' : 'not-allowed',
                    opacity: isNativeApp ? 1 : 0.5,
                    '&:hover': {
                      backgroundColor: isNativeApp ? '#f5f5f5' : 'white',
                    },
                  })}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stack Info */}
        <section className={cx(card(), css({ marginBottom: '24px' }))}>
          <h2
            className={css({
              fontSize: '18px',
              marginTop: 0,
              marginBottom: '16px',
            })}
          >
            스택 상태 (총 {stack.length}개)
          </h2>

          {stack.length === 0 ? (
            <p className={css({ color: '#666', margin: 0 })}>
              아직 열린 웹뷰가 없습니다.
            </p>
          ) : (
            <div className={vstack({ gap: '8px', alignItems: 'stretch' })}>
              {stack.map((item, index) => (
                <div
                  key={item.id}
                  className={css({
                    padding: '12px',
                    border: '1px solid',
                    borderColor:
                      index === stack.length - 1 ? '#4CAF50' : 'border',
                    borderRadius: '8px',
                    backgroundColor:
                      index === stack.length - 1 ? '#f0f9f4' : 'white',
                  })}
                >
                  <div
                    className={flex({
                      justify: 'space-between',
                      align: 'center',
                    })}
                  >
                    <div>
                      <div
                        className={css({ fontSize: '14px', fontWeight: 600 })}
                      >
                        {index === stack.length - 1 && '👁️ '}
                        Level {index + 1} - {item.title}
                      </div>
                      <div
                        className={css({
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px',
                        })}
                      >
                        {item.url}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info */}
        <div
          className={css({
            padding: '16px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            fontSize: '13px',
          })}
        >
          <div className={css({ fontWeight: 600, marginBottom: '8px' })}>
            💡 React Native WebView 스택 동작 방식
          </div>
          <ul className={css({ margin: 0, paddingLeft: '20px' })}>
            <li>
              새로운 URL을 열면 React Native의 실제 WebView가 전체 화면으로 위에
              쌓입니다
            </li>
            <li>
              뒤로가기 버튼 또는 Android 하드웨어 백 버튼으로 최상단 웹뷰를
              닫습니다
            </li>
            <li>각 웹뷰는 독립적인 react-native-webview 컴포넌트입니다</li>
            <li>내부 페이지도 웹뷰로 열어 테스트할 수 있습니다</li>
            <li>
              웹 브라우저에서는 동작하지 않고, React Native 앱에서만 작동합니다
            </li>
          </ul>
        </div>

        {/* Debug Info */}
        {isNativeApp && (
          <div
            className={css({
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            })}
          >
            <div className={css({ fontWeight: 600, marginBottom: '4px' })}>
              Debug Info:
            </div>
            <div>Is Native App: {isNativeApp ? 'true' : 'false'}</div>
            <div>Stack Length: {stack.length}</div>
          </div>
        )}
      </main>
    </div>
  )
}
