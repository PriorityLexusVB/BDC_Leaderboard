async function loadLeaderboard() {
  const res = await fetch('/api/leaderboard');
  const data = await res.json();
  const tbody = document.querySelector('#leaderboard tbody');
  tbody.innerHTML = '';
  data.leaderboard.forEach((agent) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${agent.firstName} ${agent.lastName}</td><td>${agent.totalPoints}</td>`;
    tr.addEventListener('click', () => loadAgent(agent.id));
    tbody.appendChild(tr);
  });
}

async function loadAgent(agentId) {
  const res = await fetch(`/api/agents/${agentId}/dashboard`);
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
}

loadLeaderboard();
