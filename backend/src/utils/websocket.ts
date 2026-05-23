import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "./logger";

/**
 * Interface for client connection metadata
 */
interface ClientConnection {
  ws: WebSocket;
  jobId: string;
}

/**
 * WebSocket message types
 */
export interface WSMessage {
  type: "progress" | "completed" | "error" | "subscribe" | "unsubscribe";
  jobId: string;
  progress?: number;
  status?: string;
  downloadUrl?: string;
  message?: string;
}

/**
 * Global WebSocket server instance
 */
let wss: WebSocketServer | null = null;

/**
 * Map to track active connections by jobId
 * Structure: jobId -> Set<WebSocket>
 */
const jobSubscriptions = new Map<string, Set<WebSocket>>();

/**
 * Map to track client metadata
 * Structure: WebSocket -> { ws, jobId }
 */
const clientMetadata = new Map<WebSocket, ClientConnection>();

/**
 * Initialize WebSocket server and attach to Express HTTP server
 * @param server - Express HTTP server instance
 */
export function initializeWebSocket(server: HTTPServer): WebSocketServer {
  if (wss) {
    logger.warn("WebSocket server already initialized", {});
    return wss;
  }

  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("New WebSocket connection established", {});

    ws.on("message", (rawData: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(rawData.toString("utf8"));
        logger.info("Received WebSocket message", { message });

        if (message.type === "subscribe") {
          subscribeToJob(ws, message.jobId);
        } else if (message.type === "unsubscribe") {
          unsubscribeFromJob(ws, message.jobId);
        }
      } catch (error) {
        logger.error(
          "Failed to parse WebSocket message",
          error instanceof Error ? error.message : error,
        );
        ws.send(
          JSON.stringify({
            type: "error",
            jobId: "unknown",
            status: "failed",
            message: "Invalid message format",
          }),
        );
      }
    });

    ws.on("close", () => {
      logger.info("WebSocket connection closed", {});
      cleanupClient(ws);
    });

    ws.on("error", (error: Error) => {
      logger.error("WebSocket error occurred", error.message || error);
      cleanupClient(ws);
    });
  });

  logger.info("WebSocket server initialized on /ws", {});
  return wss;
}

/**
 * Subscribe a WebSocket client to updates for a specific jobId
 * @param ws - WebSocket connection
 * @param jobId - Job ID to subscribe to
 */
export function subscribeToJob(ws: WebSocket, jobId: string): void {
  if (!jobId || typeof jobId !== "string") {
    logger.error("Invalid jobId for subscription", { jobId });
    return;
  }

  // Unsubscribe from previous job if already subscribed
  const existingMetadata = clientMetadata.get(ws);
  if (existingMetadata && existingMetadata.jobId !== jobId) {
    unsubscribeFromJob(ws, existingMetadata.jobId);
  }

  // Add to jobSubscriptions map
  if (!jobSubscriptions.has(jobId)) {
    jobSubscriptions.set(jobId, new Set<WebSocket>());
  }
  jobSubscriptions.get(jobId)!.add(ws);

  // Store client metadata
  clientMetadata.set(ws, { ws, jobId });

  logger.info("Client subscribed to job updates", { jobId });

  // Send confirmation message
  ws.send(
    JSON.stringify({
      type: "subscribe",
      jobId,
      status: "subscribed",
    }),
  );
}

/**
 * Unsubscribe a WebSocket client from updates for a specific jobId
 * @param ws - WebSocket connection
 * @param jobId - Job ID to unsubscribe from
 */
export function unsubscribeFromJob(ws: WebSocket, jobId: string): void {
  if (!jobId || typeof jobId !== "string") {
    logger.error("Invalid jobId for unsubscription", { jobId });
    return;
  }

  const subscribers = jobSubscriptions.get(jobId);
  if (subscribers) {
    subscribers.delete(ws);

    // Clean up empty job subscriptions
    if (subscribers.size === 0) {
      jobSubscriptions.delete(jobId);
    }
  }

  // Remove from client metadata if it matches
  const metadata = clientMetadata.get(ws);
  if (metadata && metadata.jobId === jobId) {
    clientMetadata.delete(ws);
  }

  logger.info("Client unsubscribed from job updates", { jobId });
}

/**
 * Broadcast a message to all clients subscribed to a specific jobId
 * @param jobId - Job ID to broadcast to
 * @param data - Message data to send
 */
export function broadcastToJob(jobId: string, data: WSMessage): void {
  if (!jobId || typeof jobId !== "string") {
    logger.error("Invalid jobId for broadcast", { jobId });
    return;
  }

  const subscribers = jobSubscriptions.get(jobId);
  if (!subscribers || subscribers.size === 0) {
    logger.debug("No subscribers for job", { jobId, subscriberCount: 0 });
    return;
  }

  const messageStr = JSON.stringify(data);
  let successCount = 0;
  let failureCount = 0;

  subscribers.forEach((ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        successCount++;
      } catch (error) {
        logger.error(
          "Failed to send message to subscriber",
          error instanceof Error
            ? { error: error.message, jobId }
            : { error, jobId },
        );
        failureCount++;
        subscribers.delete(ws);
      }
    } else {
      logger.debug("WebSocket not open, removing from subscribers", {
        readyState: ws.readyState,
        jobId,
      });
      subscribers.delete(ws);
    }
  });

  logger.info("Broadcast completed", { jobId, successCount, failureCount });
}

/**
 * Clean up client connections on disconnect
 * @param ws - WebSocket connection to clean up
 */
function cleanupClient(ws: WebSocket): void {
  const metadata = clientMetadata.get(ws);

  if (metadata) {
    const { jobId } = metadata;
    unsubscribeFromJob(ws, jobId);
    clientMetadata.delete(ws);
    logger.info("Client cleaned up after disconnect", { jobId });
  }
}

/**
 * Get connection statistics
 * Useful for monitoring and debugging
 */
export function getConnectionStats(): {
  totalJobs: number;
  totalConnections: number;
  jobDetails: Array<{ jobId: string; subscribers: number }>;
} {
  let totalConnections = 0;
  const jobDetails = Array.from(jobSubscriptions.entries()).map(
    ([jobId, subscribers]) => {
      totalConnections += subscribers.size;
      return {
        jobId,
        subscribers: subscribers.size,
      };
    },
  );

  return {
    totalJobs: jobSubscriptions.size,
    totalConnections,
    jobDetails,
  };
}

/**
 * Shutdown WebSocket server
 */
export function shutdownWebSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (wss) {
      jobSubscriptions.clear();
      clientMetadata.clear();
      wss.close(() => {
        logger.info("WebSocket server shut down", {});
        wss = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Reset WebSocket state (for testing)
 */
export function _resetWebSocketState(): void {
  if (wss) {
    try {
      wss.close();
    } catch (error) {
      // Ignore close errors during reset
    }
  }
  wss = null;
  jobSubscriptions.clear();
  clientMetadata.clear();
}
