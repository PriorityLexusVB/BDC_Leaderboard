const errorContainer = document.getElementById('error');

function showError(message) {
  if (errorContainer) {
    errorContainer.textContent = message;
  }
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = '';
    data.leaderboard.forEach((agent) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${agent.firstName} ${agent.lastName}</td><td>${agent.totalPoints}</td>`;
      tr.addEventListener('click', () => loadAgent(agent.id));
      tbody.appendChild(tr);
    });
    if (errorContainer) errorContainer.textContent = '';
  } catch (err) {
    showError('Error loading leaderboard');
  }
}

async function loadAgent(agentId) {
  try {
    const res = await fetch(`/api/agents/${agentId}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch agent');
    const data = await res.json();
    const container = document.getElementById('agent-details');
    const calls = data.calls
      .map((c) => `<li>${c.externalId}: ${c.points}</li>`)
      .join('');
    container.innerHTML = `
      <h3>${data.agent.firstName} ${data.agent.lastName}</h3>
      <p>Total Points: ${data.agent.totalPoints}</p>
      <ul>${calls}</ul>
    `;
    if (errorContainer) errorContainer.textContent = '';
  } catch (err) {
    showError('Error loading agent details');
  }
}

loadLeaderboard();
setInterval(loadLeaderboard, 60000);
