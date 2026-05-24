import { NextRequest } from "next/server";

function getBackendBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:4000"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const backendUrl = `${getBackendBaseUrl()}/api/assessment/download/${params.jobId}${request.nextUrl.search}`;
  const response = await fetch(backendUrl);

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
