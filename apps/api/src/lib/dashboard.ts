export const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Turing Test Admin</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background: #f8fafc; }
    .container { max-width: 1600px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header h1 { margin: 0; }
    .logout-btn { padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
    .logout-btn:hover { background: #333; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
    .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; min-width: 120px; }
    .stat-number { font-size: 2rem; font-weight: bold; }
    .stat-label { color: #666; font-size: 0.85rem; margin-top: 5px; }
    .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; overflow-x: auto; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
    .card-header h2 { margin: 0; font-size: 1.1rem; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-black { background: #000; color: #fff; }
    .btn-black:hover { background: #333; }
    .btn-black:disabled { background: #ccc; cursor: not-allowed; }
    .btn-group { display: flex; gap: 10px; align-items: center; }
    .tabs { display: flex; gap: 0; margin-bottom: 20px; }
    .tab { padding: 12px 24px; background: #e5e7eb; border: none; cursor: pointer; font-size: 0.9rem; }
    .tab:first-child { border-radius: 8px 0 0 0; }
    .tab:last-child { border-radius: 0 8px 0 0; }
    .tab.active { background: #000; color: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: 600; white-space: nowrap; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f8fafc; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .truncate { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .answer-text { max-width: 400px; white-space: normal; line-height: 1.4; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .badge-yes { background: #dcfce7; color: #166534; }
    .badge-no { background: #fee2e2; color: #991b1b; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-perfect { background: #dbeafe; color: #1e40af; }
    .badge-rover { background: #f3e8ff; color: #7c3aed; }
    .badge-gift { background: #fce7f3; color: #be185d; }
    .empty { text-align: center; padding: 40px; color: #666; }
    .alert { padding: 12px 16px; border-radius: 4px; margin-bottom: 15px; }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }
    .last-updated { font-size: 0.8rem; color: #999; }
    .pagination { display: flex; gap: 10px; align-items: center; justify-content: center; margin-top: 20px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Turing Test Admin</h1>
      <a href="/admin/logout" class="logout-btn">Logout</a>
    </div>

    <div id="alertContainer"></div>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('submissions')">Form Submissions</button>
      <button class="tab" onclick="switchTab('gifts')">Gift Submissions</button>
      <button class="tab" onclick="switchTab('answers')">Answers Pool</button>
    </div>

    <!-- Form Submissions Tab -->
    <div id="submissionsTab">
      <div class="stats">
        <div class="stat">
          <div class="stat-number" id="statSubmissions">-</div>
          <div class="stat-label">Total Registered</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="statPlayed">-</div>
          <div class="stat-label">Played</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="statPassed">-</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="statFailed">-</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
          <div class="stat-number" id="statPending">-</div>
          <div class="stat-label">Not Played</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Form Records</h2>
          <div class="btn-group">
            <span class="last-updated" id="lastUpdated"></span>
            <button class="btn btn-black" onclick="loadRecords(1)">Refresh</button>
            <button class="btn btn-black" onclick="exportCSV()">Export CSV</button>
          </div>
        </div>

        <div id="submissionsContainer"><div class="empty">Loading...</div></div>
        <div class="pagination" id="paginationContainer"></div>
      </div>
    </div>

    <!-- Gift Submissions Tab -->
    <div id="giftsTab" class="hidden">
      <div class="stats">
        <div class="stat">
          <div class="stat-number" id="statGiftTotal">-</div>
          <div class="stat-label">Total Gifts</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Gift Records</h2>
          <div class="btn-group">
            <span class="last-updated" id="giftLastUpdated"></span>
            <button class="btn btn-black" onclick="loadGiftRecords(1)">Refresh</button>
            <button class="btn btn-black" onclick="exportGiftCSV()">Export CSV</button>
          </div>
        </div>

        <div id="giftContainer"><div class="empty">Loading...</div></div>
        <div class="pagination" id="giftPaginationContainer"></div>
      </div>
    </div>

    <!-- Answers Pool Tab -->
    <div id="answersTab" class="hidden">
      <div class="stats">
        <div class="stat">
          <div class="stat-number" id="statAnswersTotal">-</div>
          <div class="stat-label">Total Answers</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Answer Pool Records</h2>
          <div class="btn-group">
            <span class="last-updated" id="answersLastUpdated"></span>
            <button class="btn btn-black" onclick="loadAnswerRecords(1)">Refresh</button>
            <button class="btn btn-black" onclick="exportAnswersCSV()">Export CSV</button>
          </div>
        </div>

        <div id="answersContainer"><div class="empty">Loading...</div></div>
        <div class="pagination" id="answersPaginationContainer"></div>
      </div>
    </div>
  </div>

  <script>
    var currentData = null;
    var currentGiftData = null;
    var currentAnswersData = null;
    var currentPage = 1;
    var currentGiftPage = 1;
    var currentAnswersPage = 1;
    var activeTab = 'submissions';
    
    loadRecords(1);

    function switchTab(tab) {
      activeTab = tab;
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      
      if (tab === 'submissions') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('submissionsTab').classList.remove('hidden');
        document.getElementById('giftsTab').classList.add('hidden');
        document.getElementById('answersTab').classList.add('hidden');
      } else if (tab === 'gifts') {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('submissionsTab').classList.add('hidden');
        document.getElementById('giftsTab').classList.remove('hidden');
        document.getElementById('answersTab').classList.add('hidden');
        if (!currentGiftData) loadGiftRecords(1);
      } else if (tab === 'answers') {
        document.querySelectorAll('.tab')[2].classList.add('active');
        document.getElementById('submissionsTab').classList.add('hidden');
        document.getElementById('giftsTab').classList.add('hidden');
        document.getElementById('answersTab').classList.remove('hidden');
        if (!currentAnswersData) loadAnswerRecords(1);
      }
    }

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

    // Form Submissions
    function loadRecords(page) {
      currentPage = page;
      fetch('/admin/records?page=' + page + '&limit=50')
        .then(function(r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
        .then(function(data) {
          currentData = data.data || data;
          updateStats();
          renderSubmissions(currentData.submissions || []);
          renderPagination(currentData.pagination);
          document.getElementById('lastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        })
        .catch(function(e) { showAlert(e.message, 'error'); });
    }

    function updateStats() {
      if (!currentData || !currentData.stats) return;
      var stats = currentData.stats;
      document.getElementById('statSubmissions').textContent = stats.totalSubmissions || 0;
      document.getElementById('statPlayed').textContent = stats.totalPlayed || 0;
      document.getElementById('statPassed').textContent = stats.totalPassed || 0;
      document.getElementById('statFailed').textContent = stats.totalFailed || 0;
      document.getElementById('statPending').textContent = (stats.totalSubmissions - stats.totalPlayed) || 0;
    }

    function renderSubmissions(subs) {
      var c = document.getElementById('submissionsContainer');
      if (!subs || !subs.length) {
        c.innerHTML = '<div class="empty">No submissions yet</div>';
        return;
      }
      var h = '<table><thead><tr>';
      h += '<th>Time</th><th>Wallet</th><th>Rover</th><th>X Handle</th><th>Discord</th>';
      h += '<th>Following X</th><th>Joined Discord</th><th>Game</th><th>Score</th><th>IP</th>';
      h += '</tr></thead><tbody>';
      
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        var gameStatus = '<span class="badge badge-pending">Not Played</span>';
        var score = '-';
        
        if (s.hasPlayed) {
          score = (s.correctAnswers || 0) + '/3';
          if (s.correctAnswers === 3) {
            gameStatus = '<span class="badge badge-perfect">PERFECT</span>';
          } else if (s.correctAnswers >= 2) {
            gameStatus = '<span class="badge badge-yes">PASS</span>';
          } else {
            gameStatus = '<span class="badge badge-no">FAIL</span>';
          }
        }

        var roverBadge = s.isRoverHolder 
          ? '<span class="badge badge-rover">🚀 Rover</span>' 
          : '<span style="color:#ccc;">-</span>';
        
        h += '<tr>';
        h += '<td>' + escapeHtml(formatDate(s.timestamp)) + '</td>';
        h += '<td class="mono truncate" title="' + escapeHtml(s.ethAddress) + '">' + escapeHtml(s.ethAddress) + '</td>';
        h += '<td>' + roverBadge + '</td>';
        h += '<td>' + escapeHtml(s.xHandleOriginal || s.xHandle || '-') + '</td>';
        h += '<td>' + escapeHtml(s.discordUsername || '-') + '</td>';
        h += '<td>' + (s.followingX ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">No</span>') + '</td>';
        h += '<td>' + (s.joinedDiscord ? '<span class="badge badge-yes">Yes</span>' : '<span class="badge badge-no">No</span>') + '</td>';
        h += '<td>' + gameStatus + '</td>';
        h += '<td>' + score + '</td>';
        h += '<td class="mono">' + escapeHtml(s.ip || '-') + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      c.innerHTML = h;
    }

    function renderPagination(pagination) {
      var c = document.getElementById('paginationContainer');
      if (!pagination) { c.innerHTML = ''; return; }
      var h = '';
      h += '<button class="btn btn-black" onclick="loadRecords(' + (pagination.page - 1) + ')" ' + (pagination.page <= 1 ? 'disabled' : '') + '>← Prev</button>';
      h += '<span>Page ' + pagination.page + ' of ' + pagination.totalPages + '</span>';
      h += '<button class="btn btn-black" onclick="loadRecords(' + (pagination.page + 1) + ')" ' + (!pagination.hasMore ? 'disabled' : '') + '>Next →</button>';
      c.innerHTML = h;
    }

    function exportCSV() {
      showAlert('Fetching all data...', 'success');
      fetchAllPages('/admin/records', 1, []).then(function(allData) {
        if (!allData.length) { showAlert('No data', 'error'); return; }
        var csv = 'timestamp,wallet,isRoverHolder,xHandle,discord,followingX,joinedDiscord,hasPlayed,testStatus,score,ip\\n';
        for (var i = 0; i < allData.length; i++) {
          var s = allData[i];
          csv += [
            s.timestamp || '',
            s.ethAddress || '',
            s.isRoverHolder ? 'true' : 'false',
            '"' + (s.xHandleOriginal || s.xHandle || '').replace(/"/g, '""') + '"',
            '"' + (s.discordUsername || '').replace(/"/g, '""') + '"',
            s.followingX ? 'true' : 'false',
            s.joinedDiscord ? 'true' : 'false',
            s.hasPlayed ? 'true' : 'false',
            s.testStatus || '',
            s.correctAnswers || 0,
            s.ip || ''
          ].join(',') + '\\n';
        }
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'turing-submissions-' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        showAlert('Exported ' + allData.length + ' rows', 'success');
      });
    }

    // Gift Submissions
    function loadGiftRecords(page) {
      currentGiftPage = page;
      fetch('/admin/gift-records?page=' + page + '&limit=50')
        .then(function(r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
        .then(function(data) {
          currentGiftData = data.data || data;
          updateGiftStats();
          renderGiftSubmissions(currentGiftData.submissions || []);
          renderGiftPagination(currentGiftData.pagination);
          document.getElementById('giftLastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        })
        .catch(function(e) { showAlert(e.message, 'error'); });
    }

    function updateGiftStats() {
      if (!currentGiftData || !currentGiftData.stats) return;
      document.getElementById('statGiftTotal').textContent = currentGiftData.stats.totalSubmissions || 0;
    }

    function renderGiftSubmissions(subs) {
      var c = document.getElementById('giftContainer');
      if (!subs || !subs.length) {
        c.innerHTML = '<div class="empty">No gift submissions yet</div>';
        return;
      }
      var h = '<table><thead><tr>';
      h += '<th>Time</th><th>Giver Wallet</th><th>Recipient Wallet</th><th>Recipient X</th>';
      h += '</tr></thead><tbody>';
      
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        h += '<tr>';
        h += '<td>' + escapeHtml(formatDate(s.timestamp)) + '</td>';
        h += '<td class="mono truncate" title="' + escapeHtml(s.giverAddress) + '">' + escapeHtml(s.giverAddress) + '</td>';
        h += '<td class="mono truncate" title="' + escapeHtml(s.recipientAddress) + '">' + escapeHtml(s.recipientAddress) + '</td>';
        h += '<td>' + escapeHtml(s.recipientXUsernameOriginal || s.recipientXUsername || '-') + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      c.innerHTML = h;
    }

    function renderGiftPagination(pagination) {
      var c = document.getElementById('giftPaginationContainer');
      if (!pagination) { c.innerHTML = ''; return; }
      var h = '';
      h += '<button class="btn btn-black" onclick="loadGiftRecords(' + (pagination.page - 1) + ')" ' + (pagination.page <= 1 ? 'disabled' : '') + '>← Prev</button>';
      h += '<span>Page ' + pagination.page + ' of ' + pagination.totalPages + '</span>';
      h += '<button class="btn btn-black" onclick="loadGiftRecords(' + (pagination.page + 1) + ')" ' + (!pagination.hasMore ? 'disabled' : '') + '>Next →</button>';
      c.innerHTML = h;
    }

    function exportGiftCSV() {
      showAlert('Fetching all gift data...', 'success');
      fetchAllPages('/admin/gift-records', 1, []).then(function(allData) {
        if (!allData.length) { showAlert('No data', 'error'); return; }
        var csv = 'timestamp,giverAddress,recipientAddress,recipientXUsername\\n';
        for (var i = 0; i < allData.length; i++) {
          var s = allData[i];
          csv += [
            s.timestamp || '',
            s.giverAddress || '',
            s.recipientAddress || '',
            '"' + (s.recipientXUsernameOriginal || s.recipientXUsername || '').replace(/"/g, '""') + '"'
          ].join(',') + '\\n';
        }
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gift-submissions-' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        showAlert('Exported ' + allData.length + ' rows', 'success');
      });
    }

    // Answers Pool
    function loadAnswerRecords(page) {
      currentAnswersPage = page;
      fetch('/admin/answer-records?page=' + page + '&limit=50')
        .then(function(r) { if (!r.ok) throw new Error('Failed'); return r.json(); })
        .then(function(data) {
          currentAnswersData = data.data || data;
          updateAnswersStats();
          renderAnswers(currentAnswersData.answers || []);
          renderAnswersPagination(currentAnswersData.pagination);
          document.getElementById('answersLastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        })
        .catch(function(e) { showAlert(e.message, 'error'); });
    }

    function updateAnswersStats() {
      if (!currentAnswersData || !currentAnswersData.stats) return;
      document.getElementById('statAnswersTotal').textContent = currentAnswersData.stats.totalAnswers || 0;
    }

    function renderAnswers(answers) {
      var c = document.getElementById('answersContainer');
      if (!answers || !answers.length) {
        c.innerHTML = '<div class="empty">No answers yet</div>';
        return;
      }
      var h = '<table><thead><tr>';
      h += '<th>Time</th><th>Wallet</th><th>Rover</th><th>Answer</th><th>Times Shown</th><th>Trick Points</th>';
      h += '</tr></thead><tbody>';
      
      for (var i = 0; i < answers.length; i++) {
        var a = answers[i];
        var roverBadge = a.isRoverHolder 
          ? '<span class="badge badge-rover">🚀</span>' 
          : '<span style="color:#ccc;">-</span>';
        
        h += '<tr>';
        h += '<td>' + escapeHtml(formatDate(a.createdAt)) + '</td>';
        h += '<td class="mono truncate" title="' + escapeHtml(a.ethAddress) + '">' + escapeHtml(a.ethAddress) + '</td>';
        h += '<td>' + roverBadge + '</td>';
        h += '<td class="answer-text">' + escapeHtml(a.answer || '') + '</td>';
        h += '<td>' + (a.timesShown || 0) + '</td>';
        h += '<td>' + (a.trickPoints || 0) + '</td>';
        h += '</tr>';
      }
      h += '</tbody></table>';
      c.innerHTML = h;
    }

    function renderAnswersPagination(pagination) {
      var c = document.getElementById('answersPaginationContainer');
      if (!pagination) { c.innerHTML = ''; return; }
      var h = '';
      h += '<button class="btn btn-black" onclick="loadAnswerRecords(' + (pagination.page - 1) + ')" ' + (pagination.page <= 1 ? 'disabled' : '') + '>← Prev</button>';
      h += '<span>Page ' + pagination.page + ' of ' + pagination.totalPages + '</span>';
      h += '<button class="btn btn-black" onclick="loadAnswerRecords(' + (pagination.page + 1) + ')" ' + (!pagination.hasMore ? 'disabled' : '') + '>Next →</button>';
      c.innerHTML = h;
    }

    function exportAnswersCSV() {
      showAlert('Fetching all answer data...', 'success');
      fetchAllPages('/admin/answer-records', 1, []).then(function(allData) {
        if (!allData.length) { showAlert('No data', 'error'); return; }
        var csv = 'timestamp,wallet,isRoverHolder,answer,timesShown,trickPoints\\n';
        for (var i = 0; i < allData.length; i++) {
          var a = allData[i];
          csv += [
            a.createdAt || '',
            a.ethAddress || '',
            a.isRoverHolder ? 'true' : 'false',
            '"' + (a.answer || '').replace(/"/g, '""') + '"',
            a.timesShown || 0,
            a.trickPoints || 0
          ].join(',') + '\\n';
        }
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'answer-pool-' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        showAlert('Exported ' + allData.length + ' rows', 'success');
      });
    }

    // Shared fetch helper
    function fetchAllPages(endpoint, page, accumulated) {
      return fetch(endpoint + '?page=' + page + '&limit=100')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var d = data.data || data;
          var all = accumulated.concat(d.submissions || d.answers || []);
          if (d.pagination && d.pagination.hasMore) return fetchAllPages(endpoint, page + 1, all);
          return all;
        });
    }
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
