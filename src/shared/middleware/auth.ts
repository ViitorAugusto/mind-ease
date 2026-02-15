import { FastifyReply, FastifyRequest } from "fastify";

export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Nao autorizado" });
  }
}
