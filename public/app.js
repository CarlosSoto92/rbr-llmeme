// public/app.js
// FRONTEND RULE: The bot component only knows how to render Images and Emojis.
// No renderText function exists for bot responses.

const chatViewport = document.getElementById('chatViewport');
const messagesList = document.getElementById('messagesList');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const quickPrompts = document.getElementById('quickPrompts');

const FALLBACK_EMOJI = '🤯';

// Utility to auto-scroll viewport
function scrollToBottom() {
  chatViewport.scrollTop = chatViewport.scrollHeight;
}

// User Message Renderer (User is allowed to have text)
function renderUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar user-avatar';
  avatar.textContent = '🧑‍💻';

  const bubble = document.createElement('div');
  bubble.className = 'bubble user-bubble';
  bubble.textContent = text;

  row.appendChild(bubble);
  row.appendChild(avatar);
  messagesList.appendChild(row);
  scrollToBottom();
}

// Visual Loading Indicator (Strictly visual - NO TEXT)
function createVisualLoader() {
  const row = document.createElement('div');
  row.className = 'message-row bot-row loader-row';
  row.id = 'activeLoader';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot-avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot-bubble';

  const loader = document.createElement('div');
  loader.className = 'visual-loader';
  loader.innerHTML = `
    <div class="loader-meme-icon">🎭</div>
    <div class="loader-dots">
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
    </div>
  `;

  bubble.appendChild(loader);
  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesList.appendChild(row);
  scrollToBottom();
}

function removeVisualLoader() {
  const loader = document.getElementById('activeLoader');
  if (loader) {
    loader.remove();
  }
}

// BOT RENDERER 1: ONLY IMAGES
function renderBotImage(imageUrl) {
  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot-avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot-bubble';

  const container = document.createElement('div');
  container.className = 'meme-image-container';

  const img = document.createElement('img');
  img.className = 'meme-img';
  img.alt = 'Meme Response';
  img.loading = 'eager';

  // Fail-safe: If image fails to load, fallback to emoji immediately without text
  img.onerror = () => {
    container.innerHTML = '';
    renderBotEmojiInContainer(container, FALLBACK_EMOJI);
  };

  img.onload = () => {
    scrollToBottom();
  };

  img.src = imageUrl;
  container.appendChild(img);
  bubble.appendChild(container);
  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesList.appendChild(row);
  scrollToBottom();
}

// BOT RENDERER 2: ONLY EMOJIS
function renderBotEmoji(emojiChar) {
  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar bot-avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot-bubble';

  const container = document.createElement('div');
  renderBotEmojiInContainer(container, emojiChar || FALLBACK_EMOJI);

  bubble.appendChild(container);
  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesList.appendChild(row);
  scrollToBottom();
}

function renderBotEmojiInContainer(container, emojiChar) {
  const emojiDiv = document.createElement('div');
  emojiDiv.className = 'emoji-response';
  emojiDiv.textContent = emojiChar || FALLBACK_EMOJI;
  container.appendChild(emojiDiv);
}

// Main Send Pipeline
async function handleSend(message) {
  const cleanMessage = (message || '').trim();
  if (!cleanMessage) return;

  // 1. Render user message
  renderUserMessage(cleanMessage);
  userInput.value = '';
  sendBtn.disabled = true;
  userInput.disabled = true;

  // 2. Show visual loader
  createVisualLoader();

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: cleanMessage })
    });

    removeVisualLoader();

    if (!res.ok) {
      // Backend error -> Fallback emoji (NO ERROR TEXT)
      renderBotEmoji(FALLBACK_EMOJI);
      return;
    }

    const data = await res.json();

    // 3. Dispatch to strictly visual renderer
    if (data && data.type === 'image' && data.url) {
      renderBotImage(data.url);
    } else if (data && data.type === 'emoji') {
      renderBotEmoji(data.emoji);
    } else {
      // Any malformed/unexpected payload -> Fallback emoji
      renderBotEmoji(FALLBACK_EMOJI);
    }
  } catch (networkError) {
    removeVisualLoader();
    // Network/fetch error -> Fallback emoji (NO ERROR TEXT)
    renderBotEmoji(FALLBACK_EMOJI);
  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// Event Listeners
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSend(userInput.value);
});

// Quick Prompt Chips for instant testing
quickPrompts.addEventListener('click', (e) => {
  const chip = e.target.closest('.prompt-chip');
  if (chip && chip.dataset.prompt) {
    handleSend(chip.dataset.prompt);
  }
});

// Focus on load
userInput.focus();
