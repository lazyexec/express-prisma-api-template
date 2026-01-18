interface TokenTypes {
  ACCESS: string;
  REFRESH: string;
  RESET_PASSWORD?: string;
  VERIFY_EMAIL?: string;
}
const tokenType: TokenTypes = {
  ACCESS: "access",
  REFRESH: "refresh",
  RESET_PASSWORD: "resetPassword",
  VERIFY_EMAIL: "verifyEmail",
};

const tokenTypes = [tokenType.ACCESS, tokenType.REFRESH];

export { tokenType, tokenTypes };
