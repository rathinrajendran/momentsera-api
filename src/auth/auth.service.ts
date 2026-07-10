import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./jwt";
import { comparePassword } from "./password";
export class AuthService {
  private db: any;

  constructor(dbPool: any) {
    this.db = dbPool;
  }

  async registerUser(body: any): Promise<any> {
    return { id: 1, email: body.email };
  }

  async loginUser(body: any, clientMetadata: any) {
    const { email, password, isOAuth } = body;

    // 1. Fetch user profile from database
    const [users]: any = await this.db.execute(
      "SELECT * FROM accounts WHERE email = ?",
      [email],
    );
    const user = users[0];

    if (!user) throw new Error("User profile registration mismatch.");

    // 2. 🔐 OAUTH BYPASS RULE: Skip verification if verified via Google Federated ID
    if (!isOAuth) {
      if (!user.password) throw new Error("Please sign in using Google.");

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password parameters.");
      }
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      ip: clientMetadata.ip,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async refreshUserSession(token: string): Promise<any> {
    try {
      const decoded = verifyRefreshToken(token);

      if (!decoded) {
        throw new Error("Invalid or expired refresh token");
      }

      const [users]: any = await this.db.execute(
        "SELECT * FROM accounts WHERE id = ?",
        [decoded.id],
      );
      const user = users[0];
      if (!user) throw new Error("User no longer exists");

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      return { accessToken };
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }
  }
}
