let hasStarted = false;

function getFaqs() { return window.EsnaaData.getContent().faqs; }
function getSocial() { return window.EsnaaData.getContent().social || []; }
function getCopy() { return window.EsnaaData.getContent().copy; }
function getStarterTopics() { return getFaqs().slice(0, 5); }

function normalise(value) {
  return value.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim();
}

// Picks the entry whose keywords best match the message, instead of just the
// first one that matches at all. Scores by total matched-keyword length so a
// specific phrase (e.g. "لوجو") outweighs a generic single word that many
// topics share (e.g. "موقع"), and more specific questions win over vaguer ones.
function bestMatch(entries, text) {
  let best = null;
  let bestScore = 0;
  entries.forEach((entry) => {
    const score = entry.keywords.reduce((sum, keyword) => {
      const normalisedKeyword = normalise(keyword);
      return text.includes(normalisedKeyword) ? sum + normalisedKeyword.length : sum;
    }, 0);
    if (score > bestScore) { best = entry; bestScore = score; }
  });
  return best;
}

function responseFor(question) {
  const text = normalise(question);
  const social = bestMatch(getSocial(), text);
  const faq = bestMatch(getFaqs(), text);
  return faq?.answer || social?.answer || getCopy().chatFallback;
}

function getThread() { return document.getElementById('chatThread'); }
function scrollToLatest() { const body = document.getElementById('faqBody'); body.scrollTop = body.scrollHeight; }

function addMessage(kind, text) {
  const message = document.createElement('div');
  message.className = `chat-message ${kind}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  message.appendChild(bubble);
  getThread().appendChild(message);
  scrollToLatest();
}

function addQuickReplies() {
  const list = document.createElement('div');
  list.className = 'chat-quick-list';
  getStarterTopics().forEach((faq) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-topic-button';
    button.textContent = faq.question;
    button.addEventListener('click', () => sendQuestion(faq.question));
    list.appendChild(button);
  });
  getThread().appendChild(list);
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'chat-message bot chat-typing-message';
  typing.setAttribute('aria-label', getCopy().chatTyping);
  typing.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
  getThread().appendChild(typing);
  scrollToLatest();
  return typing;
}

function startConversation() {
  if (hasStarted) return;
  hasStarted = true;
  addMessage('bot', getCopy().chatWelcome);
  addQuickReplies();
}

function sendQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  startConversation();
  addMessage('user', cleanQuestion);
  const typing = showTyping();
  window.setTimeout(() => { typing.remove(); addMessage('bot', responseFor(cleanQuestion)); }, 420);
}

function openChat() {
  const panel = document.getElementById('faqPanel');
  const fab = document.getElementById('faqFab');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  fab.classList.add('open');
  fab.setAttribute('aria-expanded', 'true');
  startConversation();
  window.setTimeout(() => document.getElementById('chatInput').focus(), 100);
}

function closeChat() {
  const panel = document.getElementById('faqPanel');
  const fab = document.getElementById('faqFab');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  fab.classList.remove('open');
  fab.setAttribute('aria-expanded', 'false');
}

function renderLandingTopics() {
  const topicList = document.getElementById('chatTopics');
  topicList.innerHTML = '';
  getStarterTopics().forEach((faq) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-topic-button';
    button.textContent = faq.question;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openChat();
      sendQuestion(faq.question);
    });
    topicList.appendChild(button);
  });
}

function resetChatForLanguage() {
  hasStarted = false;
  getThread().innerHTML = '';
  renderLandingTopics();
  if (document.getElementById('faqPanel').classList.contains('open')) startConversation();
}

function initFaqChat() {
  const fab = document.getElementById('faqFab');
  const panel = document.getElementById('faqPanel');
  const composer = document.getElementById('chatComposer');
  fab.addEventListener('click', (event) => {
    event.stopPropagation();
    panel.classList.contains('open') ? closeChat() : openChat();
  });
  document.querySelectorAll('[data-open-chat]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openChat();
  }));
  panel.addEventListener('click', (event) => event.stopPropagation());
  document.getElementById('faqFootLink').addEventListener('click', closeChat);
  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    sendQuestion(input.value);
    input.value = '';
  });
  renderLandingTopics();
}

window.EsnaaChat = { closeChat, initFaqChat, openChat, resetChatForLanguage };
