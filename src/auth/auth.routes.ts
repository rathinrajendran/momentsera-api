import { Router } from "express";
import { AuthController } from "./auth.controller";

export function createAuthRoutes(dbPool: any): Router {
  const router = Router();
  const controller = new AuthController(dbPool);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);

  router.get("/google/redirect", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/google/callback`;
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&access_type=offline` +
      `&prompt=consent`;
    res.redirect(googleAuthUrl);
  });

  router.get("/google/callback", controller.googleCallback);

  return router;
}
