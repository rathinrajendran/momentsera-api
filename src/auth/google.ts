import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export interface GoogleUserPayload {
  sub: string; // Google ID
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(
  idToken: string,
): Promise<GoogleUserPayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || "",
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}
