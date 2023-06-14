import dayjs from "dayjs";
import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getGoogleOAuthToken(userId: string) {
  const account = await prisma.account.findFirstOrThrow({
    where: {
      provider: "google",
      userId,
    },
  });

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiresAt ? account.expiresAt * 1000 : null,
  });

  if (!account.expiresAt) {
    return auth;
  }

  const isTokenExpired = dayjs(account.expiresAt * 1000).isBefore(new Date());

  if (isTokenExpired) {
    const { credentials } = await auth.refreshAccessToken();
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
      scope,
      token_type: tokenType,
      id_token: idToken,
    } = credentials;

    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        accessToken,
        refreshToken,
        idToken,
        scope,
        tokenType,
        expiresAt: expiryDate ? Math.floor(expiryDate / 1000) : null,
      },
    });

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
    });
  }

  return auth;
}
