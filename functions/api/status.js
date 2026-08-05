export async function onRequestGet(context) {
  return Response.json({
    openai: Boolean(context.env.OPENAI_API_KEY),
    model: context.env.OPENAI_MODEL || 'gpt-5-mini',
    online: true
  }, { headers: { 'Cache-Control': 'no-store' } });
}
