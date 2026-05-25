"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Zap, Clock, CheckCircle2, RotateCw } from "lucide-react";
import { AssignmentResponse } from "@/types";
import { getApiUrl, getWsUrl } from "@/lib/api-config";

interface JobStatusProps {
  jobId: string;
  onStatusChange?: (status: AssignmentResponse) => void;
  onComplete?: (result: AssignmentResponse) => void;
}

export default function JobStatus({
  jobId,
  onStatusChange,
  onComplete,
}: JobStatusProps) {
  const [status, setStatus] = useState<AssignmentResponse | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${getApiUrl()}/api/assessment/status/${jobId}`,
        );
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data);
        onStatusChange?.(data);
        setLoading(false);

        if (data.status === "done") {
          onComplete?.(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load status");
        setLoading(false);
      }
    };

    fetchStatus();
  }, [jobId, onStatusChange, onComplete]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = `${getWsUrl()}/ws?jobId=${jobId}`;
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log("WebSocket connected");
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("WebSocket message:", message);

            if (message.type === "progress" && message.data) {
              setStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      progress: message.data.progress || prev.progress,
                      status: message.data.status || prev.status,
                    }
                  : null,
              );
            } else if (message.type === "completed" && message.data?.result) {
              const result = {
                ...status,
                status: "done",
                result: message.data.result,
                downloadUrl: `/api/assessment/download/${jobId}`,
              } as AssignmentResponse;
              setStatus(result);
              onComplete?.(result);
            } else if (message.type === "error") {
              setStatus((prev) =>
                prev
                  ? { ...prev, status: "failed", error: message.data?.error }
                  : null,
              );
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        websocket.onerror = () => {
          setError("WebSocket connection error");
        };

        websocket.onclose = () => {
          console.log("WebSocket disconnected");
        };

        setWs(websocket);
      } catch (err) {
        console.error("Failed to connect WebSocket:", err);
      }
    };

    connectWebSocket();

    return () => {
      ws?.close();
    };
  }, [jobId]);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 animate-pulse">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-100 rounded-lg" />
          <div className="h-3 bg-gray-100 rounded-lg w-4/5" />
          <div className="h-2 bg-gray-100 rounded-full mt-4" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-red-800 font-medium">
          {error || "Failed to load assessment"}
        </p>
      </div>
    );
  }

  const statusConfig = {
    queued: { color: "gray", label: "In Queue", icon: Clock },
    parsing: { color: "blue", label: "Parsing", icon: Clock },
    cached: { color: "green", label: "From Cache", icon: Zap },
    generating: { color: "purple", label: "Generating", icon: Clock },
    rendering: { color: "orange", label: "Rendering", icon: Clock },
    done: { color: "green", label: "Complete", icon: CheckCircle2 },
    failed: { color: "red", label: "Failed", icon: AlertCircle },
  };

  const config = statusConfig[status.status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse`}
              style={{
                backgroundColor:
                  config.color === "gray"
                    ? "#e5e7eb"
                    : config.color === "blue"
                      ? "#eff6ff"
                      : config.color === "green"
                        ? "#f0fdf4"
                        : config.color === "purple"
                          ? "#f3e8ff"
                          : config.color === "orange"
                            ? "#fffbeb"
                            : "#fef2f2",
              }}
            >
              <StatusIcon
                className="w-8 h-8"
                style={{
                  color:
                    config.color === "gray"
                      ? "#6b7280"
                      : config.color === "blue"
                        ? "#0284c7"
                        : config.color === "green"
                          ? "#16a34a"
                          : config.color === "purple"
                            ? "#9333ea"
                            : config.color === "orange"
                              ? "#f97316"
                              : "#dc2626",
                }}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {config.label}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold`}
                style={{
                  backgroundColor:
                    config.color === "gray"
                      ? "#f3f4f6"
                      : config.color === "blue"
                        ? "#dbeafe"
                        : config.color === "green"
                          ? "#dcfce7"
                          : config.color === "purple"
                            ? "#f3e8ff"
                            : config.color === "orange"
                              ? "#fef3c7"
                              : "#fee2e2",
                  color:
                    config.color === "gray"
                      ? "#374151"
                      : config.color === "blue"
                        ? "#0284c7"
                        : config.color === "green"
                          ? "#16a34a"
                          : config.color === "purple"
                            ? "#9333ea"
                            : config.color === "orange"
                              ? "#f97316"
                              : "#dc2626",
                }}
              >
                {status.status}
              </span>
            </div>
            <p className="text-gray-600">
              Time elapsed: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {status.status !== "done" && status.status !== "failed" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-sm font-semibold text-gray-900">
                {status.progress}%
              </p>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        {status.metadata && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium text-gray-900">
                {status.metadata.modelUsed ||
                  status.metadata.model ||
                  "Standard"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Attempts:</span>
              <span className="font-medium text-gray-900">
                {status.metadata.attempts || 1}
              </span>
            </div>
            {status.metadata.cacheHit && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">⚡ Served from cache</span>
                {status.metadata.cacheSimilarity !== undefined && (
                  <span className="font-medium text-green-600">
                    {(status.metadata.cacheSimilarity * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {status.status === "failed" && status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-800 text-sm">{status.error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {status.status === "done" && (
        <div className="flex gap-4">
          <a
            href={
              status.downloadUrl ||
              `${getApiUrl()}/api/assessment/download/${jobId}`
            }
            download
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition text-center"
          >
            Download PDF
          </a>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 rounded-lg transition"
          >
            Create New
          </button>
        </div>
      )}

      {status.status === "failed" && (
        <div className="flex gap-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <RotateCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      )}

      {status.status !== "done" && status.status !== "failed" && (
        <div className="text-center text-gray-600 text-sm">
          <div className="flex items-center justify-center gap-2 text-gray-500 animate-pulse">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
            <span className="ml-2">Processing your assessment...</span>
          </div>
        </div>
      )}
    </div>
  );
}
