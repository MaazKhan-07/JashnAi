/**
 * AI Chat Assistant View:
 * Natural language conversational assistant for event planning,
 * budget inquiries, rain contingencies, and timeline advice.
 */
import { getActiveEvent } from '../store.js';
import { escapeHtml, showToast } from '../utils.js';
import { apiPost } from '../api.js';

// In-memory chat history for the session
const sessionMessages = [
  {
    role: 'assistant',
    text: "Namaste & Welcome! 🎉 I'm your Jashn AI planning assistant. I can help you optimize budgets, suggest emergency backup plans, check milestone deadlines, or brainstorm creative celebration themes. How can I assist you today?",
    source: 'system'
  }
];

export function renderChat(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h3>No Event Selected</h3>
        <p>Please select or create an event to chat with the AI assistant.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section" style="max-width: 900px; margin: 0 auto;">
      <div style="margin-bottom: var(--sp-4);">
        <h1>💬 AI Celebration Assistant</h1>
        <p style="color: var(--clr-text-muted);">
          Context-aware planner for <strong>${escapeHtml(event.title)}</strong> (${event.guestCount} guests in ${escapeHtml(event.city)}).
        </p>
      </div>

      <!-- Quick Suggestion Prompt Chips -->
      <div style="display: flex; gap: var(--sp-2); flex-wrap: wrap; margin-bottom: var(--sp-4);">
        <button class="btn btn-secondary btn-sm prompt-chip" data-query="How is my budget looking right now?">
          📊 Budget Status
        </button>
        <button class="btn btn-secondary btn-sm prompt-chip" data-query="What are my next critical tasks?">
          📌 Next Critical Tasks
        </button>
        <button class="btn btn-secondary btn-sm prompt-chip" data-query="What is my current readiness score and risks?">
          🎯 Readiness Score
        </button>
        <button class="btn btn-secondary btn-sm prompt-chip" data-query="What is our rain and bad weather contingency plan?">
          🌧️ Rain Backup Plan
        </button>
        <button class="btn btn-secondary btn-sm prompt-chip" data-query="How do I handle last minute RSVP headcounts?">
          👥 RSVP Headcounts
        </button>
      </div>

      <!-- Chat Container -->
      <div class="chat-container">
        <div class="chat-messages" id="chat-messages-box">
          <!-- Messages rendered here -->
        </div>

        <form id="chat-form" class="chat-input-area">
          <input type="text" id="chat-input" class="form-input" 
            placeholder="Type your event question (e.g., 'Suggest icebreakers for 40 guests')..." 
            autocomplete="off" required>
          <button type="submit" class="btn btn-primary" id="chat-send-btn">
            Send 🚀
          </button>
        </form>
      </div>
    </div>
  `;

  const messagesBox = container.querySelector('#chat-messages-box');
  const chatForm = container.querySelector('#chat-form');
  const chatInput = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send-btn');

  function renderMessages() {
    messagesBox.innerHTML = sessionMessages.map(m => {
      const isUser = m.role === 'user';
      return `
        <div class="chat-message ${isUser ? 'user' : 'assistant'}">
          <div style="font-size: var(--fs-xs); opacity: 0.8; margin-bottom: 2px;">
            ${isUser ? '👤 You' : (m.source === 'gemini' ? '✨ Gemini AI' : '⚡ Jashn AI')}
          </div>
          <div>${escapeHtml(m.text)}</div>
        </div>
      `;
    }).join('');
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  renderMessages();

  async function handleSend(userQuery) {
    if (!userQuery) return;
    
    // Add user message
    sessionMessages.push({ role: 'user', text: userQuery });
    renderMessages();
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Temporary placeholder
    const typingPlaceholder = {
      role: 'assistant',
      text: 'Thinking...',
      source: 'pending'
    };
    sessionMessages.push(typingPlaceholder);
    renderMessages();

    try {
      // Build lightweight context
      const eventContext = {
        title: event.title,
        eventType: event.type,
        date: event.date,
        guestCount: event.guestCount,
        city: event.city,
        totalBudget: event.totalBudget,
        currency: event.currency,
        tasks: (event.tasks || []).map(t => ({ title: t.title, status: t.status, urgency: t.urgency, dueDate: t.dueDate })),
        budget: event.budget,
        vendors: (event.vendors || []).map(v => ({ name: v.name, category: v.category, status: v.status, quote: v.quote }))
      };

      const res = await apiPost('/api/ai/chat', {
        message: userQuery,
        eventContext
      });

      // Remove typing placeholder
      sessionMessages.pop();

      // Add response
      sessionMessages.push({
        role: 'assistant',
        text: res.reply || 'I could not generate a response at this time.',
        source: res.source || 'offline'
      });
    } catch (err) {
      sessionMessages.pop();
      sessionMessages.push({
        role: 'assistant',
        text: `Error connecting to assistant: ${err.message}`,
        source: 'error'
      });
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      renderMessages();
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (query) handleSend(query);
  });

  // Prompt chip quick clicks
  container.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      handleSend(q);
    });
  });
}
