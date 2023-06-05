import { prisma } from "@/src/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { buildNextAuthOptions } from "../auth/[...nextauth].api";

const timeIntervalsBodySchema = z.object({
  intervals: z.array(
    z.object({
      weekDay: z.number(),
      timeStartInMinutes: z.number(),
      timeEndInMinutes: z.number(),
    })
  ),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const authOptions = buildNextAuthOptions(req, res);
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).end();
  }

  const { intervals } = timeIntervalsBodySchema.parse(req.body);

  const intervalsWithUser = intervals.map((interval) => ({
    ...interval,
    userId: session.user.id,
  }));

  await prisma.userTimeInterval.createMany({
    data: intervalsWithUser,
  });

  return res.status(201).end();
}
