const OPENAI_URL = 'https://api.openai.com/v1/responses';

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function cleanContext(value) {
  const text = JSON.stringify(value || {});
  return text.length > 24000 ? text.slice(0, 24000) : text;
}

async function openAI(env, body) {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${message.slice(0, 500)}`);
  }
  return response.json();
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  for (const item of response.output || []) {
    if (item.type !== 'message') continue;
    for (const part of item.content || []) {
      if (part.type === 'output_text' && part.text) return part.text;
    }
  }
  return '';
}

function parseDecision(text) {
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      answer: text || 'I could not create an answer.',
      needs_web: false,
      web_query: ''
    };
  }
}

export async function onRequestPost(context) {
  try {
    if (!context.env.OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY is not configured in Cloudflare.' }, 503);
    }

    const payload = await context.request.json();
    const question = String(payload.question || '').trim();
    if (!question) return json({ error: 'A question is required.' }, 400);

    const cabellaContext = cleanContext(payload.context);
    const model = context.env.OPENAI_MODEL || 'gpt-5-mini';

    const decision = await openAI(context.env, {
      model,
      instructions: `You are Ask CSE, the Cabella employee assistant. The browser has already searched Cabella's structured records first. Use the supplied Cabella context only when it directly supports the answer. Never invent Cabella-specific facts. If the supplied context does not answer the question, give practical general knowledge. Decide whether current web information is genuinely required. Return ONLY valid JSON with keys: answer (string), needs_web (boolean), web_query (string). Keep the answer direct and useful.`,
      input: `QUESTION:\n${question}\n\nRELEVANT CABELLA CONTEXT:\n${cabellaContext}`,
      max_output_tokens: 900
    });

    const first = parseDecision(outputText(decision));

    if (!first.needs_web) {
      return json({
        title: 'Ask CSE',
        answer: first.answer,
        source: 'industry',
        webQuery: ''
      });
    }

    const webQuery = String(first.web_query || question).trim();
    const webAnswer = await openAI(context.env, {
      model,
      tools: [{ type: 'web_search' }],
      instructions: `You are Ask CSE. Answer the employee's question using current web information. Be concise, practical, and distinguish outside information from Cabella policy. Do not invent Cabella-specific facts.`,
      input: `QUESTION:\n${question}\n\nSuggested search:\n${webQuery}`,
      max_output_tokens: 1100
    });

    return json({
      title: 'Ask CSE',
      answer: outputText(webAnswer),
      source: 'web',
      webQuery
    });
  } catch (error) {
    return json({ error: error.message || 'Ask CSE failed.' }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.' }, 405);
}
