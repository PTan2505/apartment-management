import { randomUUID } from "node:crypto";
import type { Server } from "node:http";

import jwt from "jsonwebtoken";
import { WebSocketServer, type WebSocket } from "ws";

import { env } from "@/config/env.js";
import type { AccessTokenPayload } from "@/modules/auth/service.js";

/**
 * Pushing an event to somebody who is looking at the application right now.
 *
 * Deliberately small. It carries a signal that something changed; the client
 * then asks the API for the rest, because a pushed record is a second
 * serialisation free to drift from the endpoint's and free to carry a field
 * the recipient's role would not have been given.
 *
 * Nothing may depend on delivery. Every fact an event announces is also
 * available by asking — the notice it refers to is a row, and the count on
 * arrival is computed from rows. The socket makes it immediate; it is not what
 * makes it true.
 */

/** How long an unauthenticated connection is tolerated. */
const AUTH_GRACE_MS = 5_000;

/** How often to check a connection is still alive, and its token still valid. */
const SWEEP_MS = 30_000;

interface LiveSocket {
  socket: WebSocket;
  userId: number;
  /** When the presented access token stops being valid, in ms since epoch. */
  expiresAt: number;
  alive: boolean;
}

/**
 * Who is connected, by account.
 *
 * IN MEMORY, which is correct for one process and silently wrong for two: with
 * a second instance, half the staff would miss half the events and nothing
 * would report it. If this API is ever scaled beyond one instance, the events
 * must go through a shared channel — Redis pub/sub, or Postgres LISTEN/NOTIFY
 * — BEFORE that happens.
 *
 * The instance id logged at startup exists so that day has something to notice.
 */
const connections = new Map<number, Set<LiveSocket>>();

/** This process, named once so two of them are distinguishable in a log. */
export const INSTANCE_ID = randomUUID().slice(0, 8);

function register(entry: LiveSocket) {
  const existing = connections.get(entry.userId) ?? new Set<LiveSocket>();
  existing.add(entry);
  connections.set(entry.userId, existing);
}

function unregister(entry: LiveSocket) {
  const existing = connections.get(entry.userId);
  if (!existing) return;
  existing.delete(entry);
  if (existing.size === 0) connections.delete(entry.userId);
}

/**
 * Verifies an access token and returns who it belongs to and when it dies.
 *
 * The same secret and the same claims the HTTP guard uses. A socket is not a
 * second way in: it is the same credential, presented over a different
 * transport.
 */
function verify(token: string): { userId: number; expiresAt: number } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & { exp?: number };
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) return null;
    // `exp` is in seconds. A token without one cannot be aged out, so it is
    // refused rather than trusted indefinitely.
    if (!payload.exp) return null;
    return { userId, expiresAt: payload.exp * 1000 };
  } catch {
    return null;
  }
}

export interface LiveEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Sends an event to the accounts named, and to nobody else.
 *
 * Addressed, never broadcast: a notice is a small leak of exactly the kind a
 * listing would be, and staff of another building must not learn that a report
 * arrived there.
 */
export function sendToUsers(userIds: number[], event: LiveEvent): void {
  const payload = JSON.stringify(event);
  for (const userId of new Set(userIds)) {
    for (const entry of connections.get(userId) ?? []) {
      if (entry.socket.readyState === entry.socket.OPEN) {
        entry.socket.send(payload);
      }
    }
  }
}

/** How many sockets are open, for the startup line and for tests. */
export function liveConnectionCount(): number {
  let total = 0;
  for (const set of connections.values()) total += set.size;
  return total;
}

/**
 * Attaches the live channel to the HTTP server already listening.
 *
 * Same server, same port: Render needs nothing configured, and the CORS origin
 * list the API already keeps is the one that applies.
 *
 * `noServer` with an explicit upgrade handler rather than `{ server }`, so that
 * an upgrade on any other path is refused outright instead of being handed to
 * a WebSocket server that would accept it.
 */
export function attachLiveChannel(server: Server, path = "/live"): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname !== path) {
      socket.destroy();
      return;
    }
    /*
      A token in the query string is refused, not read.

      `pinoHttp` logs `req.url` on every request, so a credential there is
      written into the log each time a socket is opened — the same reason the
      portal's token travels in a fragment and the API's in a header. The
      browser cannot set headers on a WebSocket, so the token arrives in the
      first MESSAGE instead.
    */
    if (url.searchParams.has("token") || url.searchParams.has("access_token")) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws));
  });

  wss.on("connection", (socket: WebSocket) => {
    let entry: LiveSocket | null = null;

    // Unauthenticated connections are not tolerated for long: an open socket
    // that has said nothing is either a mistake or somebody looking.
    const graceTimer = setTimeout(() => {
      if (!entry) socket.close(4401, "authentication required");
    }, AUTH_GRACE_MS);

    socket.on("message", (raw) => {
      let message: { type?: string; token?: string };
      try {
        message = JSON.parse(String(raw)) as { type?: string; token?: string };
      } catch {
        return;
      }
      if (message.type !== "auth" || typeof message.token !== "string") return;

      const claims = verify(message.token);
      if (!claims) {
        socket.close(4401, "authentication failed");
        return;
      }

      if (entry) {
        // A renewed token on a connection already authenticated. The access
        // token lives fifteen minutes and a socket lives as long as the tab,
        // so the client presents each new one as it renews; without this the
        // connection would be closed every quarter of an hour.
        if (claims.userId !== entry.userId) {
          socket.close(4401, "authentication failed");
          return;
        }
        entry.expiresAt = claims.expiresAt;
        return;
      }

      clearTimeout(graceTimer);
      entry = { socket, userId: claims.userId, expiresAt: claims.expiresAt, alive: true };
      register(entry);
      socket.send(JSON.stringify({ type: "ready" }));
    });

    socket.on("pong", () => {
      if (entry) entry.alive = true;
    });

    socket.on("close", () => {
      clearTimeout(graceTimer);
      if (entry) unregister(entry);
    });

    socket.on("error", () => {
      clearTimeout(graceTimer);
      if (entry) unregister(entry);
      socket.terminate();
    });
  });

  /*
    One sweep for two jobs: dropping connections whose token has expired
    without being replaced, and dropping ones that stopped answering.

    An expired token is closed rather than left open. A socket authenticated
    once and trusted for ever would outlive a deactivated account, which is
    exactly what the HTTP guard refuses to do by checking the database on
    every request.
  */
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const set of connections.values()) {
      for (const entry of set) {
        if (entry.expiresAt <= now) {
          entry.socket.close(4401, "token expired");
          continue;
        }
        if (!entry.alive) {
          entry.socket.terminate();
          continue;
        }
        entry.alive = false;
        entry.socket.ping();
      }
    }
  }, SWEEP_MS);
  sweep.unref();

  return wss;
}
