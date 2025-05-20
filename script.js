const methodSelect = document.getElementById('method');
const urlInput = document.getElementById('url');
const bodyInput = document.getElementById('body');
const sendButton = document.getElementById('send');
const statusBox = document.getElementById('status');
const responseBox = document.getElementById('response');
const historyList = document.getElementById('history');
const copyBtn = document.getElementById('copyResponse');
const themeSwitcher = document.getElementById('themeSwitcher');
const headersDiv = document.getElementById('headers');
const addHeaderBtn = document.getElementById('addHeader');
const responseSection = document.querySelector('.response-box');

function toggleResponseVisibility() {
  if (!responseBox.textContent || responseBox.textContent.trim() === '') {
    responseSection.style.display = 'none';
  } else {
    responseSection.style.display = 'block';
  }
}

toggleResponseVisibility();

function toggleBodyField() {
  const method = methodSelect.value;
  bodyInput.style.display = (method === 'GET' || method === 'DELETE') ? 'none' : 'block';
}
toggleBodyField();
methodSelect.addEventListener('change', toggleBodyField);

function createHeaderPair(key = '', value = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'header-pair';

  const keyInput = document.createElement('input');
  keyInput.className = 'header-key';
  keyInput.placeholder = 'Header-Key';
  keyInput.value = key;

  const valueInput = document.createElement('input');
  valueInput.className = 'header-value';
  valueInput.placeholder = 'Header-Value';
  valueInput.value = value;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-header';
  removeBtn.textContent = '✕';
  removeBtn.onclick = () => wrapper.remove();

  wrapper.appendChild(keyInput);
  wrapper.appendChild(valueInput);
  wrapper.appendChild(removeBtn);
  headersDiv.appendChild(wrapper);
}

addHeaderBtn.addEventListener('click', () => createHeaderPair());

copyBtn.addEventListener('click', () => {
  const content = responseBox.textContent.trim();
  if (!content) {
    alert("Nada para copiar.");
    return;
  }
  navigator.clipboard.writeText(content).then(() => {
    copyBtn.textContent = "Copiado!";
    setTimeout(() => copyBtn.textContent = "Copiar Resposta", 2000);
  });
});

// themeSwitcher.addEventListener('change', () => {
//   document.body.classList.toggle('dark');
//   document.body.classList.toggle('light');
//   localStorage.setItem('theme', document.body.className);
// });

const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.body.className = savedTheme;

function loadHistory() {
  historyList.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('history') || '[]');
  history.reverse().forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.method} ${item.url}`;
    li.addEventListener('click', () => {
      methodSelect.value = item.method;
      urlInput.value = item.url;
      bodyInput.value = item.body;
    });
    historyList.appendChild(li);
  });
}
loadHistory();

sendButton.addEventListener('click', async () => {
  const method = methodSelect.value;
  const url = urlInput.value.trim();
  const bodyRaw = bodyInput.value.trim();

  if (!url) return alert("Informe a URL!");

  let headers = {};
  document.querySelectorAll('.header-pair').forEach(pair => {
    const key = pair.querySelector('.header-key').value.trim();
    const value = pair.querySelector('.header-value').value.trim();
    if (key) headers[key] = value;
  });

  const options = { method, headers };
  if (method !== 'GET' && method !== 'DELETE' && bodyRaw) {
    try {
      options.body = JSON.stringify(JSON.parse(bodyRaw));
    } catch {
      return alert("JSON inválido!");
    }
  }

  const start = performance.now();
  try {
    const res = await fetch(url, options);
    const elapsed = (performance.now() - start).toFixed(2);
    const contentType = res.headers.get('content-type') || '';
    let responseText;

    if (contentType.includes('application/json')) {
      responseText = JSON.stringify(await res.json(), null, 2);
    } else {
      responseText = await res.text();
    }

    statusBox.textContent = `Status: ${res.status} (${elapsed}ms)`;

    if (responseText === null || responseText.trim() === '') {
      responseBox.style.display = 'none';
    } else {
      responseBox.style.display = 'block';
      responseBox.textContent = responseText;
    }

    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.push({ method, url, body: bodyRaw });
    localStorage.setItem('history', JSON.stringify(history.slice(-20)));
    loadHistory();

    toggleResponseVisibility();

  } catch (err) {
    statusBox.textContent = "Erro";
    responseBox.style.display = 'block';
    responseBox.textContent = err.message;
  }
});
