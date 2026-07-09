import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private db: any;
  private authService: AuthService;

  constructor(dbPool: any) {
    this.authService = new AuthService(dbPool);
    this.db = dbPool;
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.registerUser(req.body);
      res
        .status(201)
        .json({ success: true, message: "User registered!", data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const clientMetadata = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      };
      const { accessToken, refreshToken, user } =
        await this.authService.loginUser(req.body, clientMetadata);

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ success: true, accessToken, user });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  };
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const [users]: any = await this.db.execute(
        `SELECT
          id,
          full_name,
          email,
          role,
          provider,
          avatar
       FROM accounts
       WHERE id = ?`,
        [req.user.id],
      );

      if (!users.length) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        user: users[0],
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };
  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.cookies.refresh_token;
      if (!token) throw new Error("Refresh token missing");

      const { accessToken } = await this.authService.refreshUserSession(token);
      res.status(200).json({ success: true, accessToken });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  };

  googleCallback = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { code, error } = req.query;

      if (error) {
        res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=${error}`,
        );
        return;
      }

      if (!code) {
        res
          .status(400)
          .json({ success: false, message: "Authorization code missing." });
        return;
      }

      const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/google/callback`;

      // 1. Exchange code using native global fetch
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(
          `Google token exchange failed with status ${tokenResponse.status}`,
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData;

      // 2. Fetch user profile using native fetch
      const profileResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user info from Google");
      }

      const profileData = await profileResponse.json();
      const { id: googleId, email, name } = profileData;

      if (!email) {
        res
          .status(400)
          .json({ success: false, message: "Email not provided by Google." });
        return;
      }

      // 3. Database Sync Block - Checking for existing profile
      const [users]: any = await this.db.execute(
        "SELECT * FROM accounts WHERE email = ? OR google_id = ?",
        [email, googleId],
      );

      let user = users[0];

      if (!user) {
        // If user doesn't exist, execute a fresh insertion
        const [result]: any = await this.db.execute(
          "INSERT INTO accounts (full_name, email, provider, google_id, account_status, role) VALUES (?, ?, 'google', ?, 'active', 'user')",
          [name || "Google User", email, googleId],
        );

        user = {
          id: result.insertId,
          email,
          role: "user",
          full_name: name || "Google User",
        };
        console.log(" New Google user securely saved to database:", user.id);
      } else if (!user.google_id) {
        // Link Google provider if account was previously created locally
        await this.db.execute(
          "UPDATE accounts SET provider = 'google', google_id = ? WHERE id = ?",
          [googleId, user.id],
        );
        user.google_id = googleId;
        user.provider = "google";
        console.log(
          " Linked Google authentication to existing local profile:",
          user.id,
        );
      }

      // 4. Fallback Token Engine Generation
      // If your authService.loginUser fails or crashes with OAuth payloads,
      // you can use your app's token generation methods here directly.
      const clientMetadata = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      };

      let sessionTokens;
      try {
        // Attempting passing validation bypass flags to your existing service structure
        sessionTokens = await this.authService.loginUser(
          { email, isOAuth: true } as any,
          clientMetadata,
        );
      } catch (srvErr) {
        console.warn(
          "AuthService.loginUser failed on OAuth callback bypass. Falling back to explicit token signing wrapper.",
        );
        // Fallback placeholder logic if method fails—ensure your auth.service handles this cleanly!
        throw srvErr;
      }

      const { accessToken, refreshToken } = sessionTokens;

      // 5. Append secure HttpOnly token cookie
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // 6. Redirect browser back to frontend application dashboard
      res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback?token=${accessToken}`,
      );
    } catch (error: any) {
      console.error(
        "❌ Critical error inside Google Callback routing sequence:",
        error.message,
      );
      next(error);
    }
  };
}
