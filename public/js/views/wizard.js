/**
 * Event Planner Wizard:
 * Multi-input creator to generate a complete celebration plan with GenAI / offline intelligence.
 */
import { saveEvent, genId, getActiveEvent } from '../store.js';
import { apiPost } from '../api.js';
import { showToast, showLoading, getDaysRemaining, escapeHtml } from '../utils.js';

export function renderWizard(container) {
  // Check if we are editing active event or creating a new one
  const active = getActiveEvent();
  
  // Set default future date (e.g. 45 days from today)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 45);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: var(--sp-8);">
        <h1>✨ Create Celebration Plan</h1>
        <p style="color: var(--clr-text-muted);">
          Our AI assistant will generate a customized budget breakdown, milestone timeline, vendor checklist, and personalized event concepts in seconds.
        </p>
      </div>

      <div class="card">
        <form id="wizard-form">
          <!-- Step 1: Basics -->
          <div class="section">
            <h3 class="section-title">🎉 Event Details</h3>
            
            <div class="form-group">
              <label class="form-label" for="event-title">Event Title *</label>
              <input type="text" id="event-title" class="form-input" required 
                placeholder="e.g., Ananya & Kabir's Wedding or Maya's 1st Birthday" 
                value="${active ? escapeHtml(active.title) : 'Grand Celebration'}">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="event-type">Event Type *</label>
                <select id="event-type" class="form-select" required>
                  <option value="wedding" ${active?.type === 'wedding' ? 'selected' : ''}>💍 Wedding</option>
                  <option value="birthday" ${active?.type === 'birthday' ? 'selected' : ''}>🎂 Birthday Party</option>
                  <option value="community" ${active?.type === 'community' ? 'selected' : ''}>🏘️ Community Event / Gala</option>
                  <option value="anniversary" ${active?.type === 'anniversary' ? 'selected' : ''}>🥂 Anniversary</option>
                  <option value="corporate" ${active?.type === 'corporate' ? 'selected' : ''}>🏢 Corporate / Social Gathering</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="event-date">Celebration Date *</label>
                <input type="date" id="event-date" class="form-input" required 
                  min="${new Date().toISOString().split('T')[0]}" 
                  value="${active?.date || defaultDateStr}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="event-city">City / Destination *</label>
                <input type="text" id="event-city" class="form-input" required 
                  placeholder="e.g., Mumbai, Jaipur, Bangalore, Delhi" 
                  value="${active?.city || 'Jaipur'}">
              </div>

              <div class="form-group">
                <label class="form-label" for="guest-count">Estimated Guest Count *</label>
                <input type="number" id="guest-count" class="form-input" required min="5" max="10000" 
                  value="${active?.guestCount || 150}">
              </div>
            </div>
          </div>

          <!-- Step 2: Financials & Currency -->
          <div class="section">
            <h3 class="section-title">💰 Budget & Preferences</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="total-budget">Total Budget *</label>
                <input type="number" id="total-budget" class="form-input" required min="1000" step="500" 
                  value="${active?.totalBudget || 500000}">
              </div>

              <div class="form-group">
                <label class="form-label" for="currency">Currency *</label>
                <select id="currency" class="form-select" required>
                  <option value="INR" ${active?.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                  <option value="USD" ${active?.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="EUR" ${active?.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                  <option value="GBP" ${active?.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                </select>
              </div>
            </div>

            <!-- Priority selections -->
            <div class="form-group">
              <label class="form-label">Key Priorities (Select 2-3 to boost allocation)</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="priority" value="catering" checked>
                  <span>🍽️ Catering & Food</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="priority" value="photography" checked>
                  <span>📸 Photography & Video</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="priority" value="decor">
                  <span>🌸 Decor & Ambience</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="priority" value="entertainment">
                  <span>🎵 Music & Entertainment</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="priority" value="venue">
                  <span>🏰 Venue Experience</span>
                </label>
              </div>
            </div>

            <!-- Dietary selections -->
            <div class="form-group">
              <label class="form-label">Dietary Preferences for Menu Suggestions</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="vegetarian" checked>
                  <span>🥗 Vegetarian</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="vegan">
                  <span>🌱 Vegan</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="jain">
                  <span>🌿 Jain Friendly</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="halal">
                  <span>🥩 Halal</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="gluten-free">
                  <span>🌾 Gluten-Free</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="dietary" value="nut-free">
                  <span>🥜 Nut-Free</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="theme-notes">Theme or Vision Notes (Optional)</label>
              <textarea id="theme-notes" class="form-textarea" 
                placeholder="e.g., Royal Marigold vibes with evening fairy lights, live acoustic music, and interactive food counters.">${active?.theme || ''}</textarea>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: var(--sp-4); margin-top: var(--sp-6);">
            <a href="#/dashboard" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary btn-lg" id="submit-btn">
              ✨ Generate Complete Plan with AI
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Handle form submission
  const form = container.querySelector('#wizard-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = container.querySelector('#event-title').value.trim();
    const type = container.querySelector('#event-type').value;
    const date = container.querySelector('#event-date').value;
    const city = container.querySelector('#event-city').value.trim();
    const guestCount = parseInt(container.querySelector('#guest-count').value, 10);
    const totalBudget = parseFloat(container.querySelector('#total-budget').value);
    const currency = container.querySelector('#currency').value;
    const theme = container.querySelector('#theme-notes').value.trim();

    const priorities = Array.from(container.querySelectorAll('input[name="priority"]:checked')).map(el => el.value);
    const dietary = Array.from(container.querySelectorAll('input[name="dietary"]:checked')).map(el => el.value);

    const leadTimeDays = Math.max(1, getDaysRemaining(date));

    showLoading(true, 'AI is designing your budget, timeline & personalized celebration concepts...');

    try {
      // Fetch budget allocations
      const budgetRes = await apiPost('/api/plan/budget', {
        eventType: type,
        totalBudget,
        guestCount,
        city,
        priorities,
        currency,
        leadTimeDays
      });

      // Fetch milestone timeline
      const timelineRes = await apiPost('/api/plan/timeline', {
        eventType: type,
        eventDate: date
      });

      // Fetch AI ideas
      const ideasRes = await apiPost('/api/ai/ideas', {
        eventType: type,
        guestCount,
        city,
        dietary: dietary.length ? dietary : ['vegetarian'],
        theme: theme || 'Celebration',
        priorities
      });

      // Initial vendors generated from budget allocations
      const generatedVendors = (budgetRes.allocations || []).slice(0, 5).map((alloc, idx) => ({
        id: genId(),
        name: `${alloc.category} Partner (${city})`,
        category: alloc.category,
        status: 'searching',
        quote: alloc.amount,
        phone: '+91 98000 0000' + idx,
        email: `contact@${alloc.category.toLowerCase().replace(/[^a-z]/g, '')}-service.com`,
        notes: alloc.description || ''
      }));

      const newEvent = {
        id: genId(),
        title,
        type,
        date,
        city,
        guestCount,
        totalBudget,
        currency,
        priorities,
        dietary,
        theme: theme || 'Celebration of Joy',
        notes: `AI Generated Plan with ${budgetRes.allocations?.length || 0} budget lines and ${timelineRes.tasks?.length || 0} milestone tasks.`,
        budget: {
          total: totalBudget,
          currency,
          perGuest: budgetRes.perGuestCost || Math.round(totalBudget / (guestCount || 1)),
          tightBudget: budgetRes.tightBudget || false,
          contingencyPercent: budgetRes.contingencyPercent || 8,
          allocations: (budgetRes.allocations || []).map(a => ({
            ...a,
            actualSpent: 0
          }))
        },
        tasks: (timelineRes.tasks || []).map(t => ({
          ...t,
          status: 'pending'
        })),
        vendors: generatedVendors,
        ideas: ideasRes.ideas || {
          source: 'offline',
          themeSuggestions: [{ name: theme || 'Festive Charm', description: 'Curated aesthetic with warm hospitality.' }],
          decorHighlights: ['Welcome flower entrance', 'Warm string lights and festive accents'],
          menuSuggestions: [{ course: 'Dinner Buffet', item: 'Multi-cuisine selection matching dietary preferences' }],
          entertainment: ['Curated playlist & live emcee'],
          runOfShow: [{ time: '06:00 PM', event: 'Guest Arrival & Welcome' }]
        }
      };

      saveEvent(newEvent);
      showLoading(false);
      showToast('🎉 Celebration Plan created successfully!', 'success');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showLoading(false);
      showToast(`Error creating plan: ${err.message}`, 'error', 5000);
    }
  });
}
