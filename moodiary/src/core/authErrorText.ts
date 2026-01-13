// src/core/authErrorText.ts
import { FirebaseError } from "firebase/app";

type Opts = { defaultMessage?: string };

export function authErrorText(err: unknown, opts: Opts = {}) {
  const fallback = opts.defaultMessage ?? "요청에 실패했어. 잠시 후 다시 시도해줘.";

  // Firebase Auth는 보통 FirebaseError(code: "auth/...")
  const code =
    err instanceof FirebaseError ? err.code : (err as any)?.code;

  if (typeof code !== "string") return fallback;

  switch (code) {
    // 로그인/회원가입 공통
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않아";
    case "auth/user-disabled":
      return "비활성화된 계정이야";
    case "auth/user-not-found":
      return "가입된 계정을 찾을 수 없어";
    case "auth/wrong-password":
    case "auth/invalid-credential": // 최신 SDK에서 비번 오류가 이걸로 뜨는 경우 있음
      return "이메일 또는 비밀번호가 올바르지 않아";
    case "auth/too-many-requests":
      return "요청이 너무 많아. 잠시 후 다시 시도해줘.";

    // 회원가입
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일이야";
    case "auth/weak-password":
      return "비밀번호가 너무 약해. 더 길고 복잡하게 만들어줘.";

    // 비밀번호 변경/재인증
    case "auth/requires-recent-login":
      return "보안을 위해 다시 로그인 후 시도해줘.";
    case "auth/network-request-failed":
      return "네트워크 상태가 불안정해. 연결 확인 후 다시 시도해줘.";

    default:
      return fallback;
  }
}
