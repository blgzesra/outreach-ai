// Groq API isteği burada (service worker) yapılır; API anahtarı LinkedIn sayfasına hiç gönderilmez.

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

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
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

    const result = await res.json();

    if (result.error) {
      return { error: 'API Hatası: ' + result.error.message };
    }

    return { message: result.choices[0].message.content };
  } catch (err) {
    return { error: 'Bağlantı hatası: ' + err.message };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'generate') return;
  generateMessage(request.profile).then(sendResponse);
  return true; // sendResponse asenkron çağrılacak
});
