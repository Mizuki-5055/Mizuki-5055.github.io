(function () {
  'use strict';

  const months = [
    { name: 'REGNIS', days: 31 },
    { name: 'MEMENTIS', days: 31 },
    { name: 'LUCIDIS', days: 31 },
    { name: 'GELIDIS', days: 31 },
    { name: 'VARMER', days: 30 },
    { name: 'DRACCER', days: 30 },
    { name: 'HELARI', days: 29 },
    { name: 'NUBILLIS', days: 31 },
    { name: 'FLORRER', days: 30 },
    { name: 'VOKSER', days: 30 },
    { name: 'ABRAXI', days: 29 },
    { name: 'SOLARI', days: 29 }
  ];
  const weekdays = ['Førstday', 'Nestday', 'Trejday', 'Fjerday', 'Femday', 'Seksday', 'Syvday'];
  const daysPerYear = months.reduce((total, month) => total + month.days, 0);
  const anchorYear = 807;
  const anchorWeekday = 5; // Seksday, the weekday of Regnis 1st in Year 807.

  const yearInput = document.getElementById('calendar-year');
  const monthSelect = document.getElementById('calendar-month');
  const dayInput = document.getElementById('calendar-day');
  const grid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('calendar-month-title');
  const yearLabel = document.getElementById('calendar-year-label');
  const selectedPanel = document.getElementById('calendar-selected-date');
  if (!yearInput || !monthSelect || !grid || !selectedPanel) return;

  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = month.name;
    monthSelect.appendChild(option);
  });

  const dateEntries = new Map();
  document.querySelectorAll('.calendar-date-source').forEach((template) => {
    const year = Number(template.dataset.year);
    const monthIndex = months.findIndex((month) => month.name.toLowerCase() === template.dataset.month);
    const day = Number(template.dataset.day);
    if (!Number.isInteger(year) || year < 1 || monthIndex < 0 || !Number.isInteger(day) || day < 1 || day > months[monthIndex].days) return;
    const key = `${year}-${monthIndex}-${day}`;
    if (!dateEntries.has(key)) dateEntries.set(key, []);
    Array.from(template.content.querySelectorAll('.calendar-source-entry')).forEach((entry) => dateEntries.get(key).push(entry));
  });

  function ordinal(year) {
    const mod100 = year % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[year % 10] || 'th');
    return `${year}${suffix}`;
  }

  function mod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function weekdayFor(year, monthIndex, day) {
    const priorYears = year - anchorYear;
    const priorDays = months.slice(0, monthIndex).reduce((total, month) => total + month.days, 0);
    return mod(anchorWeekday + priorYears * daysPerYear + priorDays + day - 1, weekdays.length);
  }

  function textForEntry(entry, selector) {
    return (entry.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function showDate(year, monthIndex, day, weekdayIndex) {
    const key = `${year}-${monthIndex}-${day}`;
    const entries = dateEntries.get(key) || [];
    selectedPanel.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = `${weekdays[weekdayIndex]}, ${months[monthIndex].name} ${day}${ordinal(day)}, Year ${ordinal(year)}`;
    selectedPanel.appendChild(heading);

    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-no-entries';
      empty.textContent = 'No entries are recorded for this date yet.';
      selectedPanel.appendChild(empty);
      return;
    }

    entries.forEach((source) => {
      const article = document.createElement('article');
      article.className = 'calendar-full-entry';
      const title = source.querySelector('h4');
      if (title) article.appendChild(title.cloneNode(true));
      const preview = source.querySelector('.calendar-source-preview');
      const content = source.querySelector('.calendar-source-content');
      if (preview) article.appendChild(preview.cloneNode(true));
      if (content) article.appendChild(content.cloneNode(true));
      selectedPanel.appendChild(article);
    });
  }

  function render() {
    const year = Number(yearInput.value);
    const monthIndex = Number(monthSelect.value);
    if (!Number.isInteger(year) || year < 1 || !months[monthIndex]) return;

    monthTitle.textContent = months[monthIndex].name;
    yearLabel.textContent = ordinal(year);
    grid.replaceChildren();

    weekdays.forEach((weekday) => {
      const label = document.createElement('div');
      label.className = 'calendar-weekday';
      label.setAttribute('role', 'columnheader');
      label.textContent = weekday;
      grid.appendChild(label);
    });

    const firstWeekday = weekdayFor(year, monthIndex, 1);
    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement('div');
      spacer.className = 'calendar-empty';
      spacer.setAttribute('role', 'gridcell');
      spacer.setAttribute('aria-hidden', 'true');
      grid.appendChild(spacer);
    }

    for (let day = 1; day <= months[monthIndex].days; day += 1) {
      const weekdayIndex = weekdayFor(year, monthIndex, day);
      const key = `${year}-${monthIndex}-${day}`;
      const entries = dateEntries.get(key) || [];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `calendar-day${entries.length ? ' has-entries' : ''}`;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `${weekdays[weekdayIndex]}, ${months[monthIndex].name} ${day}, Year ${ordinal(year)}${entries.length ? `, ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : ''}`);
      const number = document.createElement('span');
      number.className = 'calendar-day-number';
      number.textContent = String(day);
      button.appendChild(number);
      if (entries.length) {
        const preview = document.createElement('span');
        preview.className = 'calendar-day-preview';
        preview.textContent = textForEntry(entries[0], '.calendar-source-preview') || textForEntry(entries[0], '.calendar-source-content') || textForEntry(entries[0], 'h4');
        button.appendChild(preview);
        if (entries.length > 1) {
          const count = document.createElement('span');
          count.className = 'calendar-day-count';
          count.textContent = `+${entries.length} entries`;
          button.appendChild(count);
        }
      }
      button.addEventListener('click', () => {
        grid.querySelectorAll('.calendar-day.is-selected').forEach((selected) => selected.classList.remove('is-selected'));
        button.classList.add('is-selected');
        dayInput.value = String(day);
        showDate(year, monthIndex, day, weekdayIndex);
      });
      grid.appendChild(button);
    }

    dayInput.max = String(months[monthIndex].days);
    if (Number(dayInput.value) > months[monthIndex].days) dayInput.value = String(months[monthIndex].days);
  }

  document.getElementById('calendar-go-year').addEventListener('click', render);
  yearInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') render();
  });
  monthSelect.addEventListener('change', render);
  document.getElementById('calendar-prev-month').addEventListener('click', () => {
    let month = Number(monthSelect.value) - 1;
    if (month < 0) {
      month = months.length - 1;
      yearInput.value = String(Math.max(1, Number(yearInput.value) - 1));
    }
    monthSelect.value = String(month);
    render();
  });
  document.getElementById('calendar-next-month').addEventListener('click', () => {
    let month = Number(monthSelect.value) + 1;
    if (month >= months.length) {
      month = 0;
      yearInput.value = String(Number(yearInput.value) + 1);
    }
    monthSelect.value = String(month);
    render();
  });
  document.getElementById('calendar-date-jump').addEventListener('submit', (event) => {
    event.preventDefault();
    const year = Number(yearInput.value);
    const monthIndex = Number(monthSelect.value);
    const day = Number(dayInput.value);
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(day) || day < 1 || day > months[monthIndex].days) {
      dayInput.setCustomValidity(`Enter a day from 1 to ${months[monthIndex].days}.`);
      dayInput.reportValidity();
      return;
    }
    dayInput.setCustomValidity('');
    render();
    const target = Array.from(grid.querySelectorAll('.calendar-day')).find((button) => button.querySelector('.calendar-day-number')?.textContent === String(day));
    if (target) target.click();
  });

  monthSelect.value = '0';
  render();
})();
