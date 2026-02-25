const translations: Record<string, string> = {
  "Password is known to be weak and easy to guess. Please choose a different one.":
    "Esta senha é muito fraca e comum. Por favor, escolha uma senha mais segura.",
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Email não confirmado. Verifique sua caixa de entrada.",
  "User already registered": "Este email já está cadastrado.",
  "Signup requires a valid password": "A senha é obrigatória.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "New password should be different from the old password.":
    "A nova senha deve ser diferente da senha atual.",
  "Auth session missing!":
    "Sessão expirada. Solicite um novo link de recuperação.",
  "Password should be at least 6 characters.":
    "A senha deve ter pelo menos 6 caracteres.",
  "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, 0123456789":
    "A senha deve conter pelo menos uma letra e um número.",
};

export function translateAuthError(message: string): string {
  return translations[message] || message;
}
