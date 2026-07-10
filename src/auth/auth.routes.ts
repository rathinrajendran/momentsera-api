import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "./auth.middleware";
export function createAuthRoutes(dbPool: any): Router {
  const router = Router();
  const controller = new AuthController(dbPool);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/forgot-password", controller.forgotPassword);

  router.post("/reset-password", controller.resetPassword);

  router.post("/verify-email", controller.verifyEmail);
  router.get("/google/redirect", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;
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
  router.get("/me", authenticate, controller.me);
  router.post("/logout", controller.logout);
  router.get("/google/callback", controller.googleCallback);

  return router;
}
