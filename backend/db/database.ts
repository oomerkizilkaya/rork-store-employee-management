import { User, AuthToken } from './schema';

class Database {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private emailIndex: Map<string, string> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const adminUser: User = {
      id: '1',
      employeeId: 'MKL0001',
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@tr.mikelcoffee.com',
      passwordHash: '$2a$10$X7rYz8Y9xLM0eJd1vD.f6OGmZJqVzKJzq0YJ9eQz1bKz0QWzX8z1m',
      phone: '05551234567',
      store: 'Merkez',
      region: 'İstanbul',
      position: 'insan_kaynaklari',
      startDate: '2024-01-01',
      isApproved: true,
      approvedBy: ['system'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.users.set(adminUser.id, adminUser);
    this.emailIndex.set(adminUser.email.toLowerCase(), adminUser.id);
    
    console.log('✅ Database seeded with admin user');
    console.log('📧 Email: admin@tr.mikelcoffee.com');
    console.log('🔑 Password: Admin123');
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const emailLower = user.email.toLowerCase();
    
    if (this.emailIndex.has(emailLower)) {
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    const now = new Date().toISOString();
    
    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, newUser);
    this.emailIndex.set(emailLower, id);
    
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createToken(token: Omit<AuthToken, 'id' | 'createdAt'>): Promise<AuthToken> {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    
    const newToken: AuthToken = {
      ...token,
      id,
      createdAt: new Date().toISOString(),
    };

    this.tokens.set(token.token, newToken);
    return newToken;
  }

  async getTokenByValue(tokenValue: string): Promise<AuthToken | null> {
    return this.tokens.get(tokenValue) || null;
  }

  async deleteToken(tokenValue: string): Promise<void> {
    this.tokens.delete(tokenValue);
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [tokenValue, token] of this.tokens.entries()) {
      if (new Date(token.expiresAt) < now) {
        this.tokens.delete(tokenValue);
      }
    }
  }
}

export const db = new Database();
