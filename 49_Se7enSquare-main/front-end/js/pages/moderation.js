/**
 * DEPRECATED - moderation.js
 * C5 AUDIT FIX: This file is orphaned - never imported by any HTML page.
 * All moderation logic lives in: js/pages/mod-panel.js
 * TODO: Delete this file after confirming mod-panel.js covers all needed functions.
 */
// Imports below are also unused - api.js, modal.js are orphaned too.
import { fetchData } from '../core/api.js';
import { requireRole } from '../core/auth.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../core/utils.js';

// Inside your moderation.js file:
window.takeAction = function(reportId, actionType) {
    if (actionType === 'Ban') {
        openModal({
            title: "Confirm Ban",
            bodyHTML: `<p>Are you sure you want to permanently ban the user in Report #${reportId}?</p><p style="color:red; font-size:0.9em;">This action cannot be undone.</p>`,
            confirmText: "Yes, Ban User",
            onConfirm: () => {
                showToast(`User in report #${reportId} has been banned.`, 'error');
                // Make API call to Strategy here...
            }
        });
    } else {
        showToast(`Warning sent to user in report #${reportId}.`, 'success');
    }
};




document.addEventListener('DOMContentLoaded', async () => {
    // Only allow Moderators and Admins on this page
    const hasAccess = requireRole(['moderator', 'admin']);
    if (!hasAccess) return;

    await loadModerationQueue();
});

async function loadModerationQueue() {
    const tableBody = document.getElementById('reports-table-body');
    if (!tableBody) return;

    // Simulated API data. In a real app, this comes from fetchData()
    const mockReports = [
        { id: 1042, targetUser: "ToxicGamer22", reason: "Harassment in Voice Chat", reportedBy: "AudienceMember1", severity: "High" },
        { id: 1043, targetUser: "SpamBot9000", reason: "Phishing Links in Global Chat", reportedBy: "System Bot", severity: "Critical" },
        { id: 1044, targetUser: "SaltyPlayer", reason: "Offensive Username", reportedBy: "ProSniper", severity: "Medium" }
    ];

    tableBody.innerHTML = ''; // Clear loading state

    mockReports.forEach(report => {
        const row = document.createElement('tr');
        row.id = `report-row-${report.id}`; // Add ID for easy removal
        
        // Color-code the severity for a better UI
        let severityClass = '';
        if (report.severity === 'Critical') severityClass = 'color: red; font-weight: bold;';
        if (report.severity === 'High') severityClass = 'color: orange;';

        row.innerHTML = `
            <td>#${report.id}</td>
            <td><strong>${report.targetUser}</strong></td>
            <td>${report.reason}</td>
            <td><span style="${severityClass}">${report.severity}</span></td>
            <td><em>${report.reportedBy}</em></td>
            <td class="action-buttons">
                <button class="btn-warn" onclick="handleModAction(${report.id}, '${report.targetUser}', 'Warned')">⚠️ Warn</button>
                <button class="btn-ban" onclick="handleModAction(${report.id}, '${report.targetUser}', 'Banned')">🔨 Ban</button>
                <button class="btn-dismiss" onclick="handleModAction(${report.id}, '${report.targetUser}', 'Dismissed')">✅ Dismiss</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Global function so inline HTML onclick handlers can access it
window.handleModAction = function(reportId, targetUser, action) {
    // 1. Show an alert simulating the Strategy action
    alert(`Success: User '${targetUser}' has been ${action}. Logged by System Bot.`);
    
    // 2. Dynamically remove the row from the table to show "queue processing"
    const row = document.getElementById(`report-row-${reportId}`);
    if (row) {
        row.style.transition = "opacity 0.5s ease";
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 500); // Remove from DOM after fade out
    }

    // Check if queue is empty
    setTimeout(() => {
        const tableBody = document.getElementById('reports-table-body');
        if (tableBody && tableBody.children.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">🎉 The moderation queue is empty! Great job.</td></tr>`;
        }
    }, 600);
};
