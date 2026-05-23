/**
 * Section 8: WebSocket Manager Acceptance Tests
 * Verifies:
 * 1. WebSocket server initializes with Express
 * 2. Clients can subscribe to job updates
 * 3. Broadcast messages reach subscribed clients
 * 4. Disconnections are handled gracefully
 * 5. Error handling works correctly
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { strict as assert } from "assert";
import { createServer, Server } from "http";
import { WebSocket } from "ws";
import { logger } from "../utils/logger";
import {
  initializeWebSocket,
  broadcastToJob,
  getConnectionStats,
  shutdownWebSocket,
  _resetWebSocketState,
  WSMessage,
} from "./websocket";

// Test helper: Create a test HTTP server
function createTestServer(): Server {
  const server = createServer((_req, res) => {
    res.writeHead(200);
    res.end("Test server");
  });
  return server;
}

// Test helper: Create a WebSocket client
function createTestClient(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => resolve(ws));
    ws.on("error", (error) => reject(error));
    setTimeout(() => reject(new Error("Connection timeout")), 5000);
  });
}

// Test helper: Wait for WebSocket message
function waitForMessage(ws: WebSocket): Promise<WSMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Message timeout")),
      5000,
    );
    ws.on("message", (data: Buffer) => {
      clearTimeout(timeout);
      try {
        const message = JSON.parse(data.toString("utf8"));
        resolve(message);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Test 1: WebSocket server initializes with Express HTTP server
 */
async function testWebSocketInitialization(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 1: WebSocket Server Initialization");

    const server = createTestServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    const wss = initializeWebSocket(server);

    assert(wss !== null, "WebSocket server should not be null");
    assert(wss !== undefined, "WebSocket server should be defined");

    console.log("✅ Test 1 PASSED: WebSocket server initialized successfully");

    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 1 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 2: Client can subscribe to job updates
 */
async function testClientSubscription(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 2: Client Subscription");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    // Subscribe to a job
    const jobId = `job-${Date.now()}`;
    client.send(JSON.stringify({ type: "subscribe", jobId }));

    // Wait for subscription confirmation
    const response = await waitForMessage(client);

    assert.equal(
      response.type,
      "subscribe",
      "Should receive subscribe response",
    );
    assert.equal(response.jobId, jobId, "JobId should match");
    assert.equal(response.status, "subscribed", "Status should be subscribed");

    console.log("✅ Test 2 PASSED: Client subscription works correctly");

    client.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 2 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 3: Broadcast messages reach subscribed clients
 */
async function testBroadcastMessage(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 3: Broadcast Messages");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    // Subscribe to a job
    const jobId = `job-${Date.now()}`;
    client.send(JSON.stringify({ type: "subscribe", jobId }));

    // Wait for subscription confirmation
    await waitForMessage(client);

    // Give subscription time to register
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Broadcast a progress message
    const progressMessage: WSMessage = {
      type: "progress",
      jobId,
      progress: 50,
      status: "processing",
    };
    broadcastToJob(jobId, progressMessage);

    // Wait for the broadcast message
    const received = await waitForMessage(client);

    assert.equal(received.type, "progress", "Should receive progress message");
    assert.equal(received.jobId, jobId, "JobId should match");
    assert.equal(received.progress, 50, "Progress should be 50");
    assert.equal(received.status, "processing", "Status should be processing");

    console.log(
      "✅ Test 3 PASSED: Broadcast messages reach subscribed clients",
    );

    client.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 3 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 4: Multiple clients receive broadcast messages
 */
async function testMultipleClientBroadcast(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 4: Multiple Clients Broadcast");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);

    // Create three clients
    const client1 = await createTestClient(`ws://localhost:${port}/ws`);
    const client2 = await createTestClient(`ws://localhost:${port}/ws`);
    const client3 = await createTestClient(`ws://localhost:${port}/ws`);

    const jobId = `job-${Date.now()}`;

    // All three subscribe to the same job
    client1.send(JSON.stringify({ type: "subscribe", jobId }));
    client2.send(JSON.stringify({ type: "subscribe", jobId }));
    client3.send(JSON.stringify({ type: "subscribe", jobId }));

    // Wait for all subscriptions
    await waitForMessage(client1);
    await waitForMessage(client2);
    await waitForMessage(client3);

    // Give subscriptions time to register
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Broadcast a completion message
    const completedMessage: WSMessage = {
      type: "completed",
      jobId,
      status: "done",
      downloadUrl: "https://example.com/file.pdf",
    };
    broadcastToJob(jobId, completedMessage);

    // All three should receive the message
    const msg1 = await waitForMessage(client1);
    const msg2 = await waitForMessage(client2);
    const msg3 = await waitForMessage(client3);

    assert.equal(msg1.type, "completed", "Client 1 should receive completed");
    assert.equal(msg2.type, "completed", "Client 2 should receive completed");
    assert.equal(msg3.type, "completed", "Client 3 should receive completed");

    assert.equal(
      msg1.downloadUrl,
      "https://example.com/file.pdf",
      "Client 1 should have downloadUrl",
    );
    assert.equal(
      msg2.downloadUrl,
      "https://example.com/file.pdf",
      "Client 2 should have downloadUrl",
    );
    assert.equal(
      msg3.downloadUrl,
      "https://example.com/file.pdf",
      "Client 3 should have downloadUrl",
    );

    console.log(
      "✅ Test 4 PASSED: Multiple clients receive broadcast messages",
    );

    client1.close();
    client2.close();
    client3.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 4 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 5: Client unsubscription works correctly
 */
async function testClientUnsubscription(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 5: Client Unsubscription");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    const jobId = `job-${Date.now()}`;

    // Subscribe
    client.send(JSON.stringify({ type: "subscribe", jobId }));
    await waitForMessage(client);

    // Get stats after subscription
    let stats = getConnectionStats();
    assert.equal(stats.totalJobs, 1, "Should have 1 job subscribed");
    assert.equal(stats.totalConnections, 1, "Should have 1 connection");

    // Unsubscribe
    client.send(JSON.stringify({ type: "unsubscribe", jobId }));

    // Give time to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get stats after unsubscription
    stats = getConnectionStats();
    assert.equal(stats.totalJobs, 0, "Should have 0 jobs after unsubscribe");
    assert.equal(
      stats.totalConnections,
      0,
      "Should have 0 connections after unsubscribe",
    );

    console.log("✅ Test 5 PASSED: Client unsubscription works correctly");

    client.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 5 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 6: Unsubscribed clients don't receive broadcasts
 */
async function testUnsubscribedClientsExcluded(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 6: Unsubscribed Clients Excluded");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client1 = await createTestClient(`ws://localhost:${port}/ws`);
    const client2 = await createTestClient(`ws://localhost:${port}/ws`);

    const jobId = `job-${Date.now()}`;

    // Both subscribe
    client1.send(JSON.stringify({ type: "subscribe", jobId }));
    client2.send(JSON.stringify({ type: "subscribe", jobId }));
    await waitForMessage(client1);
    await waitForMessage(client2);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Client 2 unsubscribes
    client2.send(JSON.stringify({ type: "unsubscribe", jobId }));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Broadcast message
    broadcastToJob(jobId, {
      type: "progress",
      jobId,
      progress: 75,
      status: "processing",
    });

    // Client 1 should receive the message
    const msg = await waitForMessage(client1);
    assert.equal(msg.type, "progress", "Client 1 should receive message");
    assert.equal(msg.progress, 75, "Progress should be 75");

    // Client 2 should not receive the message (timeout expected)
    let client2Received = false;
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(false), 1000);
    });
    const messagePromise = new Promise((resolve) => {
      client2.on("message", () => {
        client2Received = true;
        resolve(true);
      });
    });

    await Promise.race([messagePromise, timeoutPromise]);
    assert.equal(
      client2Received,
      false,
      "Unsubscribed client should not receive broadcast",
    );

    console.log("✅ Test 6 PASSED: Unsubscribed clients correctly excluded");

    client1.close();
    client2.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 6 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 7: Connection handles disconnections gracefully
 */
async function testDisconnectionHandling(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 7: Disconnection Handling");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    const jobId = `job-${Date.now()}`;

    // Subscribe
    client.send(JSON.stringify({ type: "subscribe", jobId }));
    await waitForMessage(client);

    let stats = getConnectionStats();
    assert.equal(stats.totalConnections, 1, "Should have 1 connection");

    // Disconnect
    client.close();

    // Give time to process disconnect
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check stats after disconnect
    stats = getConnectionStats();
    assert.equal(
      stats.totalConnections,
      0,
      "Should have 0 connections after disconnect",
    );

    console.log("✅ Test 7 PASSED: Disconnections handled gracefully");

    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 7 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 8: Error messages are properly formatted
 */
async function testErrorMessageFormat(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 8: Error Message Format");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    const jobId = `job-${Date.now()}`;

    // Subscribe
    client.send(JSON.stringify({ type: "subscribe", jobId }));
    await waitForMessage(client);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Broadcast error message
    broadcastToJob(jobId, {
      type: "error",
      jobId,
      status: "failed",
      message: "Something went wrong",
    });

    const errorMsg = await waitForMessage(client);

    assert.equal(errorMsg.type, "error", "Type should be error");
    assert.equal(errorMsg.jobId, jobId, "JobId should match");
    assert.equal(errorMsg.status, "failed", "Status should be failed");
    assert.equal(
      errorMsg.message,
      "Something went wrong",
      "Message should match",
    );

    console.log("✅ Test 8 PASSED: Error messages properly formatted");

    client.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 8 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 9: Connection stats accurately track subscriptions
 */
async function testConnectionStats(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 9: Connection Stats");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);

    // Create clients for different jobs
    const client1 = await createTestClient(`ws://localhost:${port}/ws`);
    const client2 = await createTestClient(`ws://localhost:${port}/ws`);
    const client3 = await createTestClient(`ws://localhost:${port}/ws`);

    const job1 = `job-1-${Date.now()}`;
    const job2 = `job-2-${Date.now()}`;

    // Subscribe: 2 clients to job1, 1 client to job2
    client1.send(JSON.stringify({ type: "subscribe", jobId: job1 }));
    client2.send(JSON.stringify({ type: "subscribe", jobId: job1 }));
    client3.send(JSON.stringify({ type: "subscribe", jobId: job2 }));

    await waitForMessage(client1);
    await waitForMessage(client2);
    await waitForMessage(client3);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const stats = getConnectionStats();

    assert.equal(stats.totalJobs, 2, "Should have 2 jobs");
    assert.equal(stats.totalConnections, 3, "Should have 3 total connections");

    const job1Details = stats.jobDetails.find((j) => j.jobId === job1);
    const job2Details = stats.jobDetails.find((j) => j.jobId === job2);

    assert(job1Details, "Job 1 should exist in stats");
    assert(job2Details, "Job 2 should exist in stats");
    assert.equal(
      job1Details!.subscribers,
      2,
      "Job 1 should have 2 subscribers",
    );
    assert.equal(job2Details!.subscribers, 1, "Job 2 should have 1 subscriber");

    console.log("✅ Test 9 PASSED: Connection stats accurate");

    client1.close();
    client2.close();
    client3.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 9 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Test 10: Invalid messages are handled gracefully
 */
async function testInvalidMessageHandling(): Promise<boolean> {
  try {
    _resetWebSocketState();
    logger.info("Acceptance Test 10: Invalid Message Handling");

    const server = createTestServer();
    const port = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        resolve((address as any).port);
      });
    });

    initializeWebSocket(server);
    const client = await createTestClient(`ws://localhost:${port}/ws`);

    // Send invalid JSON
    client.send("not valid json at all {");

    // Should receive error response
    const errorResponse = await waitForMessage(client);

    assert.equal(errorResponse.type, "error", "Should receive error type");
    assert.equal(errorResponse.status, "failed", "Status should be failed");
    assert(errorResponse.message, "Should include error message");

    // Connection should still be open
    const jobId = `job-${Date.now()}`;
    client.send(JSON.stringify({ type: "subscribe", jobId }));
    const subscribeResponse = await waitForMessage(client);
    assert.equal(
      subscribeResponse.type,
      "subscribe",
      "Should still accept valid messages",
    );

    console.log("✅ Test 10 PASSED: Invalid messages handled gracefully");

    client.close();
    await shutdownWebSocket();
    server.close();
    return true;
  } catch (error) {
    console.log(
      "❌ Test 10 FAILED:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log(
    "\n========== Section 8: WebSocket Manager Acceptance Tests ==========\n",
  );

  const tests = [
    testWebSocketInitialization,
    testClientSubscription,
    testBroadcastMessage,
    testMultipleClientBroadcast,
    testClientUnsubscription,
    testUnsubscribedClientsExcluded,
    testDisconnectionHandling,
    testErrorMessageFormat,
    testConnectionStats,
    testInvalidMessageHandling,
  ];

  const results = [];
  for (const test of tests) {
    const result = await test();
    results.push(result);
    // Add delay between tests to allow cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;

  console.log(
    `\n========== Results: ${passed}/${tests.length} tests passed ==========\n`,
  );

  if (failed > 0) {
    console.log(`❌ ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log("🎉 All acceptance tests passed!");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("Test suite error:", error);
  process.exit(1);
});
