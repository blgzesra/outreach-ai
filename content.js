function getProfileData() {
  // Sayfa başlığından ismi al, bildirim sayılarını temizle
  // Örnek: "Elon Musk (23) | LinkedIn" → "Elon Musk"
  const rawTitle = document.title.split('|')[0].trim();
  const titleName = rawTitle.replace(/\(\d+\)/g, '').trim();
  
  const nameEl = 
    document.querySelector('h1.text-heading-xlarge') ||
    document.querySelector('h1') ||
    [...document.querySelectorAll('h1')].find(el => el.innerText.trim().length > 1);
  
  const nameFromDOM = nameEl?.innerText?.trim() || '';
  
  // DOM'dan gelen ismi de temizle
  const nameFromDOMClean = nameFromDOM.replace(/\(\d+\)/g, '').trim();
  
  // DOM boşsa başlığı kullan
  const name = (nameFromDOMClean.length > 1 ? nameFromDOMClean : titleName) || '';
  const firstName = name.split(' ')[0] || '';
  
  const title = document.querySelector('.text-body-medium.break-words')?.innerText?.trim() 
    || document.querySelector('.text-body-medium')?.innerText?.trim() || '';
  
  const company = document.querySelector('.pv-text-details__right-panel')?.innerText?.trim() || '';
  const about = document.querySelector('#about ~ div .full-width')?.innerText?.trim() || '';

  return { name, firstName, title, company, about };
}

function showModal(message) {
  document.getElementById('outreach-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'outreach-modal';
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; border-radius: 12px; padding: 24px; width: 420px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18); z-index: 99999; font-family: system-ui;
  `;
  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <strong style="font-size:15px;color:#0a66c2">OutreachAI</strong>
      <span id="outreach-close" style="cursor:pointer;font-size:20px;color:#888;line-height:1">&times;</span>
    </div>
    <textarea id="outreach-text" style="width:100%;height:130px;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:13px;resize:vertical;box-sizing:border-box;line-height:1.5"></textarea>
    <button id="outreach-copy" style="width:100%;margin-top:10px;padding:9px;background:#0a66c2;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
      Copy
    </button>
  `;
  // Model çıktısı ve hata mesajları HTML olarak değil, düz metin olarak eklenir (XSS önlemi)
  modal.querySelector('#outreach-text').value = message;
  document.body.appendChild(modal);
  document.getElementById('outreach-close').onclick = () => modal.remove();
  document.getElementById('outreach-copy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('outreach-text').value);
    document.getElementById('outreach-copy').textContent = 'Kopyalandı!';
    setTimeout(() => { document.getElementById('outreach-copy').textContent = 'Kopyala'; }, 2000);
  };
}

function showLoading() {
  showModal('Mesaj yazılıyor...');
  document.getElementById('outreach-text').disabled = true;
  document.getElementById('outreach-copy').disabled = true;
}

async function generateMessage() {
  const { name, firstName, title, company, about } = getProfileData();
  await new Promise(r => setTimeout(r, 300));
  showLoading();

  chrome.storage.local.get('anthropicKey', async (data) => {
    if (!data.anthropicKey) {
      showModal('Lütfen önce uzantı popup\'undan API key girin.');
      return;
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + data.anthropicKey,
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
- Start directly with the greeting: "Hi ${firstName}," (English)
- Maximum 3 sentences
- Reference their specific role or company
- Friendly and professional tone
- Match the language of their profile`
            }
          ]
        })
      });

      const result = await res.json();

      if (result.error) {
        showModal('API Hatası: ' + result.error.message);
        return;
      }

      showModal(result.choices[0].message.content);
    } catch (err) {
      showModal('Bağlantı hatası: ' + err.message);
    }
  });
}

function addButton() {
  if (document.getElementById('outreach-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'outreach-btn';
  btn.textContent = 'Write with AI';
  btn.style.cssText = `
    position: fixed; bottom: 80px; right: 24px;
    background: #0a66c2; color: white;
    padding: 11px 20px; border-radius: 24px;
    border: none; cursor: pointer; z-index: 9999;
    font-size: 14px; font-weight: 600;
    box-shadow: 0 4px 16px rgba(10,102,194,0.35);
    transition: background 0.15s;
  `;
  btn.onmouseenter = () => btn.style.background = '#004182';
  btn.onmouseleave = () => btn.style.background = '#0a66c2';
  btn.onclick = generateMessage;
  document.body.appendChild(btn);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addButton);
} else {
  addButton();
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    document.getElementById('outreach-btn')?.remove();
    setTimeout(addButton, 1500);
  }
}).observe(document, { subtree: true, childList: true });