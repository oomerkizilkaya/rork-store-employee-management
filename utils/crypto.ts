import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Şifre hash işlemi başarısız oldu');
  }
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const hash = await hashPassword(password);
    return hash === hashedPassword;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export function generateToken(): string {
  const randomBytes = Crypto.getRandomBytes(32);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: 'Şifre en az 8 karakter olmalıdır' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir büyük harf içermelidir' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir küçük harf içermelidir' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir rakam içermelidir' };
  }
  
  return { valid: true };
}
