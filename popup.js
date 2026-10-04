document.getElementById('save').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
if (!key.startsWith('gsk_')) {
  document.getElementById('status').style.color = 'red';
  document.getElementById('status').textContent = 'Geçersiz key formatı';
  return;
}

  chrome.storage.local.set({ anthropicKey: key }, () => {
    document.getElementById('status').style.color = 'green';
    document.getElementById('status').textContent = 'Kaydedildi!';
  });
});

chrome.storage.local.get('anthropicKey', (data) => {
  if (data.anthropicKey) {
    document.getElementById('apiKey').value = data.anthropicKey;
  }
});