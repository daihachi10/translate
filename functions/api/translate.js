export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const { apiKey, text, targetLang, sourceLang, isPro } = body;

    // Validate parameters
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "DeepL APIキーが設定されていません。" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (!text) {
      return new Response(JSON.stringify({ error: "翻訳するテキストが空です。" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (!targetLang) {
      return new Response(JSON.stringify({ error: "翻訳先言語が指定されていません。" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // Determine DeepL endpoint based on Free/Pro selection
    const endpoint = isPro
      ? "https://api.deepl.com/v2/translate"
      : "https://api-free.deepl.com/v2/translate";

    // Setup request body for DeepL
    const deepLBody = {
      text: [text],
      target_lang: targetLang.toUpperCase()
    };

    // If source language is specified (not auto-detect)
    if (sourceLang && sourceLang !== "auto") {
      deepLBody.source_lang = sourceLang.toUpperCase();
    }

    // Call DeepL API
    const deepLResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(deepLBody)
    });

    // Handle non-OK response from DeepL
    if (!deepLResponse.ok) {
      let errorMessage = `DeepL APIエラーが発生しました (Status: ${deepLResponse.status})`;
      try {
        const errorData = await deepLResponse.json();
        if (errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }
      } catch (e) {
        // Fallback to reading raw text if JSON parsing fails
        const errorText = await deepLResponse.text();
        if (errorText) errorMessage += `: ${errorText}`;
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: deepLResponse.status,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // Return the translation data to the client
    const responseData = await deepLResponse.json();
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: `プロキシサーバーエラー: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
