document.getElementById('save').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
if (!key.startsWith('gsk_')) {
  document.getElementById('status').style.color = 'red';
  document.getElementById('status').textContent = 'Geçersiz key formatı';
  return;
}

  chrome.storage.local.set({ groqKey: key }, () => {
    chrome.storage.local.remove('anthropicKey');
    document.getElementById('status').style.color = 'green';
    document.getElementById('status').textContent = 'Kaydedildi!';
  });
});

// Eski sürüm anahtarı 'anthropicKey' adıyla kaydediyordu; varsa 'groqKey'e taşı
chrome.storage.local.get(['groqKey', 'anthropicKey'], (data) => {
  const key = data.groqKey || data.anthropicKey;
  if (!data.groqKey && data.anthropicKey) {
    chrome.storage.local.set({ groqKey: data.anthropicKey }, () => {
      chrome.storage.local.remove('anthropicKey');
    });
  }
  if (key) {
    document.getElementById('apiKey').value = key;
  }
});
