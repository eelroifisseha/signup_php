(function () {
  var passwordInput = document.getElementById('password');
  var strengthFill = document.getElementById('strengthFill');
  var strengthText = document.getElementById('strengthText');
  var toggles = document.querySelectorAll('[data-toggle-password]');

  function scorePassword(value) {
    var score = 0;
    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  function updateStrength() {
    if (!passwordInput || !strengthFill || !strengthText) {
      return;
    }

    var password = passwordInput.value || '';
    var score = scorePassword(password);
    var percent = (score / 5) * 100;
    var color = '#f43f5e';
    var text = 'Password strength: too weak';

    if (score === 2) {
      color = '#fb7185';
      text = 'Password strength: weak';
    } else if (score === 3) {
      color = '#fbbf24';
      text = 'Password strength: fair';
    } else if (score === 4) {
      color = '#22d3ee';
      text = 'Password strength: good';
    } else if (score === 5) {
      color = '#4ade80';
      text = 'Password strength: strong';
    }

    strengthFill.style.width = percent + '%';
    strengthFill.style.backgroundColor = color;
    strengthText.textContent = text;
  }

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inputId = btn.getAttribute('data-toggle-password');
      var target = document.getElementById(inputId);
      if (!target) {
        return;
      }

      var isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    });
  });

  if (passwordInput) {
    passwordInput.addEventListener('input', updateStrength);
    updateStrength();
  }
})();
