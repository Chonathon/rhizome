// Placeholder for alpha password validation
export const MOCK_ALPHA_PASSWORDS: readonly string[] = [
  "letmein",
  "rhizome-alpha",
  "sprout-123",
];

export function validateAlphaPasswordMock(password: string): boolean {
  const trimmed = password.trim();
  if (!trimmed) return false;
  return MOCK_ALPHA_PASSWORDS.includes(trimmed);
}


