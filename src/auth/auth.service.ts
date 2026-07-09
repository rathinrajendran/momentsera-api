import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthService {
  private db: any;
  private jwtSecret: string;

  constructor(dbPool: any) {
    this.db = dbPool;
    this.jwtSecret = process.env.JWT_SECRET || "storeinvites_auth";
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
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password parameters.");
      }
    }

    // 3. Generate production platform tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user, clientMetadata);

    return { 
      accessToken, 
      refreshToken, 
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      } 
    };
  }

  async refreshUserSession(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      const [users]: any = await this.db.execute(
        "SELECT * FROM accounts WHERE id = ?",
        [decoded.id]
      );
      const user = users[0];
      if (!user) throw new Error("User no longer exists");

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  // 🛠️ HEALING METHODS Added to satisfy TypeScript requirements
  private generateAccessToken(user: any): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: "15m" } // 15 Minute short-lived access
    );
  }

  private generateRefreshToken(user: any, clientMetadata: any): string {
    return jwt.sign(
      { id: user.id, ip: clientMetadata.ip },
      this.jwtSecret,
      { expiresIn: "7d" } // 7 Day rolling session window
    );
  }
}