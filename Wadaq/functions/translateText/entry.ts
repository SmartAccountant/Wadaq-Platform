import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    const user = await Wadaq.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, from_lang, to_lang } = await req.json();

    if (!text || !from_lang || !to_lang) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use AI to translate the text
    const translation = await Wadaq.integrations.Core.InvokeLLM({
      prompt: `Translate the following ${from_lang} text to ${to_lang}. Return ONLY the translation, nothing else:\n\n${text}`,
    });

    return Response.json({ 
      translation: translation.trim(),
      original: text
    });

  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});