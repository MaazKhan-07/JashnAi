/**
 * AI Ideas & Concepts View:
 * Personalized themes, decor highlights, curated dietary-tailored menus,
 * entertainment, and run-of-show schedule.
 */
import { getActiveEvent, updateActiveEvent } from '../store.js';
import { escapeHtml, showToast, showLoading } from '../utils.js';
import { apiPost } from '../api.js';

export function renderIdeas(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💡</div>
        <h3>No Event Selected</h3>
        <p>Please select or create an event to explore AI-personalized ideas.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  const ideas = event.ideas || {
    source: 'offline',
    themeSuggestions: [],
    decorHighlights: [],
    menuSuggestions: [],
    entertainment: [],
    runOfShow: []
  };

  const isGemini = ideas.source === 'gemini';

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4); flex-wrap: wrap; gap: var(--sp-3);">
        <div>
          <div style="display: flex; align-items: center; gap: var(--sp-2);">
            <h1>💡 AI Celebration Ideas</h1>
            <span class="source-label ${isGemini ? 'source-gemini' : 'source-offline'}">
              ${isGemini ? '✨ Powered by Gemini AI' : '⚡ Offline Intelligence Engine'}
            </span>
          </div>
          <p style="color: var(--clr-text-muted);">
            Personalized concepts for <strong>${escapeHtml(event.title)}</strong> (${event.guestCount} guests in ${escapeHtml(event.city)}).
          </p>
        </div>
        <div>
          <button id="regen-ideas-btn" class="btn btn-primary btn-sm">
            ✨ Regenerate Ideas with AI
          </button>
        </div>
      </div>

      <!-- Dietary preferences banner -->
      <div class="card card-sm" style="margin-bottom: var(--sp-6); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--sp-3);">
        <div style="display: flex; align-items: center; gap: var(--sp-2);">
          <strong>Active Dietary Filters:</strong>
          ${(event.dietary && event.dietary.length) 
            ? event.dietary.map(d => `<span class="badge badge-success">🥗 ${escapeHtml(d)}</span>`).join(' ')
            : '<span class="badge badge-muted">Standard</span>'}
        </div>
        <div style="font-size: var(--fs-xs); color: var(--clr-text-muted);">
          Menus and catering suggestions automatically comply with selected restrictions.
        </div>
      </div>

      <!-- 2-Column Layout -->
      <div class="grid grid-cols-2" style="align-items: start;">
        
        <!-- Left: Themes & Decor -->
        <div style="display: flex; flex-direction: column; gap: var(--sp-6);">
          <!-- Themes -->
          <div class="card">
            <h3 class="card-title">🎨 Theme & Aesthetic Concepts</h3>
            <div style="margin-top: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3);">
              ${(ideas.themeSuggestions || []).length === 0 ? '<p class="text-muted">No theme suggestions.</p>' : ''}
              ${(ideas.themeSuggestions || []).map(t => `
                <div style="padding: var(--sp-3); background: var(--clr-surface-alt); border-radius: var(--radius-md); border-left: 3px solid var(--clr-primary);">
                  <h4 style="font-size: var(--fs-base); font-weight: var(--fw-semibold); color: var(--clr-primary);">
                    ${escapeHtml(t.name)}
                  </h4>
                  <p style="font-size: var(--fs-sm); color: var(--clr-text-muted); margin-top: var(--sp-1);">
                    ${escapeHtml(t.description)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Decor Highlights -->
          <div class="card">
            <h3 class="card-title">🌸 Decor & Ambience Highlights</h3>
            <ul style="margin-top: var(--sp-3); padding-left: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-2); font-size: var(--fs-sm);">
              ${(ideas.decorHighlights || []).map(d => `
                <li style="line-height: 1.5;">${escapeHtml(d)}</li>
              `).join('')}
            </ul>
          </div>

          <!-- Entertainment & Activities -->
          <div class="card">
            <h3 class="card-title">🎵 Entertainment & Guest Engagement</h3>
            <ul style="margin-top: var(--sp-3); padding-left: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-2); font-size: var(--fs-sm);">
              ${(ideas.entertainment || []).map(e => `
                <li style="line-height: 1.5;">${escapeHtml(e)}</li>
              `).join('')}
            </ul>
          </div>
        </div>

        <!-- Right: Curated Menu & Run of Show -->
        <div style="display: flex; flex-direction: column; gap: var(--sp-6);">
          <!-- Curated Menu -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🍽️ Curated Multi-Course Menu</h3>
              <span class="badge badge-success">Dietary Compliant</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--sp-3);">
              ${(ideas.menuSuggestions || []).map(m => `
                <div style="padding: var(--sp-3); background: var(--clr-surface-alt); border-radius: var(--radius-md);">
                  <div style="font-size: var(--fs-xs); font-weight: var(--fw-bold); text-transform: uppercase; color: var(--clr-primary); letter-spacing: 0.5px;">
                    ${escapeHtml(m.course)}
                  </div>
                  <div style="font-size: var(--fs-sm); font-weight: var(--fw-medium); margin-top: var(--sp-1); color: var(--clr-text);">
                    ${escapeHtml(m.item)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Day-of Run of Show / Itinerary -->
          <div class="card">
            <h3 class="card-title">⏱️ Day-of Run-of-Show Schedule</h3>
            <div style="margin-top: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2);">
              ${(ideas.runOfShow || []).map(item => `
                <div style="display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-2) var(--sp-3); background: var(--clr-surface-alt); border-radius: var(--radius-sm);">
                  <span class="badge badge-primary" style="font-family: var(--font-mono); min-width: 85px; justify-content: center;">
                    ${escapeHtml(item.time)}
                  </span>
                  <span style="font-size: var(--fs-sm); font-weight: var(--fw-medium);">
                    ${escapeHtml(item.event)}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Regenerate ideas
  container.querySelector('#regen-ideas-btn').addEventListener('click', async () => {
    showLoading(true, 'AI is drafting fresh themes, menus & celebration concepts...');
    try {
      const res = await apiPost('/api/ai/ideas', {
        eventType: event.type,
        guestCount: event.guestCount,
        city: event.city,
        dietary: event.dietary || ['vegetarian'],
        theme: event.theme || '',
        priorities: event.priorities || []
      });

      updateActiveEvent(ev => {
        ev.ideas = res.ideas;
      });

      showLoading(false);
      showToast('✨ Fresh ideas generated successfully!', 'success');
      renderIdeas(container);
    } catch (err) {
      showLoading(false);
      showToast(`Generation error: ${err.message}`, 'error');
    }
  });
}
