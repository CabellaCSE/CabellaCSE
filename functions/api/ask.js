const OPENAI_URL = "https://api.openai.com/v1/responses";

function sendJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function getAnswer(data) {
  if (data.output_text) return data.output_text;

  for (const item of data.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) {
        return part.text;
      }
    }
  }

  return "I could not create an answer.";
}

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.OPENAI_API_KEY;

    if (!apiKey) {
      return sendJson(
        { error: "OPENAI_API_KEY is not available to this deployment." },
        503
      );
    }

    const body = await context.request.json();
    const question = String(body.question || "").trim();

    if (!question) {
      return sendJson({ error: "Please enter a question." }, 400);
    }

    const cabellaContext = JSON.stringify(body.context || {}).slice(0, 24000);

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions:
          "You are Ask CSE, Cabella's employee assistant. First use the supplied Cabella information when it directly answers the question. Never invent Cabella-specific facts. When the Cabella information does not answer the question, provide a clear and practical general-knowledge answer. Keep answers concise.",
        input:
          `Employee question:\n${question}\n\n` +
          `Cabella information found by the portal:\n${cabellaContext}`,
        max_output_tokens: 1000
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return sendJson(
        {
          error: `OpenAI returned error ${response.status}.`,
          details: text.slice(0, 500)
        },
        response.status
      );
    }

    const data = JSON.parse(text);

    return sendJson({
      title: "Ask CSE",
      answer: getAnswer(data),
      source: "ai",
      webQuery: ""
    });
  } catch (error) {
    return sendJson(
      {
        error: error?.message || "Ask CSE encountered an unexpected error."
      },
      500
    );
  }
}

export async function onRequestGet(context) {
  return sendJson({
    connected: Boolean(context.env.OPENAI_API_KEY),
    service: "Ask CSE"
  });
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }

  if (context.request.method === "GET") {
    return onRequestGet(context);
  }

  return sendJson({ error: "Method not allowed." }, 405);
}
