import { NextApiRequest, NextApiResponse } from "next";
import { Adapter } from "next-auth/adapters";
import { destroyCookie, parseCookies } from "nookies";
import { prisma } from "../prisma";

export function PrismaAdapter(
  req: NextApiRequest,
  res: NextApiResponse
): Adapter {
  return {
    async createUser(user) {
      const { "@ignitecall:userId": userIdOnCookies } = parseCookies({ req });

      if (!userIdOnCookies) {
        throw new Error("User ID not found on cookies");
      }

      const prismaUser = await prisma.user.update({
        where: {
          id: userIdOnCookies,
        },
        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });

      destroyCookie({ res }, "@ignitecall:userId", {
        path: "/",
      });

      return {
        id: prismaUser.id,
        name: prismaUser.name,
        username: prismaUser.username,
        email: prismaUser.email!,
        avatarUrl: prismaUser.avatarUrl!,
        emailVerified: null,
      };
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email!,
        avatarUrl: user.avatarUrl!,
        emailVerified: null,
      };
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email!,
        avatarUrl: user.avatarUrl!,
        emailVerified: null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            providerAccountId,
            provider,
          },
        },
        include: {
          user: true,
        },
      });

      if (!account) return null;

      const { user } = account;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email!,
        avatarUrl: user.avatarUrl!,
        emailVerified: null,
      };
    },

    async updateUser(user) {
      const userUpdated = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });

      return {
        id: userUpdated.id,
        name: userUpdated.name,
        username: userUpdated.username,
        email: userUpdated.email!,
        avatarUrl: userUpdated.avatarUrl!,
        emailVerified: null,
      };
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          type: account.type,
          idToken: account.id_token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
          scope: account.scope,
          sessionState: account.session_state,
          tokenType: account.token_type,
          userId: account.userId,
        },
      });
    },

    async createSession({ sessionToken, userId, expires }) {
      await prisma.session.create({
        data: {
          userId,
          expires,
          sessionToken,
        },
      });

      return {
        userId,
        sessionToken,
        expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      const prismaSession = await prisma.session.findUnique({
        where: {
          sessionToken,
        },
        include: {
          user: true,
        },
      });

      if (!prismaSession) return null;

      const { user, ...session } = prismaSession;

      return {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email!,
          avatarUrl: user.avatarUrl!,
          emailVerified: null,
        },
        session: {
          userId: session.userId,
          expires: session.expires,
          sessionToken: session.sessionToken,
        },
      };
    },

    async updateSession({ sessionToken, userId, expires }) {
      const sessionUpdated = await prisma.session.update({
        where: {
          sessionToken,
        },
        data: {
          userId,
          expires,
        },
      });

      return sessionUpdated;
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: {
          sessionToken,
        },
      });
    },
  };
}
