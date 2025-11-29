export const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Preorder Applications</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background: #f8fafc; }
    .container { max-width: 1200px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header h1 { margin: 0; }
    .logout-btn { padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
    .logout-btn:hover { background: #333; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; min-width: 150px; }
    .stat-number { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #666; font-size: 0.85rem; margin-top: 5px; }
    .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .card-header h2 { margin: 0; font-size: 1.1rem; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-black { background: #000; color: #fff; }
    .btn-black:hover { background: #333; }
    .btn-group { display: flex; gap: 10px; }
    .tabs { display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
    .tab { padding: 10px 20px; background: none; border: none; cursor: pointer; color: #666; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab.active { color: #000; border-bottom-color: #000; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f8fafc; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .truncate { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .badge-yes { background: #dcfce7; color: #166534; }
    .badge-no { background: #fee2e2; color: #991b1b; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-expired { background: #f3f4f6; color: #666; }
    .empty { text-align: center; padding: 40px; color: #666; }
    .alert { padding: 12px 16px; border-radius: 4px; margin-bottom: 15px; }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }
    .last-updated { font-size: 0.8rem; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Preorder Applications</h1>
      <a href="/admin/logout" class="logout-btn">Logout</a>
    </div>

    <div id="alertContainer"></div>

    <div class="stats">
      <div class="stat">
        <div class="stat-number" id="statSubmissions">-</div>
        <div class="stat-label">Submissions</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="statAddresses">-</div>
        <div class="stat-label">ETH Addresses</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="statRateLimits">-</div>
        <div class="stat-label">Rate Limits</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Records</h2>
        <div class="btn-group">
          <span class="last-updated" id="lastUpdated"></span>
          <button class="btn btn-black" onclick="loadRecords()">Refresh</button>
          <button class="btn btn-black" onclick="exportCSV()">Export CSV</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="switchTab('submissions')">Submissions</button>
        <button class="tab" onclick="switchTab('ratelimits')">Rate Limits</button>
      </div>

      <div id="submissionsTab" class="tab-content active">
        <div id="submissionsContainer"><div class="empty">Loading...</div></div>
      </div>

      <div id="ratelimitsTab" class="tab-content">
        <div id="rateLimitsContainer"><div class="empty">Loading...</div></div>
      </div>
    </div>
  </div>

  <script>
    var currentData = null;
    loadRecords();

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      var div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    function formatDate(iso) {
      if (!iso) return '-';
      return new Date(iso).toLocaleString();
    }

    function showAlert(msg, type) {
      var c = document.getElementById('alertContainer');
      c.innerHTML = '<div class="alert alert-' + type + '">' + escapeHtml(msg) + '</div>';
      setTimeout(function() { c.innerHTML = ''; }, 5000);
    }

    function loadRecords() {
      fetch('/admin/records')
        .then(function(r) { 
          if (!r.ok) throw new Error('Failed'); 
          return r.json(); 
        })
        .then(function(data) {
          currentData = data.data || data;
          updateStats();
          renderSubmissions(currentData.submissions || []);
          renderRateLimits(currentData.rateLimits || []);
          document.getElementById('lastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        })
        .catch(function(e) { showAlert(e.message, 'error'); });
    }

    function updateStats() {
      if (!currentData || !currentData.stats) return;
      document.getElementById('statSubmissions').textContent = currentData.stats.totalSubmissions || 0;
      document.getElementById('statAddresses').textContent = currentData.stats.uniqueEthAddresses || 0;
      document.getElementById('statRateLimits').textContent = currentData.stats.activeRateLimits || 0;
    }

    function switchTab(name) {
      var tabs = document.querySelectorAll('.tab');
      var contents = document.querySelectorAll('.tab-content');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      contents.forEach(function(c) { c.classList.remove('active'); });
      if (name === 'submissions') {
        tabs[0].classList.add('active');
        document.getElementById('submissionsTab').classList.add('active');
      } else {
        tabs[1].classList.add('active');
        document.getElementById('ratelimitsTab').classList.add('active');
      }
    }

    function renderSubmissions(subs) {
      var c = document.getElementById('submissionsContainer');
      if (!subs || !subs.length) {
        c.innerHTML = '<div class="empty">No submissions yet</div>';
        return;
      }
      var h = '<table><thead><tr><th>Time</th><th>Username</th><th>Discord</th><th>ETH</th><th>Curiosity</th><th>Following X</th><th>Discord Member</th><th>IP</th></tr></thead><tbody>';
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        h += '<tr>';
        h += '<td>' + escapeHtml(formatDate(s.timestamp)) + '</td>';
        h += '<td>' + escapeHtml(s.username) + '</td>';
        h += '<td class="mono">' + escapeHtml(s.discordId) + '</td>';
        h += '<td class="mono truncate" title="' + escapeHtml(s.ethAddress) + '">' + escapeHtml(s.ethAddress) + '</td>';
        h += '<td class="truncate" title="' + escapeHtml(s.curiosity || '') + '">' + escapeHtml(String(s.curiosity || '-').split('\\n').join(' ').trim()) + '</td>';
        h += '<td>' + (s.isFollowingX ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">No</span>') + '</td>';
        h += '<td>' + (s.isDiscordMember ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">No</span>') + '</td>';
        h += '<td class="mono">' + escapeHtml(s.ip || 'unknown') + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      c.innerHTML = h;
    }

    function renderRateLimits(limits) {
      var c = document.getElementById('rateLimitsContainer');
      if (!limits || !limits.length) {
        c.innerHTML = '<div class="empty">No rate limits</div>';
        return;
      }
      var h = '<table><thead><tr><th>IP</th><th>Last Submission</th><th>Status</th></tr></thead><tbody>';
      var now = new Date();
      for (var i = 0; i < limits.length; i++) {
        var l = limits[i];
        var last = new Date(l.lastSubmission);
        var hrs = Math.max(0, Math.ceil(24 - (now - last) / 3600000));
        h += '<tr>';
        h += '<td class="mono">' + escapeHtml(l.ip) + '</td>';
        h += '<td>' + escapeHtml(formatDate(l.lastSubmission)) + '</td>';
        h += '<td>' + (hrs > 0 ? '<span class="badge badge-active">' + hrs + 'h left</span>' : '<span class="badge badge-expired">Expired</span>') + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      c.innerHTML = h;
    }

    function exportCSV() {
      if (!currentData || !currentData.submissions || !currentData.submissions.length) {
        showAlert('No data', 'error');
        return;
      }
      var csv = 'timestamp,username,discordId,ethAddress,curiosity,isFollowingX,isDiscordMember,ip\\n';
      for (var i = 0; i < currentData.submissions.length; i++) {
        var s = currentData.submissions[i];
        csv += [
          s.timestamp || '',
          '"' + (s.username || '').replace(/"/g, '""') + '"',
          '"' + (s.discordId || '').replace(/"/g, '""') + '"',
          s.ethAddress || '',
          '"' + (s.curiosity || '').replace(/"/g, '""') + '"',
          s.isFollowingX ? 'true' : 'false',
          s.isDiscordMember ? 'true' : 'false',
          s.ip || 'unknown'
        ].join(',') + '\\n';
      }
      var blob = new Blob([csv], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'submissions-' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showAlert('Exported ' + currentData.submissions.length + ' rows', 'success');
    }

    setInterval(loadRecords, 300000);
  </script>
</body>
</html>`;

export const loginPageHtml = (error?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admin Login</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background: #f8fafc; }
    form { max-width: 320px; margin: auto; padding: 20px; background: white; border-radius: 8px; }
    input { width: 100%; margin-top: 10px; padding: 8px; }
    button { width: 100%; margin-top: 15px; padding: 10px; background: #000; color: #fff; border: none; }
    .error { color: red; margin-bottom: 10px; }
  </style>
</head>
<body>
  <form method="POST" action="/admin/login">
    <h2>Admin Login</h2>
    ${error ? `<div class="error">${error}</div>` : ""}
    <input type="password" name="password" placeholder="Password" required />
    <button type="submit">Login</button>
  </form>
</body>
</html>
`;
