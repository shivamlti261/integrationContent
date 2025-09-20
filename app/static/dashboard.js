document.addEventListener('DOMContentLoaded', function() {
    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            // Clear local storage and redirect to logout page
            localStorage.clear();
            window.location.href = '/logout';
        };
    }
    // Data caches
    let integrationContentData = [];
    let artifactDetailsData = [];
    let deployStatusData = [];
    let allPackagesData = [];
    let deployedPackagesData = [];

    // Load all data on page load
    (async function loadAllData() {
        integrationContentData = await fetchIntegrationContent();
        artifactDetailsData = await fetchArtifactDetails();
        // Set summary card values
        setSummaryCards(integrationContentData, artifactDetailsData);
        // You can add similar calls for deployStatusData, allPackagesData, deployedPackagesData if needed
    })();
// Set dashboard summary card values
function setSummaryCards(packages, artifacts) {
    // Number of packages
    document.getElementById('numPackages').textContent = packages.length;
    // Number of runtime artifacts
    document.getElementById('numArtifacts').textContent = artifacts.length;
    // Number of artifacts with Status 'STARTED'
    const started = artifacts.filter(a => (a.Status || a.status || a.StatusText || '').toLowerCase() === 'started').length;
    document.getElementById('numStarted').textContent = started;
    // Number of artifacts with Status containing 'ERROR'
    const error = artifacts.filter(a => ((a.Status || a.status || a.StatusText || '').toLowerCase().includes('error'))).length;
    document.getElementById('numError').textContent = error;
}

    document.getElementById('btnIntegrationContent').onclick = function() {
        renderTable(integrationContentData);
    };
    document.getElementById('btnArtifactDetails').onclick = function() {
        renderTable(artifactDetailsData);
    };
    document.getElementById('btnDeployStatus').onclick = function() {
        renderTable(deployStatusData);
    };
    document.getElementById('btnAllPackages').onclick = function() {
        renderTable(allPackagesData);
    };
    document.getElementById('btnDeployedPackages').onclick = function() {
        renderTable(deployedPackagesData);
    };
});

async function fetchIntegrationContent() {
    const token = localStorage.getItem('authToken');
    const resourceUrl = localStorage.getItem('tenantUrl') + "/api/v1/IntegrationPackages";
    try {
        const response = await fetch('http://127.0.0.1:5000/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: resourceUrl, token: token })
        });
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const entries = xmlDoc.getElementsByTagName('entry');
        const data = [];
        for (let i = 0; i < entries.length; i++) {
            const id = entries[i].getElementsByTagName('d:Id')[0]?.textContent || '';
            const name = entries[i].getElementsByTagName('d:Name')[0]?.textContent || '';
            const description = entries[i].getElementsByTagName('d:Description')[0]?.textContent || '';
            const shortText = entries[i].getElementsByTagName('d:ShortText')[0]?.textContent || '';
            const modifiedBy = entries[i].getElementsByTagName('d:ModifiedBy')[0]?.textContent || '';
            data.push({ Id: id, Name: name, Description: description, ShortText: shortText, ModifiedBy: modifiedBy });
        }
        return data;
    } catch (error) {
        console.error('Error fetching integration content:', error);
        return [];
    }
}

async function fetchArtifactDetails() {
    const token = localStorage.getItem('authToken');
    const resourceUrl = localStorage.getItem('tenantUrl') + "/api/v1/IntegrationRuntimeArtifacts";
    try {
        const response = await fetch('http://127.0.0.1:5000/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: resourceUrl, token: token })
        });
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const entries = xmlDoc.getElementsByTagName('m:properties');
        const data = [];
        for (let i = 0; i < entries.length; i++) {
            const id = entries[i].getElementsByTagName('d:Id')[0]?.textContent || '';
            const name = entries[i].getElementsByTagName('d:Name')[0]?.textContent || '';
            const version = entries[i].getElementsByTagName('d:Version')[0]?.textContent || '';
            const Type = entries[i].getElementsByTagName('d:Type')[0]?.textContent || '';
            const DeployedBy = entries[i].getElementsByTagName('d:DeployedBy')[0]?.textContent || '';
            const DeployedOn = entries[i].getElementsByTagName('d:DeployedOn')[0]?.textContent || '';
            const Status = entries[i].getElementsByTagName('d:Status')[0]?.textContent || '';
            data.push({ Id: id, Name: name, Version: version, Type: Type, DeployedBy: DeployedBy, DeployedOn: DeployedOn, Status: Status });
        }
        return data;
    } catch (error) {
        console.error('Error fetching integration content:', error);
        return [];
    }
}

function fetchDeployStatus() {
    // TODO: Call API and render table
    renderTable([]);
}

function fetchAllPackages() {
    // TODO: Call API and render table
    renderTable([]);
}

function fetchDeployedPackages() {
    // TODO: Call API and render table
    renderTable([]);
}

function renderTable(data) {
    const container = document.getElementById('dashboardTableContainer');
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No data available.</p>';
        return;
    }
    // Use keys from first row for headings
    const columns = Object.keys(data[0]);
    let html = `<table class="dashboard-table">
        <thead>
            <tr>`;
    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += `</tr>
        </thead>
        <tbody>`;
    const truncate = (str) => str && str.length > 40 ? str.slice(0, 40) + '…' : str;
    data.forEach(row => {
        html += `<tr>`;
        columns.forEach(col => {
            const val = row[col] || '';
            html += `<td class="cell-click" data-full="${encodeURIComponent(val)}" title="${val}">${truncate(val)}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

    // Add click event to show modal with full text
    document.querySelectorAll('.cell-click').forEach(cell => {
        cell.addEventListener('click', function(e) {
            const fullText = decodeURIComponent(this.getAttribute('data-full'));
            document.getElementById('modalText').textContent = fullText;
            document.getElementById('cellModal').style.display = 'flex';
        });
    });
}

// Modal close logic
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('cellModal');
    const closeBtn = document.getElementById('closeModal');
    if (modal && closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
});
