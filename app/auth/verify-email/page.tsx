import Link from 'next/link'

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        이메일 인증
      </h1>
      {error ? (
        <p style={{ color: '#b91c1c', marginBottom: 16 }}>
          인증에 실패했습니다. ({error})
        </p>
      ) : (
        <p style={{ marginBottom: 16 }}>
          이메일 인증을 진행 중입니다. 잠시만 기다려 주세요.
        </p>
      )}

      <Link href="/login">로그인으로 이동</Link>
    </div>
  )
}
