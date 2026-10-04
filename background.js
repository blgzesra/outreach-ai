// Groq API isteği burada (service worker) yapılır; API anahtarı LinkedIn sayfasına hiç gönderilmez.

// Groq modelleri dönemsel olarak kaldırır: https://console.groq.com/docs/deprecations
const MODEL = 'openai/gpt-oss-120b';

const API_ERROR = 'The AI service returned an error. Please try again later.';
const NETWORK_ERROR = 'Could not reach the AI service. Check your connection and try again.';

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['groqKey', 'anthropicKey'], (data) => {
      // Eski sürüm anahtarı 'anthropicKey' adıyla kaydediyordu; varsa 'groqKey'e taşı
      if (!data.groqKey && data.anthropicKey) {
        chrome.storage.local.set({ groqKey: data.anthropicKey }, () => {
          chrome.storage.local.remove('anthropicKey');
        });
      }
      resolve(data.groqKey || data.anthropicKey);
    });
  });
}

async function generateMessage({ name, firstName, title, company, about }) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return { error: 'Lütfen önce uzantı popup\'undan API key girin.' };
  }

  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        // gpt-oss bir reasoning modeli; düşünme payı da üretim limitinden yiyebilir.
        // 'low' gpt-oss için izin verilen en düşük seviye (reasoning tamamen kapatılamıyor).
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: 'You write LinkedIn connection request messages. Output ONLY the message text itself — no explanations, no preamble, no meta-commentary, no quotation marks around the message. Just the message.'
          },
          {
            role: 'user',
            content: `Write a short, personalized LinkedIn connection request for this person:
Name: ${name}
First name: ${firstName}
Position: ${title}
Company: ${company}
About: ${about}

Requirements:
- Write the entire message in the language of their profile
- Start directly with a greeting to ${firstName} in that same language (e.g. "Hi ${firstName}," for English)
- Maximum 3 sentences
- Reference their specific role or company
- Friendly and professional tone`
          }
        ]
      })
    });
  } catch (err) {
    console.error('[OutreachAI] Network error:', err);
    return { error: NETWORK_ERROR };
  }

  // Ham hata yalnızca service worker konsoluna yazılır; arayüzde kısa mesaj gösterilir
  let result;
  try {
    result = await res.json();
  } catch (err) {
    console.error('[OutreachAI] Invalid JSON from Groq:', res.status, err);
    return { error: API_ERROR };
  }

  if (!res.ok || result.error) {
    console.error('[OutreachAI] Groq API error:', res.status, result.error || result);
    return { error: API_ERROR };
  }

  const choice = result.choices?.[0];
  const content = choice?.message?.content?.trim();
  if (!content) {
    console.error('[OutreachAI] Empty response from Groq:', result);
    if (choice?.finish_reason === 'length') {
      return { error: 'The model ran out of tokens before answering. Try again.' };
    }
    return { error: API_ERROR };
  }

  return { message: content };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'generate') return;
  generateMessage(request.profile).then(sendResponse);
  return true; // sendResponse asenkron çağrılacak
});
