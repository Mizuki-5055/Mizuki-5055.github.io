(function () {
  'use strict';

  const months = [
    { name: 'REGNIS', days: 31 }, { name: 'MEMENTIS', days: 31 },
    { name: 'LUCIDIS', days: 31 }, { name: 'GELIDIS', days: 31 },
    { name: 'VARMER', days: 30 }, { name: 'DRACCER', days: 30 },
    { name: 'HELARI', days: 29 }, { name: 'NUBILLIS', days: 31 },
    { name: 'FLORRER', days: 30 }, { name: 'VOKSER', days: 30 },
    { name: 'ABRAXI', days: 29 }, { name: 'SOLARI', days: 29 }
  ];
  const weekdays = ['Førstday', 'Nestday', 'Trejday', 'Fjerday', 'Femday', 'Seksday', 'Syvday'];
  const daysPerYear = months.reduce((total, month) => total + month.days, 0);
  const anchorYear = 807;
  const anchorWeekday = 5; // Seksday, Regnis 1st in Year 807.
  const yearInput = document.getElementById('calendar-year');
  const monthSelect = document.getElementById('calendar-month');
  const dayInput = document.getElementById('calendar-day');
  const grid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('calendar-month-title');
  const yearLabel = document.getElementById('calendar-year-label');
  const selectedPanel = document.getElementById('calendar-selected-date');
  if (!yearInput || !monthSelect || !grid || !selectedPanel) return;

  const monthIndexFor = (slug) => months.findIndex((month) => month.name.toLowerCase() === slug);
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = month.name;
    monthSelect.appendChild(option);
  });

  const datedEntries = new Map();
  document.querySelectorAll('.calendar-date-source').forEach((template) => {
    const year = Number(template.dataset.year);
    const monthIndex = monthIndexFor(template.dataset.month);
    const day = Number(template.dataset.day);
    if (!Number.isInteger(year) || year < 1 || monthIndex < 0 || !Number.isInteger(day) || day < 1 || day > months[monthIndex].days) return;
    const key = `${year}-${monthIndex}-${day}`;
    if (!datedEntries.has(key)) datedEntries.set(key, []);
    Array.from(template.content.querySelectorAll('.calendar-source-entry')).forEach((entry) => datedEntries.get(key).push(entry));
  });

  const monthOffsets = [];
  let elapsedDays = 0;
  months.forEach((month) => { monthOffsets.push(elapsedDays); elapsedDays += month.days; });
  const ordinalDay = (monthIndex, day) => monthOffsets[monthIndex] + day;
  const holidays = [];
  document.querySelectorAll('.calendar-holiday-source').forEach((template) => {
    const startMonth = monthIndexFor(template.dataset.month);
    const endMonth = monthIndexFor(template.dataset.endMonth);
    const startDay = Number(template.dataset.day);
    const endDay = Number(template.dataset.endDay);
    if (startMonth < 0 || endMonth < 0 || !Number.isInteger(startDay) || !Number.isInteger(endDay) || startDay < 1 || endDay < 1 || startDay > months[startMonth].days || endDay > months[endMonth].days) return;
    const entry = template.content.querySelector('.calendar-source-entry');
    if (!entry) return;
    holidays.push({ start: ordinalDay(startMonth, startDay), end: ordinalDay(endMonth, endDay), entry });
  });

  function ordinal(value) {
    const mod100 = value % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[value % 10] || 'th');
    return `${value}${suffix}`;
  }
  function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }
  function weekdayFor(year, monthIndex, day) {
    return mod(anchorWeekday + (year - anchorYear) * daysPerYear + ordinalDay(monthIndex, day) - 1, weekdays.length);
  }
  function entriesForDate(year, monthIndex, day) {
    const entries = (datedEntries.get(`${year}-${monthIndex}-${day}`) || []).slice();
    const dayOfYear = ordinalDay(monthIndex, day);
    holidays.forEach((holiday) => {
      const occurs = holiday.start <= holiday.end
        ? dayOfYear >= holiday.start && dayOfYear <= holiday.end
        : dayOfYear >= holiday.start || dayOfYear <= holiday.end;
      if (occurs) entries.push(holiday.entry);
    });
    return entries;
  }
  function textForEntry(entry, selector) {
    return (entry.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function showDate(year, monthIndex, day, weekdayIndex) {
    const entries = entriesForDate(year, monthIndex, day);
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
      article.className = `calendar-full-entry${source.classList.contains('calendar-holiday-entry') ? ' calendar-holiday-entry' : ''}`;
      Array.from(source.children).forEach((child) => article.appendChild(child.cloneNode(true)));
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
    for (let blank = 0; blank < weekdayFor(year, monthIndex, 1); blank += 1) {
      const spacer = document.createElement('div');
      spacer.className = 'calendar-empty';
      spacer.setAttribute('role', 'gridcell');
      spacer.setAttribute('aria-hidden', 'true');
      grid.appendChild(spacer);
    }
    for (let day = 1; day <= months[monthIndex].days; day += 1) {
      const weekdayIndex = weekdayFor(year, monthIndex, day);
      const entries = entriesForDate(year, monthIndex, day);
      const hasHoliday = entries.some((entry) => entry.classList.contains('calendar-holiday-entry'));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `calendar-day${entries.length ? ' has-entries' : ''}${hasHoliday ? ' has-holiday' : ''}`;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `${weekdays[weekdayIndex]}, ${months[monthIndex].name} ${day}, Year ${ordinal(year)}${entries.length ? `, ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : ''}`);
      const number = document.createElement('span');
      number.className = 'calendar-day-number';
      number.textContent = String(day);
      button.appendChild(number);
      if (entries.length) {
        const holidayNames = entries.filter((entry) => entry.classList.contains('calendar-holiday-entry')).map((entry) => textForEntry(entry, 'h4'));
        if (holidayNames.length) {
          const holidayLabel = document.createElement('span');
          holidayLabel.className = 'calendar-holiday-label';
          holidayLabel.textContent = holidayNames.join(', ');
          button.appendChild(holidayLabel);
        }
        const previewSource = entries.find((entry) => textForEntry(entry, '.calendar-source-preview')) || entries[0];
        const preview = document.createElement('span');
        preview.className = 'calendar-day-preview';
        preview.textContent = textForEntry(previewSource, '.calendar-source-preview') || textForEntry(previewSource, '.calendar-source-content') || textForEntry(previewSource, 'h4');
        button.appendChild(preview);
        if (entries.length > 1) {
          const count = document.createElement('span');
          count.className = 'calendar-day-count';
          count.textContent = `${entries.length} entries`;
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
  yearInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') render(); });
  monthSelect.addEventListener('change', render);
  document.getElementById('calendar-prev-month').addEventListener('click', () => {
    let month = Number(monthSelect.value) - 1;
    if (month < 0) { month = months.length - 1; yearInput.value = String(Math.max(1, Number(yearInput.value) - 1)); }
    monthSelect.value = String(month);
    render();
  });
  document.getElementById('calendar-next-month').addEventListener('click', () => {
    let month = Number(monthSelect.value) + 1;
    if (month >= months.length) { month = 0; yearInput.value = String(Number(yearInput.value) + 1); }
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
