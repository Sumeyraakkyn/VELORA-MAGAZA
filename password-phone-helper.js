// Password visibility toggle
function initPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'password-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
      <span class="toggle-text">Aç</span>
    `;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.querySelector('.toggle-text').textContent = isPassword ? 'Gizle' : 'Aç';
    });

    wrapper.appendChild(toggleBtn);
  });
}

// Phone number limit to 10 digits
function initPhoneInputs() {
  document.querySelectorAll('input[type="tel"], .phone-input').forEach((input) => {
    input.placeholder = '5055555555';
    input.maxLength = '10';
    
    // Add helper text
    const helpText = document.createElement('div');
    helpText.className = 'phone-help';
    helpText.textContent = '⚠️ Başında 0 olmadan yazınız (10 hane)';
    input.parentNode.appendChild(helpText);

    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    });

    input.addEventListener('change', (e) => {
      if (e.target.value && !e.target.value.match(/^5[0-9]{9}$/)) {
        console.warn('⚠️ Geçersiz telefon numarası: 5 ile başlamalı ve 10 hane olmalı');
      }
    });
  });
}

// Initialize both when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initPhoneInputs();
  });
} else {
  initPasswordToggles();
  initPhoneInputs();
}
