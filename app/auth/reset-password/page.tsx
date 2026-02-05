import Link from 'next/link'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { uid?: string; token?: string; error?: string }
}) {
  const error = searchParams?.error

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        비밀번호 재설정
      </h1>

      {error ? (
        <p style={{ color: '#b91c1c', marginBottom: 16 }}>
          요청을 처리할 수 없습니다. ({error})
        </p>
      ) : (
        <p style={{ marginBottom: 16 }}>
          새 비밀번호를 입력해 재설정을 완료해 주세요.
        </p>
      )}

      <ResetPasswordForm />

      <div style={{ marginTop: 16 }}>
        <Link href="/login">로그인으로 이동</Link>
      </div>
    </div>
  )
}
