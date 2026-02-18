/**
 * CodeChronicle Dashboard
 * Visualizes codebase growth over time with Chart.js
 */

// Category colors (consistent theme)
const COLORS = {
  frontend: '#3B82F6',     // blue-500
  backend: '#10B981',      // emerald-500
  scripts: '#F59E0B',      // amber-500
  processing: '#8B5CF6',   // violet-500
  tests: '#EC4899',        // pink-500
  docs: '#06B6D4',         // cyan-500
  cicd: '#6366F1',         // indigo-500
  claudePlans: '#14B8A6',  // teal-500
  codeChronicle: '#F97316' // orange-500
};

// Category display names
const CATEGORY_NAMES = {
  frontend: 'Frontend',
  backend: 'Backend',
  scripts: 'Scripts',
  processing: 'Processing',
  tests: 'Tests',
  docs: 'Docs',
  cicd: 'CI/CD',
  claudePlans: 'Claude Plans',
  codeChronicle: 'CodeChronicle'
};

let data = null;
let timeSeriesChart = null;
let growthChart = null;
let categoryChart = null;
let growthView = 'daily';
let timeSeriesView = 'daily';

/**
 * Get all dates between start and end (inclusive)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string[]} Array of dates
 */
function getAllDatesBetween(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Fill in missing days in data with values from previous day
 * @param {Object} daysData - The data.days object
 * @returns {Object} Filled days data with all dates
 */
function fillMissingDays(daysData) {
  const existingDays = Object.keys(daysData).sort();
  if (existingDays.length === 0) return daysData;

  const firstDate = existingDays[0];
  const lastDate = existingDays[existingDays.length - 1];
  const allDates = getAllDatesBetween(firstDate, lastDate);

  const filledData = {};
  let lastKnownData = null;

  for (const date of allDates) {
    if (daysData[date]) {
      filledData[date] = daysData[date];
      lastKnownData = daysData[date];
    } else if (lastKnownData) {
      // Carry forward the previous day's data
      filledData[date] = { ...lastKnownData };
    }
  }

  return filledData;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Load snapshot data
 */
async function loadData() {
  try {
    const response = await fetch('/data/snapshots.json');
    if (!response.ok) {
      throw new Error('No data found. Run "npm run collect" first.');
    }
    data = await response.json();

    // Fill in missing days so chart shows continuous timeline
    data.days = fillMissingDays(data.days);

    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

/**
 * Show error message
 */
function showError(message) {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div class="error-message">
      <p class="text-lg font-semibold mb-2">Unable to load data</p>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Update stats cards
 */
function updateStatsCards() {
  const days = Object.keys(data.days);
  if (days.length === 0) return;

  const latestDay = data.days[days[days.length - 1]];
  const firstDay = data.days[days[0]];

  // Calculate totals
  const totalLines = Object.values(latestDay.totals).reduce((a, b) => a + b, 0);
  const totalFiles = Object.values(latestDay.fileCount).reduce((a, b) => a + b, 0);
  const firstDayLines = Object.values(firstDay.totals).reduce((a, b) => a + b, 0);
  const avgGrowth = Math.round((totalLines - firstDayLines) / days.length);

  document.getElementById('stat-total-lines').textContent = formatNumber(totalLines);
  document.getElementById('stat-total-files').textContent = formatNumber(totalFiles);
  document.getElementById('stat-days').textContent = days.length;
  document.getElementById('stat-avg-growth').textContent = `+${formatNumber(avgGrowth)}`;

  // Update last updated
  if (data.generatedAt) {
    const date = new Date(data.generatedAt);
    document.getElementById('last-updated').textContent =
      `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
}

/**
 * Aggregate time series data by view type
 */
function aggregateTimeSeriesData(view) {
  const days = Object.keys(data.days);
  const categories = Object.keys(COLORS);

  if (view === 'daily') {
    return {
      labels: days,
      categoryData: categories.reduce((acc, category) => {
        acc[category] = days.map(day => data.days[day].totals[category] || 0);
        return acc;
      }, {})
    };
  }

  // For weekly/monthly, aggregate by taking the last value in each period
  const aggregated = { labels: [], categoryData: {} };
  categories.forEach(c => aggregated.categoryData[c] = []);

  if (view === 'weekly') {
    let weekStart = null;
    let lastDayInWeek = null;

    for (let i = 0; i < days.length; i++) {
      const dayOfWeek = new Date(days[i]).getDay();

      if (weekStart === null) {
        weekStart = days[i];
      }
      lastDayInWeek = days[i];

      // Sunday (0) marks end of week, or last day
      if (dayOfWeek === 0 || i === days.length - 1) {
        aggregated.labels.push(weekStart);
        categories.forEach(category => {
          aggregated.categoryData[category].push(data.days[lastDayInWeek].totals[category] || 0);
        });
        weekStart = null;
      }
    }
  } else {
    // Monthly aggregation
    let currentMonth = null;
    let monthLabel = null;
    let lastDayInMonth = null;

    for (let i = 0; i < days.length; i++) {
      const date = new Date(days[i]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (currentMonth === null) {
        currentMonth = monthKey;
        monthLabel = days[i];
      }
      lastDayInMonth = days[i];

      // Check if month changed or last day
      const nextDate = i < days.length - 1 ? new Date(days[i + 1]) : null;
      const nextMonthKey = nextDate ? `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}` : null;

      if (nextMonthKey !== currentMonth || i === days.length - 1) {
        aggregated.labels.push(monthLabel);
        categories.forEach(category => {
          aggregated.categoryData[category].push(data.days[lastDayInMonth].totals[category] || 0);
        });
        currentMonth = nextMonthKey;
        monthLabel = i < days.length - 1 ? days[i + 1] : null;
      }
    }
  }

  return aggregated;
}

/**
 * Create or update time series chart (stacked area)
 */
function updateTimeSeriesChart(view) {
  const ctx = document.getElementById('timeSeriesChart').getContext('2d');
  const categories = Object.keys(COLORS);
  const { labels, categoryData } = aggregateTimeSeriesData(view);

  const datasets = categories.map(category => ({
    label: CATEGORY_NAMES[category],
    data: categoryData[category],
    backgroundColor: COLORS[category] + '60',
    borderColor: COLORS[category],
    borderWidth: 1,
    fill: true,
    tension: 0.3
  }));

  if (timeSeriesChart) {
    timeSeriesChart.destroy();
  }

  timeSeriesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          grid: { color: '#374151' },
          ticks: { color: '#9CA3AF' }
        },
        y: {
          stacked: true,
          grid: { color: '#374151' },
          ticks: {
            color: '#9CA3AF',
            callback: value => formatNumber(value)
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#E5E7EB' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatNumber(ctx.raw)} lines`
          }
        }
      }
    }
  });
}

/**
 * Create time series chart (stacked area)
 */
function createTimeSeriesChart() {
  updateTimeSeriesChart('daily');
}

/**
 * Create growth rate chart
 */
function createGrowthChart() {
  const ctx = document.getElementById('growthChart').getContext('2d');
  updateGrowthChart(ctx, 'daily');
}

/**
 * Update growth chart with daily, weekly, or monthly view
 */
function updateGrowthChart(ctx, view) {
  const days = Object.keys(data.days);

  let labels = [];
  let values = [];

  if (view === 'daily') {
    for (let i = 1; i < days.length; i++) {
      const prevTotal = Object.values(data.days[days[i - 1]].totals).reduce((a, b) => a + b, 0);
      const currTotal = Object.values(data.days[days[i]].totals).reduce((a, b) => a + b, 0);
      labels.push(days[i]);
      values.push(currTotal - prevTotal);
    }
  } else if (view === 'weekly') {
    // Weekly aggregation
    let weekStart = null;
    let prevTotal = Object.values(data.days[days[0]].totals).reduce((a, b) => a + b, 0);

    for (let i = 1; i < days.length; i++) {
      const dayOfWeek = new Date(days[i]).getDay();
      const currTotal = Object.values(data.days[days[i]].totals).reduce((a, b) => a + b, 0);

      if (weekStart === null) {
        weekStart = days[i];
      }

      if (dayOfWeek === 0 || i === days.length - 1) {
        labels.push(weekStart);
        values.push(currTotal - prevTotal);
        weekStart = null;
        prevTotal = currTotal;
      }
    }
  } else {
    // Monthly aggregation
    let currentMonth = null;
    let monthLabel = null;
    let prevTotal = Object.values(data.days[days[0]].totals).reduce((a, b) => a + b, 0);

    for (let i = 1; i < days.length; i++) {
      const date = new Date(days[i]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currTotal = Object.values(data.days[days[i]].totals).reduce((a, b) => a + b, 0);

      if (currentMonth === null) {
        currentMonth = monthKey;
        monthLabel = days[i];
      }

      // Check if month changed or last day
      if (monthKey !== currentMonth || i === days.length - 1) {
        labels.push(monthLabel);
        values.push(currTotal - prevTotal);
        currentMonth = monthKey;
        monthLabel = days[i];
        prevTotal = currTotal;
      }
    }
  }

  if (growthChart) {
    growthChart.destroy();
  }

  growthChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: view === 'daily' ? 'Lines added per day' : view === 'weekly' ? 'Lines added per week' : 'Lines added per month',
        data: values,
        backgroundColor: values.map(v => v >= 0 ? '#34D39960' : '#F8717160'),
        borderColor: values.map(v => v >= 0 ? '#34D399' : '#F87171'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: '#374151' },
          ticks: { color: '#9CA3AF', maxRotation: 45 }
        },
        y: {
          grid: { color: '#374151' },
          ticks: {
            color: '#9CA3AF',
            callback: value => (value >= 0 ? '+' : '') + formatNumber(value)
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.raw;
              return (val >= 0 ? '+' : '') + formatNumber(val) + ' lines';
            }
          }
        }
      }
    }
  });
}

/**
 * Create category breakdown chart (donut)
 */
function createCategoryChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const days = Object.keys(data.days);
  const latestDay = data.days[days[days.length - 1]];
  const categories = Object.keys(COLORS);

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => CATEGORY_NAMES[c]),
      datasets: [{
        data: categories.map(c => latestDay.totals[c] || 0),
        backgroundColor: categories.map(c => COLORS[c]),
        borderColor: '#1F2937',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#E5E7EB' }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatNumber(ctx.raw)} lines`
          }
        }
      }
    }
  });
}

/**
 * Populate category details table
 */
function populateCategoryTable() {
  const tbody = document.getElementById('category-table');
  const days = Object.keys(data.days);
  const latestDay = data.days[days[days.length - 1]];
  const categories = Object.keys(COLORS);

  const totalLines = Object.values(latestDay.totals).reduce((a, b) => a + b, 0);

  // Sort by lines descending
  const sorted = categories
    .map(c => ({
      category: c,
      lines: latestDay.totals[c] || 0,
      files: latestDay.fileCount[c] || 0
    }))
    .sort((a, b) => b.lines - a.lines);

  tbody.innerHTML = sorted.map(({ category, lines, files }) => {
    const avgPerFile = files > 0 ? Math.round(lines / files) : 0;
    const percent = totalLines > 0 ? ((lines / totalLines) * 100).toFixed(1) : '0.0';

    return `
      <tr class="border-b border-gray-700">
        <td class="py-3 px-4">
          <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${COLORS[category]}"></span>
          ${CATEGORY_NAMES[category]}
        </td>
        <td class="py-3 px-4 text-right font-mono">${formatNumber(lines)}</td>
        <td class="py-3 px-4 text-right font-mono">${formatNumber(files)}</td>
        <td class="py-3 px-4 text-right font-mono">${formatNumber(avgPerFile)}</td>
        <td class="py-3 px-4 text-right font-mono">${percent}%</td>
      </tr>
    `;
  }).join('');
}

/**
 * Set up comparison view
 */
function setupComparisonView() {
  const days = Object.keys(data.days);
  const fromInput = document.getElementById('compare-from');
  const toInput = document.getElementById('compare-to');
  const btn = document.getElementById('compare-btn');

  // Set default values (first and last day)
  fromInput.value = days[0];
  toInput.value = days[days.length - 1];
  fromInput.min = days[0];
  fromInput.max = days[days.length - 1];
  toInput.min = days[0];
  toInput.max = days[days.length - 1];

  // Initial comparison
  runComparison();

  btn.addEventListener('click', runComparison);
}

/**
 * Run date comparison
 */
function runComparison() {
  const fromDate = document.getElementById('compare-from').value;
  const toDate = document.getElementById('compare-to').value;
  const resultsDiv = document.getElementById('comparison-results');

  if (!data.days[fromDate] || !data.days[toDate]) {
    resultsDiv.innerHTML = '<p class="text-gray-400 col-span-full">Select valid dates</p>';
    return;
  }

  const fromDay = data.days[fromDate];
  const toDay = data.days[toDate];
  const categories = Object.keys(COLORS);

  resultsDiv.innerHTML = categories.map(category => {
    const fromLines = fromDay.totals[category] || 0;
    const toLines = toDay.totals[category] || 0;
    const delta = toLines - fromLines;
    const deltaClass = delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : 'delta-neutral';
    const deltaText = delta >= 0 ? `+${formatNumber(delta)}` : formatNumber(delta);

    return `
      <div class="comparison-card bg-gray-700 rounded-lg p-3 text-center">
        <div class="text-xs text-gray-400 mb-1">${CATEGORY_NAMES[category]}</div>
        <div class="text-lg font-bold ${deltaClass}">${deltaText}</div>
        <div class="text-xs text-gray-500">${formatNumber(fromLines)} → ${formatNumber(toLines)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Set up growth view toggle
 */
function setupGrowthToggle() {
  const dailyBtn = document.getElementById('view-daily');
  const weeklyBtn = document.getElementById('view-weekly');
  const monthlyBtn = document.getElementById('view-monthly');
  const ctx = document.getElementById('growthChart').getContext('2d');

  const activeClass = 'px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition';
  const inactiveClass = 'px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition';

  dailyBtn.addEventListener('click', () => {
    dailyBtn.className = activeClass;
    weeklyBtn.className = inactiveClass;
    monthlyBtn.className = inactiveClass;
    updateGrowthChart(ctx, 'daily');
  });

  weeklyBtn.addEventListener('click', () => {
    dailyBtn.className = inactiveClass;
    weeklyBtn.className = activeClass;
    monthlyBtn.className = inactiveClass;
    updateGrowthChart(ctx, 'weekly');
  });

  monthlyBtn.addEventListener('click', () => {
    dailyBtn.className = inactiveClass;
    weeklyBtn.className = inactiveClass;
    monthlyBtn.className = activeClass;
    updateGrowthChart(ctx, 'monthly');
  });
}

/**
 * Set up time series view toggle
 */
function setupTimeSeriesToggle() {
  const dailyBtn = document.getElementById('ts-view-daily');
  const weeklyBtn = document.getElementById('ts-view-weekly');
  const monthlyBtn = document.getElementById('ts-view-monthly');

  const activeClass = 'px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition';
  const inactiveClass = 'px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition';

  dailyBtn.addEventListener('click', () => {
    dailyBtn.className = activeClass;
    weeklyBtn.className = inactiveClass;
    monthlyBtn.className = inactiveClass;
    updateTimeSeriesChart('daily');
  });

  weeklyBtn.addEventListener('click', () => {
    dailyBtn.className = inactiveClass;
    weeklyBtn.className = activeClass;
    monthlyBtn.className = inactiveClass;
    updateTimeSeriesChart('weekly');
  });

  monthlyBtn.addEventListener('click', () => {
    dailyBtn.className = inactiveClass;
    weeklyBtn.className = inactiveClass;
    monthlyBtn.className = activeClass;
    updateTimeSeriesChart('monthly');
  });
}

/**
 * Initialize dashboard
 */
async function init() {
  try {
    await loadData();

    if (Object.keys(data.days).length === 0) {
      showError('No data available. Run "npm run collect" to gather codebase stats.');
      return;
    }

    updateStatsCards();
    createTimeSeriesChart();
    createGrowthChart();
    createCategoryChart();
    populateCategoryTable();
    setupComparisonView();
    setupGrowthToggle();
    setupTimeSeriesToggle();

  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

// Start the app
init();
