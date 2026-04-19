(function () {
  var USERS_KEY = 'users';
  var CURRENT_USER_KEY = 'currentUser';

  function getUsers() {
    try {
      var users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(users) ? users : [];
    } catch (err) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUserEmail() {
    return localStorage.getItem(CURRENT_USER_KEY) || '';
  }

  function setCurrentUserEmail(email) {
    localStorage.setItem(CURRENT_USER_KEY, email);
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function findUserByEmail(email) {
    var normalized = (email || '').trim().toLowerCase();
    return getUsers().find(function (user) {
      return (user.email || '').toLowerCase() === normalized;
    });
  }

  function updateUser(updatedUser) {
    var users = getUsers();
    var next = users.map(function (user) {
      return user.email === updatedUser.email ? updatedUser : user;
    });
    saveUsers(next);
  }

  function getCurrentUser() {
    var email = getCurrentUserEmail();
    if (!email) {
      return null;
    }
    return findUserByEmail(email) || null;
  }

  function showMessage(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('error', 'success');
    if (type) {
      el.classList.add(type);
    }
  }

  function postAuth(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json()
        .catch(function () {
          return { ok: false, message: 'Unexpected server response.' };
        })
        .then(function (data) {
          return {
            httpOk: response.ok,
            data: data
          };
        });
    });
  }

  function scorePassword(password) {
    var score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }

  function isStrongPassword(password) {
    return scorePassword(password) >= 5;
  }

  function bindPasswordToggles() {
    var toggles = document.querySelectorAll('[data-toggle-password]');
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inputId = btn.getAttribute('data-toggle-password');
        var target = document.getElementById(inputId);
        if (!target) return;
        var hidden = target.type === 'password';
        target.type = hidden ? 'text' : 'password';
        btn.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
        btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      });
    });
  }

  function bindSignupStrengthMeter() {
    var passwordInput = document.getElementById('signupPassword');
    var fill = document.getElementById('strengthFill');
    var text = document.getElementById('strengthText');
    if (!passwordInput || !fill || !text) return;

    function paint() {
      var score = scorePassword(passwordInput.value || '');
      var width = (score / 5) * 100;
      var color = '#ef4444';
      var label = 'Password strength: too weak';

      if (score === 2) {
        color = '#f97316';
        label = 'Password strength: weak';
      } else if (score === 3) {
        color = '#f59e0b';
        label = 'Password strength: fair';
      } else if (score === 4) {
        color = '#4caf50';
        label = 'Password strength: good';
      } else if (score === 5) {
        color = '#006e1c';
        label = 'Password strength: strong';
      }

      fill.style.width = width + '%';
      fill.style.backgroundColor = color;
      text.textContent = label;
    }

    passwordInput.addEventListener('input', paint);
    paint();
  }

  function todayISO() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function offsetISO(daysBack) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysBack);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatDateISO(dateObj) {
    var y = dateObj.getFullYear();
    var m = String(dateObj.getMonth() + 1).padStart(2, '0');
    var d = String(dateObj.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function parseISODate(isoDate) {
    var parts = String(isoDate || '').split('-');
    if (parts.length !== 3) {
      return null;
    }
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function daysBetween(startISO, endISO) {
    var start = parseISODate(startISO);
    var end = parseISODate(endISO);
    if (!start || !end) {
      return 0;
    }
    var ms = end.getTime() - start.getTime();
    return Math.floor(ms / 86400000);
  }

  function monthDiff(startISO, endISO) {
    var start = parseISODate(startISO);
    var end = parseISODate(endISO);
    if (!start || !end) return 0;
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  function yearDiff(startISO, endISO) {
    var start = parseISODate(startISO);
    var end = parseISODate(endISO);
    if (!start || !end) return 0;
    return end.getFullYear() - start.getFullYear();
  }

  function weekdayName(isoDate) {
    var d = parseISODate(isoDate);
    if (!d) return '';
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }

  function dayLabel(isoDate) {
    var d = parseISODate(isoDate);
    if (!d) return isoDate;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  }

  function defaultSchedule(anchorDate) {
    return {
      interval: 1,
      unit: 'day',
      anchor_date: anchorDate,
      ends: 'never',
      end_date: null
    };
  }

  function normalizeSchedule(schedule, fallbackDate) {
    var src = schedule || {};
    var interval = Number.parseInt(src.interval, 10);
    if (!Number.isFinite(interval) || interval < 1) interval = 1;
    if (interval > 365) interval = 365;

    var unit = src.unit;
    if (['day', 'week', 'month', 'year'].indexOf(unit) < 0) {
      unit = 'day';
    }

    var anchorDate = src.anchor_date || fallbackDate;
    if (!parseISODate(anchorDate)) {
      anchorDate = fallbackDate;
    }

    return {
      interval: interval,
      unit: unit,
      anchor_date: anchorDate,
      ends: 'never',
      end_date: null
    };
  }

  function getHabitSchedule(habit, fallbackDate) {
    if (habit.schedule) {
      habit.schedule = normalizeSchedule(habit.schedule, fallbackDate);
      return habit.schedule;
    }

    var interval = 1;
    var unit = 'day';
    if (habit.frequency === 'every_2_days') {
      interval = 2;
      unit = 'day';
    } else if (habit.frequency === 'weekly') {
      interval = 1;
      unit = 'week';
    }

    habit.schedule = normalizeSchedule({
      interval: interval,
      unit: unit,
      anchor_date: habit.created_at || fallbackDate,
      ends: 'never',
      end_date: null
    }, fallbackDate);

    return habit.schedule;
  }

  function formatScheduleLabel(schedule) {
    var unit = schedule.unit;
    var interval = schedule.interval;
    var label = 'Every ';

    if (interval === 1) {
      label += unit;
    } else {
      label += interval + ' ' + unit + 's';
    }

    if (unit === 'week') {
      label += ' starting ' + weekdayName(schedule.anchor_date);
    } else {
      label += ' starting ' + dayLabel(schedule.anchor_date);
    }

    return label;
  }

  function nextWeekdayISO(targetDay) {
    var d = parseISODate(todayISO());
    if (!d) return todayISO();
    var delta = (targetDay - d.getDay() + 7) % 7;
    if (delta === 0) delta = 7;
    d.setDate(d.getDate() + delta);
    return formatDateISO(d);
  }

  function isHabitDueOn(habit, dateISO) {
    var schedule = getHabitSchedule(habit, dateISO);
    var anchor = schedule.anchor_date;

    if (daysBetween(anchor, dateISO) < 0) {
      return false;
    }

    if (schedule.unit === 'day') {
      return daysBetween(anchor, dateISO) % schedule.interval === 0;
    }

    if (schedule.unit === 'week') {
      return daysBetween(anchor, dateISO) % (7 * schedule.interval) === 0;
    }

    if (schedule.unit === 'month') {
      var a = parseISODate(anchor);
      var t = parseISODate(dateISO);
      if (!a || !t || t.getDate() !== a.getDate()) return false;
      var md = monthDiff(anchor, dateISO);
      return md >= 0 && md % schedule.interval === 0;
    }

    if (schedule.unit === 'year') {
      var ay = parseISODate(anchor);
      var ty = parseISODate(dateISO);
      if (!ay || !ty || ty.getMonth() !== ay.getMonth() || ty.getDate() !== ay.getDate()) return false;
      var yd = yearDiff(anchor, dateISO);
      return yd >= 0 && yd % schedule.interval === 0;
    }

    return false;
  }

  function normalizeHabit(habit, fallbackDate) {
    if (!habit.created_at) {
      habit.created_at = fallbackDate;
    }
    getHabitSchedule(habit, fallbackDate);
    habit.history = habit.history || {};
    return habit;
  }

  // Calculate consecutive completed due occurrences from today backward.
  function calculateStreak(habit, today) {
    var history = habit.history || {};
    var streak = 0;
    var limit = 3650;
    var encounteredDue = false;

    for (var i = 0; i < limit; i += 1) {
      var key = offsetISO(i);
      if (!isHabitDueOn(habit, key)) {
        continue;
      }

      encounteredDue = true;

      if (history[key] === true) {
        streak += 1;
      } else {
        break;
      }
    }

    if (!encounteredDue || !isHabitDueOn(habit, today)) {
      return streak;
    }

    return streak;
  }

  function getDisplayName(user) {
    var name = String((user && user.full_name) || '').trim();
    if (name) return name;
    var email = String((user && user.email) || '').trim();
    if (!email) return 'User';
    return email.split('@')[0];
  }

  function getAvatarForUser(user) {
    return String((user && user.profile_image) || '').trim() ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6PBY9AW1y6eTbrlu_EPxaG8pMRI9ZZwslitjvTbkgmb0h8mW1xBhS01ZG_RXdBE5gbXotrz9C5KAygJaGk_RywIFm0ogu8bhYD-v3o4Hp1tHeVV1bzrPBTPunwjAeZsxAlaV9BwYjTIa2TTtTVWCJatIIKULDfoQcgghFNarR22egTYiBOQDB785DWPccn5YTYtC3DmhSaDB8xra3N2xbkagxiE5bb8OpWBMIwvPUIBHOsGIXaNkMZHGF3b0bTW6-Lu4LppuLIgGA';
  }

  function getHighestStreakHabit(user, today) {
    var habits = Array.isArray(user && user.habits) ? user.habits : [];
    var best = { name: 'No habit yet', streak: 0 };

    habits.forEach(function (habit) {
      normalizeHabit(habit, today);
      var streak = calculateStreak(habit, today);
      if (streak > best.streak) {
        best = {
          name: habit.name,
          streak: streak
        };
      }
    });

    return best;
  }

  function ensureAuthOrRedirect() {
    if (!getCurrentUser()) {
      clearCurrentUser();
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function initLanding() {
    if (getCurrentUser()) {
      window.location.href = 'dashboard.html';
    } else if (getCurrentUserEmail()) {
      clearCurrentUser();
    }
  }

  function initSignup() {
    if (getCurrentUser()) {
      window.location.href = 'dashboard.html';
      return;
    } else if (getCurrentUserEmail()) {
      clearCurrentUser();
    }

    var form = document.getElementById('signupForm');
    var message = document.getElementById('signupMessage');
    bindPasswordToggles();
    bindSignupStrengthMeter();

    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var fullName = String(form.full_name.value || '').trim();
      var email = String(form.email.value || '').trim().toLowerCase();
      var password = String(form.password.value || '');
      var confirmPassword = String(form.confirm_password.value || '');

      if (!fullName || !email || !password || !confirmPassword) {
        showMessage(message, 'Full name, email, password, and re-entered password are required.', 'error');
        return;
      }

      if (!isStrongPassword(password)) {
        showMessage(message, 'Use 8+ chars with uppercase, lowercase, number, and special character.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showMessage(message, 'Passwords do not match.', 'error');
        return;
      }

      postAuth('api_signup.php', {
        full_name: fullName,
        email: email,
        password: password,
        confirm_password: confirmPassword
      }).then(function (result) {
        if (!result.httpOk || !result.data || !result.data.ok) {
          showMessage(message, (result.data && result.data.message) || 'Signup failed.', 'error');
          return;
        }

        var users = getUsers();
        var existingIndex = users.findIndex(function (user) {
          return String(user.email || '').toLowerCase() === email;
        });
        var existingHabits = existingIndex >= 0 && Array.isArray(users[existingIndex].habits) ? users[existingIndex].habits : [];
        var existingProfileImage = existingIndex >= 0 ? (users[existingIndex].profile_image || '') : '';

        var nextUser = {
          full_name: fullName,
          email: email,
          password: password,
          habits: existingHabits
        };

        if (existingProfileImage) {
          nextUser.profile_image = existingProfileImage;
        }

        if (existingIndex >= 0) {
          users[existingIndex] = nextUser;
        } else {
          users.push(nextUser);
        }

        saveUsers(users);
        setCurrentUserEmail(email);
        showMessage(message, 'Account created and synced. Redirecting to dashboard...', 'success');
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 500);
      }).catch(function () {
        showMessage(message, 'Could not reach server. Check Apache/MySQL and try again.', 'error');
      });
    });
  }

  function initLogin() {
    if (getCurrentUser()) {
      window.location.href = 'dashboard.html';
      return;
    } else if (getCurrentUserEmail()) {
      clearCurrentUser();
    }

    var form = document.getElementById('loginForm');
    var message = document.getElementById('loginMessage');
    bindPasswordToggles();

    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var email = String(form.email.value || '').trim().toLowerCase();
      var password = String(form.password.value || '');

      postAuth('api_login.php', {
        email: email,
        password: password
      }).then(function (result) {
        if (!result.httpOk || !result.data || !result.data.ok) {
          showMessage(message, (result.data && result.data.message) || 'Invalid email or password.', 'error');
          return;
        }

        var serverUser = result.data.user || {};
        var users = getUsers();
        var existingIndex = users.findIndex(function (user) {
          return String(user.email || '').toLowerCase() === email;
        });
        var existingHabits = existingIndex >= 0 && Array.isArray(users[existingIndex].habits) ? users[existingIndex].habits : [];
        var existingProfileImage = existingIndex >= 0 ? (users[existingIndex].profile_image || '') : '';
        var nextUser = {
          full_name: String(serverUser.full_name || '').trim() || (existingIndex >= 0 ? users[existingIndex].full_name : ''),
          email: email,
          password: password,
          habits: existingHabits
        };

        if (existingProfileImage) {
          nextUser.profile_image = existingProfileImage;
        }

        if (existingIndex >= 0) {
          users[existingIndex] = nextUser;
        } else {
          users.push(nextUser);
        }

        saveUsers(users);
        setCurrentUserEmail(email);
        showMessage(message, 'Login successful. Redirecting...', 'success');
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 400);
      }).catch(function () {
        showMessage(message, 'Could not reach server. Check Apache/MySQL and try again.', 'error');
      });
    });
  }

  function initDashboard() {
    if (!ensureAuthOrRedirect()) return;

    var welcomeText = document.getElementById('welcomeText');
    var todayDate = document.getElementById('todayDate');
    var logoutBtn = document.getElementById('logoutBtn');
    var logoutBtnSettings = document.getElementById('logoutBtnSettings');
    var sidebarProfileName = document.getElementById('sidebarProfileName');
    var sidebarProfileStreak = document.getElementById('sidebarProfileStreak');
    var sidebarAvatar = document.getElementById('sidebarAvatar');
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-link[data-tab-target]'));
    var tabPanels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));
    var streaksList = document.getElementById('streaksList');
    var streaksEmpty = document.getElementById('streaksEmpty');
    var metricTotalHabits = document.getElementById('metricTotalHabits');
    var metricDueToday = document.getElementById('metricDueToday');
    var metricDoneToday = document.getElementById('metricDoneToday');
    var metricCompletionRate = document.getElementById('metricCompletionRate');
    var habitForm = document.getElementById('habitForm');
    var habitName = document.getElementById('habitName');
    var openScheduleBtn = document.getElementById('openScheduleBtn');
    var schedulePreview = document.getElementById('schedulePreview');
    var scheduleModal = document.getElementById('scheduleModal');
    var editHabitModal = document.getElementById('editHabitModal');
    var editHabitNameInput = document.getElementById('editHabitNameInput');
    var editIntervalMinus = document.getElementById('editIntervalMinus');
    var editIntervalPlus = document.getElementById('editIntervalPlus');
    var editIntervalValue = document.getElementById('editIntervalValue');
    var editIntervalUnit = document.getElementById('editIntervalUnit');
    var cancelEditHabitBtn = document.getElementById('cancelEditHabitBtn');
    var saveEditHabitBtn = document.getElementById('saveEditHabitBtn');
    var intervalMinus = document.getElementById('intervalMinus');
    var intervalPlus = document.getElementById('intervalPlus');
    var intervalValue = document.getElementById('intervalValue');
    var intervalUnit = document.getElementById('intervalUnit');
    var cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
    var saveScheduleBtn = document.getElementById('saveScheduleBtn');
    var quickTodayLabel = document.getElementById('quickTodayLabel');
    var quickTomorrowLabel = document.getElementById('quickTomorrowLabel');
    var quickNextWeekLabel = document.getElementById('quickNextWeekLabel');
    var quickWeekendLabel = document.getElementById('quickWeekendLabel');
    var quickButtons = Array.prototype.slice.call(document.querySelectorAll('.quick-option'));
    var habitMessage = document.getElementById('habitMessage');
    var habitList = document.getElementById('habitList');
    var emptyState = document.getElementById('emptyState');

    if (!habitList || !habitForm || !habitName || !openScheduleBtn || !schedulePreview || !scheduleModal) return;

    var selectedSchedule = normalizeSchedule(defaultSchedule(todayISO()), todayISO());
    var draftSchedule = normalizeSchedule(selectedSchedule, todayISO());
    var editHabitId = '';

    function setQuickLabels() {
      var t = todayISO();
      var tom = formatDateISO(new Date(parseISODate(t).getTime() + 86400000));
      var nw = nextWeekdayISO(1);
      var wknd = nextWeekdayISO(6);
      if (quickTodayLabel) quickTodayLabel.textContent = dayLabel(t);
      if (quickTomorrowLabel) quickTomorrowLabel.textContent = dayLabel(tom);
      if (quickNextWeekLabel) quickNextWeekLabel.textContent = dayLabel(nw);
      if (quickWeekendLabel) quickWeekendLabel.textContent = dayLabel(wknd);
    }

    function setActiveQuick(anchorDate) {
      var map = {
        today: todayISO(),
        tomorrow: formatDateISO(new Date(parseISODate(todayISO()).getTime() + 86400000)),
        next_week: nextWeekdayISO(1),
        next_weekend: nextWeekdayISO(6)
      };

      quickButtons.forEach(function (btn) {
        var key = btn.getAttribute('data-quick');
        btn.classList.toggle('active', map[key] === anchorDate);
      });
    }

    function syncDraftToModal() {
      if (!intervalValue || !intervalUnit) return;
      intervalValue.value = String(draftSchedule.interval);
      intervalUnit.value = draftSchedule.unit;
      setActiveQuick(draftSchedule.anchor_date);
    }

    function syncPreview() {
      schedulePreview.textContent = formatScheduleLabel(selectedSchedule);
    }

    function openSchedule() {
      draftSchedule = normalizeSchedule(selectedSchedule, todayISO());
      setQuickLabels();
      syncDraftToModal();
      scheduleModal.classList.remove('hidden');
      scheduleModal.setAttribute('aria-hidden', 'false');
    }

    function closeSchedule() {
      scheduleModal.classList.add('hidden');
      scheduleModal.setAttribute('aria-hidden', 'true');
    }

    function applyDraftFromInputs() {
      var intervalNum = Number.parseInt(intervalValue.value || '1', 10);
      if (!Number.isFinite(intervalNum) || intervalNum < 1) intervalNum = 1;
      if (intervalNum > 365) intervalNum = 365;
      draftSchedule.interval = intervalNum;
      draftSchedule.unit = intervalUnit.value || 'day';
      draftSchedule.ends = 'never';
      draftSchedule.end_date = null;
      draftSchedule = normalizeSchedule(draftSchedule, todayISO());
      syncDraftToModal();
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        clearCurrentUser();
        window.location.href = 'login.html';
      });
    }
    if (logoutBtnSettings) {
      logoutBtnSettings.addEventListener('click', function () {
        clearCurrentUser();
        window.location.href = 'login.html';
      });
    }

    function activateTab(tab) {
      tabButtons.forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-tab-target') === tab);
      });
      tabPanels.forEach(function (panel) {
        panel.classList.toggle('active', panel.id === 'panel-' + tab);
      });
    }

    tabButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activateTab(button.getAttribute('data-tab-target'));
      });
    });

    openScheduleBtn.addEventListener('click', openSchedule);
    cancelScheduleBtn.addEventListener('click', closeSchedule);
    saveScheduleBtn.addEventListener('click', function () {
      applyDraftFromInputs();
      selectedSchedule = normalizeSchedule(draftSchedule, todayISO());
      syncPreview();
      closeSchedule();
    });

    scheduleModal.addEventListener('click', function (event) {
      if (event.target === scheduleModal) {
        closeSchedule();
      }
    });

    intervalMinus.addEventListener('click', function () {
      var next = Number.parseInt(intervalValue.value || '1', 10) - 1;
      intervalValue.value = String(Math.max(1, next));
      applyDraftFromInputs();
    });

    intervalPlus.addEventListener('click', function () {
      var next = Number.parseInt(intervalValue.value || '1', 10) + 1;
      intervalValue.value = String(Math.min(365, next));
      applyDraftFromInputs();
    });

    intervalValue.addEventListener('input', applyDraftFromInputs);
    intervalUnit.addEventListener('change', applyDraftFromInputs);

    quickButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-quick');
        if (key === 'today') draftSchedule.anchor_date = todayISO();
        if (key === 'tomorrow') draftSchedule.anchor_date = formatDateISO(new Date(parseISODate(todayISO()).getTime() + 86400000));
        if (key === 'next_week') draftSchedule.anchor_date = nextWeekdayISO(1);
        if (key === 'next_weekend') draftSchedule.anchor_date = nextWeekdayISO(6);
        draftSchedule = normalizeSchedule(draftSchedule, todayISO());
        syncDraftToModal();
      });
    });

    function render() {
      var today = todayISO();
      if (todayDate) {
        todayDate.textContent = 'Today: ' + today;
      }

      var currentUser = getCurrentUser();
      if (!currentUser) {
        clearCurrentUser();
        window.location.href = 'login.html';
        return;
      }

      if (welcomeText) {
        welcomeText.textContent = 'Welcome, ' + getDisplayName(currentUser);
      }
      if (sidebarProfileName) {
        sidebarProfileName.textContent = getDisplayName(currentUser);
      }
      if (sidebarAvatar) {
        sidebarAvatar.src = getAvatarForUser(currentUser);
      }

      var best = getHighestStreakHabit(currentUser, today);
      if (sidebarProfileStreak) {
        var bestCount = Number(best.streak || 0);
        var dayWord = bestCount <= 1 ? 'Day' : 'Days';
        sidebarProfileStreak.textContent = '🔥 ' + String(bestCount) + ' ' + dayWord + ' Streak';
      }

      var habits = Array.isArray(currentUser.habits) ? currentUser.habits : [];
      habitList.innerHTML = '';

      if (!habits.length) {
        emptyState.style.display = 'block';
        if (metricTotalHabits) metricTotalHabits.textContent = '0';
        if (metricDueToday) metricDueToday.textContent = '0';
        if (metricDoneToday) metricDoneToday.textContent = '0';
        if (metricCompletionRate) metricCompletionRate.textContent = '0%';
        if (streaksList) streaksList.innerHTML = '';
        if (streaksEmpty) streaksEmpty.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      var dueTodayCount = 0;
      var doneTodayCount = 0;
      var rankedStreaks = [];

      habits.forEach(function (habit) {
        normalizeHabit(habit, today);
        var dueToday = isHabitDueOn(habit, today);
        var status = habit.history && Object.prototype.hasOwnProperty.call(habit.history, today)
          ? habit.history[today]
          : null;

        var statusClass = 'status-pending';
        var statusText = 'Pending';

        if (!dueToday) {
          statusClass = 'status-not-due';
          statusText = 'Not due';
        } else if (status === true) {
          statusClass = 'status-done';
          statusText = 'Done';
        } else if (status === false) {
          statusClass = 'status-missed';
          statusText = 'Missed';
        }
        if (dueToday) {
          dueTodayCount += 1;
          if (status === true) doneTodayCount += 1;
        }

        rankedStreaks.push({
          name: habit.name,
          streak: calculateStreak(habit, today),
          schedule: formatScheduleLabel(getHabitSchedule(habit, today))
        });

        var card = document.createElement('article');
        card.className = 'habit-card reveal';
        card.setAttribute('data-habit-id', String(habit.id));
        card.innerHTML = [
          '<div class="habit-top">',
          '  <div>',
          '    <h3 class="habit-name">' + escapeHtml(habit.name) + '</h3>',
          '    <p class="habit-meta">' + escapeHtml(formatScheduleLabel(getHabitSchedule(habit, today))) + '</p>',
          '  </div>',
          '  <span class="status-pill ' + statusClass + '">' + statusText + '</span>',
          '</div>',
          '<p class="streak">🔥 ' + calculateStreak(habit, today) + ' completion streak</p>',
          '<div class="habit-actions">',
          '  <button class="action-btn action-done" data-action="done" data-id="' + habit.id + '"' + (dueToday ? '' : ' disabled') + '>✔ Done</button>',
          '  <button class="action-btn action-missed" data-action="missed" data-id="' + habit.id + '"' + (dueToday ? '' : ' disabled') + '>✖ Missed</button>',
          '  <button class="action-btn action-delete" data-action="delete" data-id="' + habit.id + '">Delete</button>',
          '</div>'
        ].join('');

        habitList.appendChild(card);
      });

      if (metricTotalHabits) metricTotalHabits.textContent = String(habits.length);
      if (metricDueToday) metricDueToday.textContent = String(dueTodayCount);
      if (metricDoneToday) metricDoneToday.textContent = String(doneTodayCount);
      if (metricCompletionRate) {
        var rate = dueTodayCount ? Math.round((doneTodayCount / dueTodayCount) * 100) : 0;
        metricCompletionRate.textContent = rate + '%';
      }

      if (streaksList && streaksEmpty) {
        streaksList.innerHTML = '';
        rankedStreaks.sort(function (a, b) { return b.streak - a.streak; });
        if (!rankedStreaks.length) {
          streaksEmpty.style.display = 'block';
        } else {
          streaksEmpty.style.display = 'none';
          rankedStreaks.forEach(function (item) {
            var row = document.createElement('article');
            row.className = 'streak-row';
            row.innerHTML = [
              '<div>',
              '  <h4>' + escapeHtml(item.name) + '</h4>',
              '  <p>' + escapeHtml(item.schedule) + '</p>',
              '</div>',
              '<strong>🔥 ' + item.streak + '</strong>'
            ].join('');
            streaksList.appendChild(row);
          });
        }
      }
    }

    habitForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = String(habitName.value || '').trim();

      if (!name) {
        showMessage(habitMessage, 'Habit name is required.', 'error');
        return;
      }

      var currentUser = getCurrentUser();
      if (!currentUser) return;

      currentUser.habits = currentUser.habits || [];
      var createdAt = selectedSchedule.anchor_date || todayISO();
      currentUser.habits.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: name,
        created_at: createdAt,
        schedule: normalizeSchedule(selectedSchedule, todayISO()),
        history: {}
      });

      updateUser(currentUser);
      habitForm.reset();
      selectedSchedule = normalizeSchedule(defaultSchedule(todayISO()), todayISO());
      syncPreview();
      showMessage(habitMessage, 'Habit added successfully.', 'success');
      render();
    });

    habitList.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-action]');
      if (button) {
        var action = button.getAttribute('data-action');
        var id = button.getAttribute('data-id');
        var today = todayISO();
        var currentUser = getCurrentUser();
        if (!currentUser) return;

        var habits = currentUser.habits || [];
        var habitIndex = habits.findIndex(function (habit) {
          return String(habit.id) === String(id);
        });

        if (habitIndex < 0) return;

        normalizeHabit(habits[habitIndex], today);

        if (action === 'delete') {
          habits.splice(habitIndex, 1);
        } else {
          if (!isHabitDueOn(habits[habitIndex], today)) {
            showMessage(habitMessage, 'This habit is not due today based on its schedule.', 'error');
            return;
          }
          habits[habitIndex].history = habits[habitIndex].history || {};
          habits[habitIndex].history[today] = action === 'done';
        }

        currentUser.habits = habits;
        updateUser(currentUser);
        render();
        return;
      }

      var card = event.target.closest('.habit-card[data-habit-id]');
      if (!card) return;

      var clickedHabitId = card.getAttribute('data-habit-id') || '';
      var userForEdit = getCurrentUser();
      if (!userForEdit) return;
      var list = userForEdit.habits || [];
      var selected = list.find(function (h) { return String(h.id) === clickedHabitId; });
      if (!selected) return;

      normalizeHabit(selected, todayISO());
      var s = getHabitSchedule(selected, todayISO());
      editHabitId = String(selected.id);
      if (editHabitNameInput) editHabitNameInput.value = String(selected.name || '');
      if (editIntervalValue) editIntervalValue.value = String(s.interval || 1);
      if (editIntervalUnit) editIntervalUnit.value = String(s.unit || 'day');
      if (editHabitModal) {
        editHabitModal.classList.remove('hidden');
        editHabitModal.setAttribute('aria-hidden', 'false');
      }
    });

    function closeEditHabitModal() {
      if (!editHabitModal) return;
      editHabitModal.classList.add('hidden');
      editHabitModal.setAttribute('aria-hidden', 'true');
      editHabitId = '';
    }

    function applyEditInterval(delta) {
      if (!editIntervalValue) return;
      var n = Number.parseInt(editIntervalValue.value || '1', 10);
      if (!Number.isFinite(n)) n = 1;
      n += delta;
      if (n < 1) n = 1;
      if (n > 365) n = 365;
      editIntervalValue.value = String(n);
    }

    if (editIntervalMinus) {
      editIntervalMinus.addEventListener('click', function () {
        applyEditInterval(-1);
      });
    }
    if (editIntervalPlus) {
      editIntervalPlus.addEventListener('click', function () {
        applyEditInterval(1);
      });
    }
    if (cancelEditHabitBtn) {
      cancelEditHabitBtn.addEventListener('click', closeEditHabitModal);
    }
    if (editHabitModal) {
      editHabitModal.addEventListener('click', function (event) {
        if (event.target === editHabitModal) closeEditHabitModal();
      });
    }
    if (saveEditHabitBtn) {
      saveEditHabitBtn.addEventListener('click', function () {
        if (!editHabitId) return;
        var user = getCurrentUser();
        if (!user) return;
        var habits = user.habits || [];
        var idx = habits.findIndex(function (h) { return String(h.id) === editHabitId; });
        if (idx < 0) return;

        var newName = String(editHabitNameInput && editHabitNameInput.value || '').trim();
        var newInterval = Number.parseInt(editIntervalValue && editIntervalValue.value || '1', 10);
        var newUnit = String(editIntervalUnit && editIntervalUnit.value || 'day');

        if (!newName) {
          showMessage(habitMessage, 'Habit name cannot be empty.', 'error');
          return;
        }
        if (!Number.isFinite(newInterval) || newInterval < 1 || newInterval > 365) {
          showMessage(habitMessage, 'Interval must be between 1 and 365.', 'error');
          return;
        }
        if (['day', 'week', 'month', 'year'].indexOf(newUnit) < 0) {
          showMessage(habitMessage, 'Please select a valid repeat unit.', 'error');
          return;
        }

        normalizeHabit(habits[idx], todayISO());
        habits[idx].name = newName;
        habits[idx].schedule = normalizeSchedule({
          interval: newInterval,
          unit: newUnit,
          anchor_date: habits[idx].schedule && habits[idx].schedule.anchor_date ? habits[idx].schedule.anchor_date : todayISO()
        }, todayISO());

        user.habits = habits;
        updateUser(user);
        closeEditHabitModal();
        showMessage(habitMessage, 'Habit updated successfully.', 'success');
        render();
      });
    }

    syncPreview();
    activateTab('journal');
    render();
  }

  function initProfile() {
    if (!ensureAuthOrRedirect()) return;

    var form = document.getElementById('profileForm');
    var fullNameInput = document.getElementById('profileFullName');
    var emailInput = document.getElementById('profileEmail');
    var imageInput = document.getElementById('profileImageInput');
    var avatarPreview = document.getElementById('profileAvatarPreview');
    var profileMessage = document.getElementById('profileMessage');
    var bestHabit = document.getElementById('profileBestHabit');
    var bestStreak = document.getElementById('profileBestStreak');

    if (!form || !fullNameInput || !emailInput || !imageInput || !avatarPreview) return;

    function renderProfile() {
      var user = getCurrentUser();
      if (!user) {
        clearCurrentUser();
        window.location.href = 'login.html';
        return;
      }

      fullNameInput.value = String(user.full_name || '');
      emailInput.value = String(user.email || '');
      avatarPreview.src = getAvatarForUser(user);

      var top = getHighestStreakHabit(user, todayISO());
      bestHabit.textContent = top.name;
      if (top.streak > 0) {
        var profileDayWord = top.streak <= 1 ? 'Day' : 'Days';
        bestStreak.textContent = '🔥 ' + top.streak + ' ' + profileDayWord + ' Streak';
      } else {
        bestStreak.textContent = 'No streak yet';
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var user = getCurrentUser();
      if (!user) return;

      var fullName = String(fullNameInput.value || '').trim();
      if (!fullName) {
        showMessage(profileMessage, 'Full name is required.', 'error');
        return;
      }

      user.full_name = fullName;
      updateUser(user);
      showMessage(profileMessage, 'Profile updated successfully.', 'success');
      renderProfile();
    });

    imageInput.addEventListener('change', function () {
      var file = imageInput.files && imageInput.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        showMessage(profileMessage, 'Please choose a valid image file.', 'error');
        return;
      }

      var reader = new FileReader();
      reader.onload = function (event) {
        var user = getCurrentUser();
        if (!user) return;
        user.profile_image = String(event.target && event.target.result || '');
        updateUser(user);
        showMessage(profileMessage, 'Profile picture updated.', 'success');
        renderProfile();
      };
      reader.readAsDataURL(file);
    });

    renderProfile();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function boot() {
    var page = document.body.dataset.page;
    if (page === 'landing') return initLanding();
    if (page === 'signup') return initSignup();
    if (page === 'login') return initLogin();
    if (page === 'dashboard') return initDashboard();
    if (page === 'profile') return initProfile();
  }

  boot();
})();

