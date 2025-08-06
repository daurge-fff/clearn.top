// User Profile page JavaScript for lesson status updates
document.addEventListener('DOMContentLoaded', function() {
    // Handle lesson status dropdowns
    const statusCells = document.querySelectorAll('.status-cell[data-lesson-id]');
    
    statusCells.forEach(cell => {
        const dropdown = cell.querySelector('.status-dropdown');
        const currentBadge = cell.querySelector('.current-status-badge');
        
        // Toggle dropdown on click
        cell.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close all other dropdowns
            document.querySelectorAll('.status-dropdown').forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            
            // Toggle current dropdown
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Handle status selection
        dropdown.querySelectorAll('.status-dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const lessonId = cell.dataset.lessonId;
                const newStatus = this.dataset.status;
                
                updateLessonStatus(lessonId, newStatus, cell, currentBadge);
                
                // Close dropdown
                dropdown.style.display = 'none';
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.status-dropdown').forEach(d => {
            d.style.display = 'none';
        });
    });
    
    // Update lesson status via API
    function updateLessonStatus(lessonId, newStatus, cellElement, badgeElement) {
        const updateBtn = event.target;
        const originalText = updateBtn.textContent;
        
        // Show loading state
        updateBtn.textContent = 'Updating...';
        updateBtn.style.opacity = '0.5';
        
        fetch(`/dashboard/lessons/${lessonId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update the badge class and text
                badgeElement.className = `badge status-${newStatus} current-status-badge`;
                badgeElement.textContent = newStatus.replace(/_/g, ' ');
                
                // Update data attribute
                cellElement.dataset.currentStatus = newStatus;
                
                // Show success feedback
                showNotification('Lesson status updated successfully', 'success');
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error updating lesson status: ' + error.message, 'error');
        })
        .finally(() => {
            updateBtn.textContent = originalText;
            updateBtn.style.opacity = '1';
        });
    }
    
    // Show notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ${type === 'success' ? 'background: #2ecc71;' : ''}
            ${type === 'error' ? 'background: #e74c3c;' : ''}
            ${type === 'info' ? 'background: #3498db;' : ''}
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Handle delete lesson buttons
    const deleteButtons = document.querySelectorAll('.delete-lesson-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const lessonId = this.dataset.id;
            if (confirm('Are you sure you want to delete this lesson?')) {
                fetch(`/dashboard/lessons/${lessonId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // Remove the row from the table
                        const row = this.closest('tr');
                        if (row) {
                            row.style.transition = 'opacity 0.3s ease';
                            row.style.opacity = '0';
                            setTimeout(() => {
                                row.remove();
                            }, 300);
                        }
                        showNotification('Lesson deleted successfully', 'success');
                    } else {
                        throw new Error('Failed to delete lesson');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error deleting lesson: ' + error.message, 'error');
                });
            }
        });
    });
});