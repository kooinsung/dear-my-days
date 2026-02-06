// 에러 메시지 상수화
export const ERROR_MESSAGES = {
  // 인증 관련
  auth: {
    invalidEmail: '올바른 이메일을 입력하세요',
    invalidPassword: '비밀번호는 8자 이상이어야 합니다',
    unauthorized: '로그인이 필요합니다',
    loginFailed: '로그인에 실패했습니다',
    signupFailed: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    emailRequired: '이메일을 입력하세요',
    passwordRequired: '비밀번호를 입력하세요',
    emailAndPasswordRequired: '이메일과 비밀번호를 입력하세요',
    resetLinkExpired: '링크가 만료되었습니다',
    resetFailed: '요청을 처리할 수 없습니다',
  },

  // 이벤트 관련
  events: {
    titleRequired: '제목을 입력하세요',
    titleTooLong: '제목이 너무 깁니다',
    categoryRequired: '카테고리를 선택하세요',
    dateRequired: '날짜를 입력하세요',
    invalidDate: '올바른 날짜를 입력하세요',
    noteTooLong: '메모가 너무 깁니다',
    createFailed: '이벤트 생성에 실패했습니다',
    updateFailed: '이벤트 수정에 실패했습니다',
    deleteFailed: '이벤트 삭제에 실패했습니다',
    notFound: '이벤트를 찾을 수 없습니다',
    solarDateRequired: 'solar_date is required when calendar_type is SOLAR',
    lunarDateRequired: 'lunar_date is required when calendar_type is LUNAR',
  },

  // 서버 관련
  server: {
    generic: '요청 처리에 실패했습니다',
    notFound: '요청하신 내용을 찾을 수 없습니다',
    tooManyRequests: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    invalidPayload: '입력값이 올바르지 않습니다',
    configError: '서버 설정 오류',
  },

  // 달력 관련
  calendar: {
    conversionFailed: '날짜 변환에 실패했습니다',
    noConversionCandidates: 'No conversion candidates returned from KASI',
    invalidDateFormat: 'YYYY-MM-DD 형식이어야 합니다',
    lunarParamsRequired:
      'lunarMonth, lunarDay, fromYear, toYear query params are required',
  },
} as const

// 성공 메시지
export const SUCCESS_MESSAGES = {
  auth: {
    signupSuccess: '회원가입이 완료되었습니다',
    loginSuccess: '로그인되었습니다',
    logoutSuccess: '로그아웃되었습니다',
    resetEmailSent: '비밀번호 재설정 이메일이 발송되었습니다',
    passwordReset: '비밀번호가 재설정되었습니다',
  },

  events: {
    created: '이벤트가 생성되었습니다',
    updated: '이벤트가 수정되었습니다',
    deleted: '이벤트가 삭제되었습니다',
  },
} as const
