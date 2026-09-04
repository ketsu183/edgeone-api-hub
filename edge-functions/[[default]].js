export default async function onRequest(context) {
  return new Response(JSON.stringify({
    ok: true,
    message: "edge function working",
    path: new URL(context.request.url).pathname
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
