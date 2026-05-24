import { mediaProxyUrlForPath } from "@/lib/mediaProxy";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(request.url);
  const target = mediaProxyUrlForPath(`/api/media/${path.join("/")}`, url.search);
  const upstream = await fetch(target, { cache: "no-store" });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "cache-control": upstream.headers.get("cache-control") || "public, max-age=300"
    }
  });
}
