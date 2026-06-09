document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & Views ---
    const navChat = document.getElementById('navChat');
    const navTables = document.getElementById('navTables');
    const chatView = document.getElementById('chatView');
    const tablesView = document.getElementById('tablesView');
    const pageTitle = document.getElementById('pageTitle');

    navChat.addEventListener('click', (e) => {
        e.preventDefault();
        navChat.classList.add('active');
        navTables.classList.remove('active');
        chatView.style.display = 'block';
        tablesView.style.display = 'none';
        pageTitle.textContent = 'Agent Chat';
        scrollToBottom();
    });

    navTables.addEventListener('click', (e) => {
        e.preventDefault();
        navTables.classList.add('active');
        navChat.classList.remove('active');
        tablesView.style.display = 'block';
        chatView.style.display = 'none';
        pageTitle.textContent = 'Database Tables';
        fetchTables();
    });

    // --- Chat Logic ---
    const chatHistory = document.getElementById('chatHistory');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.value.trim() === '') {
            sendBtn.disabled = true;
        } else {
            sendBtn.disabled = false;
        }
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;

        const loadingId = showLoading(chatHistory);

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            removeLoading(loadingId);
            if(data.error) {
                appendMessage(`Error: ${data.error}`, 'agent');
            } else {
                appendHtmlMessage(data.response, 'agent');
            }
        })
        .catch(error => {
            removeLoading(loadingId);
            appendMessage(`Connection Error: Server might be down.`, 'agent');
        });
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        const avatarIcon = sender === 'agent' ? 'fa-robot' : 'fa-user';
        
        msgDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
            <div class="message-content"><p>${escapeHtml(text)}</p></div>
        `;
        chatHistory.appendChild(msgDiv);
        scrollToBottom();
    }

    function appendHtmlMessage(html, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        const avatarIcon = sender === 'agent' ? 'fa-robot' : 'fa-user';
        
        msgDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
            <div class="message-content">${html}</div>
        `;
        
        // Add export buttons to any tables that were generated
        injectExportButtons(msgDiv);
        
        chatHistory.appendChild(msgDiv);
        scrollToBottom();
    }

    // --- View Tables Logic ---
    const refreshTablesBtn = document.getElementById('refreshTablesBtn');
    const tablesLoading = document.getElementById('tablesLoading');
    const tablesContainer = document.getElementById('tablesContainer');
    let tablesFetched = false;

    refreshTablesBtn.addEventListener('click', () => {
        tablesFetched = false;
        fetchTables();
    });

    function fetchTables() {
        if (tablesFetched) return;
        
        tablesContainer.innerHTML = '';
        tablesLoading.style.display = 'flex';
        
        fetch('/api/tables')
        .then(res => res.json())
        .then(data => {
            tablesLoading.style.display = 'none';
            if (data.error) {
                tablesContainer.innerHTML = `<div class="error-msg">Error loading tables: ${data.error}</div>`;
                return;
            }
            
            if (data.tables.length === 0) {
                tablesContainer.innerHTML = `<div class="info-msg">No tables found in the database.</div>`;
                return;
            }

            data.tables.forEach(table => {
                const tableCard = document.createElement('div');
                tableCard.className = 'table-card';
                tableCard.innerHTML = `
                    <h3><i class="fa-solid fa-table"></i> ${escapeHtml(table.table_name)}</h3>
                    <div class="table-wrapper">${table.html_data}</div>
                `;
                injectExportButtons(tableCard);
                tablesContainer.appendChild(tableCard);
            });
            tablesFetched = true;
        })
        .catch(err => {
            tablesLoading.style.display = 'none';
            tablesContainer.innerHTML = `<div class="error-msg">Connection Error while fetching tables.</div>`;
        });
    }

    // --- Export Functionality ---
    function injectExportButtons(container) {
        const tables = container.querySelectorAll('table');
        tables.forEach((table, index) => {
            const btn = document.createElement('button');
            btn.className = 'export-btn';
            btn.innerHTML = '<i class="fa-solid fa-file-csv"></i> Download CSV / Excel';
            btn.onclick = () => exportTableToCSV(table, `export_${Date.now()}.csv`);
            
            // Insert button before the table
            table.parentNode.insertBefore(btn, table);
        });
    }

    function exportTableToCSV(table, filename) {
        let csv = [];
        const rows = table.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
                // Escape double quotes
                data = data.replace(/"/g, '""');
                row.push('"' + data + '"');
            }
            csv.push(row.join(','));
        }
        
        downloadCSV(csv.join('\n'), filename);
    }

    function downloadCSV(csv, filename) {
        let csvFile;
        let downloadLink;

        csvFile = new Blob([csv], {type: "text/csv"});
        downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // --- Utilities ---
    function showLoading(container) {
        const id = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = `typing-indicator`;
        loadingDiv.id = id;
        loadingDiv.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
        container.appendChild(loadingDiv);
        scrollToBottom();
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
