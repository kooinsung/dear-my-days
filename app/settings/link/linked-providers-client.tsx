'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

interface LinkedProvidersClientProps {
  initialUser: User
}

type UserIdentity = NonNullable<NonNullable<User['identities']>[number]>

function getIdentityLabel(identity: UserIdentity): string {
  const provider = identity.provider
  if (provider === 'google') {
    return 'Google'
  }
  if (provider === 'kakao') {
    return 'Kakao'
  }
  if (provider === 'naver') {
    return 'Naver'
  }
  if (provider === 'email') {
    return 'Email'
  }
  return provider
}

export function LinkedProvidersClient({
  initialUser,
}: LinkedProvidersClientProps) {
  const supabase = createSupabaseBrowser()

  const [user, setUser] = useState<User>(initialUser)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const identities = useMemo(
    () => (user.identities ?? []) as UserIdentity[],
    [user.identities],
  )

  const canUnlink = identities.length >= 2

  const refreshUser = useCallback(async () => {
    const {
      data: { user: freshUser },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      setError(error.message)
      return
    }

    if (!freshUser) {
      setError('Unauthorized')
      return
    }

    setUser(freshUser)
  }, [supabase])

  useEffect(() => {
    // identities 포함 user를 다시 동기화
    refreshUser()
  }, [refreshUser])

  const handleUnlink = async (identity: UserIdentity) => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.unlinkIdentity(identity)

      if (error) {
        setError(error.message)
        return
      }

      await refreshUser()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'background',
      })}
    >
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'border',
          padding: '16px 0',
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
            연결된 로그인 수단
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
        <section className={cx(card(), css({ marginBottom: '16px' }))}>
          <h2 className={css({ fontSize: '18px', marginTop: 0 })}>계정</h2>
          <p className={css({ margin: 0, color: '#666' })}>
            {user.email ?? user.id}
          </p>
        </section>

        <section className={card()}>
          <h2 className={css({ fontSize: '18px', marginTop: 0 })}>목록</h2>

          {error && (
            <p className={css({ color: 'danger', marginTop: '8px' })}>
              {error}
            </p>
          )}

          {identities.length === 0 ? (
            <p className={css({ margin: 0, color: '#666' })}>
              연결된 provider 정보가 없습니다.
            </p>
          ) : (
            <div className={vstack({ gap: '12px', alignItems: 'stretch' })}>
              {identities.map((identity) => (
                <div
                  key={identity.id}
                  className={cx(
                    flex({ justify: 'space-between', align: 'center' }),
                    css({
                      padding: '12px',
                      border: '1px solid',
                      borderColor: 'border',
                      borderRadius: '8px',
                    }),
                  )}
                >
                  <div>
                    <div className={css({ fontWeight: 600 })}>
                      {getIdentityLabel(identity)}
                    </div>
                    <div className={css({ fontSize: '12px', color: '#666' })}>
                      {identity.id}
                    </div>
                  </div>

                  {canUnlink ? (
                    <button
                      type="button"
                      className={cx(
                        button({ variant: 'primary', size: 'sm' }),
                        css({ backgroundColor: 'danger' }),
                      )}
                      disabled={loading}
                      onClick={() => handleUnlink(identity)}
                    >
                      {loading ? '처리 중...' : '연결 해제'}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
