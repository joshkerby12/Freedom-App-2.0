export type AuthActionState = {
  error: string | null;
  success: string | null;
};

export const initialAuthActionState: AuthActionState = {
  error: null,
  success: null,
};
