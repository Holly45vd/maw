// src/core/authPolicy.ts
export const PASSWORD_MIN_LEN = 8 as const;

export function validatePassword(pw: string) {
  if (pw.length < PASSWORD_MIN_LEN) {
    return `비밀번호는 ${PASSWORD_MIN_LEN}자 이상`;
  }
  return null;
}
