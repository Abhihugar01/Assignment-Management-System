// Teacher Dashboard Functions
async function initializeTeacherDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = `
        <div class="dashboard-header">
            <h1>Teacher Dashboard</h1>
            <button onclick="logout()">Logout</button>
        </div>
        <div class="dashboard-content">
            <div class="actions">
                <button onclick="showCreateGroupForm()">Create New Group</button>
                <button onclick="showCreateAssignmentForm()">Create New Assignment</button>
            </div>
            <div id="groups-section">
                <h2>Your Groups</h2>
                <div id="groups-list" class="group-list"></div>
            </div>
            <div id="assignments-section">
                <h2>Recent Assignments</h2>
                <div id="assignments-list" class="assignment-list"></div>
            </div>
        </div>
    `;

    await loadTeacherGroups();
    await loadTeacherAssignments();
}

async function loadTeacherGroups() {
    try {
        const response = await fetch('/api/groups/teacher', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const groups = await response.json();
        
        const groupsList = document.getElementById('groups-list');
        groupsList.innerHTML = groups.map(group => `
            <div class="group-card">
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <p><i class="fas fa-key"></i> Join Code: ${group.join_code}</p>
                    <p><i class="fas fa-users"></i> Members: ${group.member_count}</p>
                </div>
                <button onclick="viewGroupDetails(${group.id})" class="view-btn">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
        alert('Failed to load groups');
    }
}

async function loadTeacherAssignments() {
    try {
        const response = await fetch('/api/assignments/teacher', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const assignments = await response.json();
        
        const assignmentsList = document.getElementById('assignments-list');
        assignmentsList.innerHTML = assignments.map(assignment => `
            <div class="assignment-item">
                <h3>${assignment.title}</h3>
                <p>Group: ${assignment.group_name}</p>
                <p>Deadline: ${new Date(assignment.deadline).toLocaleString()}</p>
                <p>Submissions: ${assignment.submission_count}/${assignment.total_students}</p>
                <button onclick="viewAssignmentDetails(${assignment.id})">View Details</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

async function viewGroupDetails(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch group details');
        }

        const group = await response.json();
        console.log('Group data:', group); // Debug log
        
        const students = group.members || [];
        console.log('Students:', students); // Debug log
        
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${group.name}</h2>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="group-details">
                        <div class="info-box">
                            <div class="info-box-header">
                                <i class="fas fa-users"></i>
                                <h3>Students (${students.length})</h3>
                            </div>
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Sr. No.</th>
                                            <th>Student Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${students.length > 0 ? 
                                            students.map((student, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>${student.username}</td>
                                                </tr>
                                            `).join('') : 
                                            '<tr><td colspan="2" class="no-data">No students yet</td></tr>'
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing group details:', error);
        alert(error.message || 'Failed to load group details');
    }
}

async function viewAssignmentDetails(assignmentId) {
    try {
        const response = await fetch(`/api/assignments/${assignmentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch assignment details');
        }

        const assignment = await response.json();
        
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${assignment.title}</h2>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="assignment-details">
                        <div class="info-box">
                            <div class="info-box-header">
                                <i class="fas fa-info-circle"></i>
                                <h3>Assignment Information</h3>
                            </div>
                            <div class="table-container">
                                <table class="data-table info-table">
                                    <tbody>
                                        <tr>
                                            <th>Group</th>
                                            <td>${assignment.group_name}</td>
                                        </tr>
                                        <tr>
                                            <th>Deadline</th>
                                            <td>${new Date(assignment.deadline).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <th>Description</th>
                                            <td>${assignment.description || 'No description provided'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="info-box" style="margin-top: 24px;">
                            <div class="info-box-header">
                                <i class="fas fa-users"></i>
                                <h3>Student Submissions</h3>
                            </div>
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Sr. No.</th>
                                            <th>Name</th>
                                            <th>Submission Time</th>
                                            <th>Type</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${assignment.submissions.length === 0 ? 
                                            '<tr><td colspan="5" class="no-data">No submissions yet</td></tr>' :
                                            assignment.submissions.map((submission, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>${submission.username}</td>
                                                    <td style="word-break: break-word; white-space: normal;">
  ${new Date(submission.submitted_at).toLocaleString()}
</td>

                                                    <td>${submission.submission_type}</td>
                                                    <td class="action-cell">
                                                        ${submission.submission_type === 'file' ? 
                                                            `<a href="/${submission.content}" target="_blank" class="view-btn">
                                                                <i class="fas fa-eye"></i> View File
                                                            </a>` :
                                                            `<a href="${submission.content}" target="_blank" class="view-btn">
                                                                <i class="fas fa-external-link-alt"></i> Open Link
                                                            </a>`
                                                        }
                                                    </td>
                                                </tr>
                                            `).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing assignment details:', error);
        alert(error.message || 'Failed to load assignment details');
    }
}

// Student Dashboard Functions
async function initializeStudentDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = `
        <div class="dashboard-header">
            <h1>Student Dashboard</h1>
            <button onclick="logout()">Logout</button>
        </div>
        <div class="dashboard-content">
            <div class="actions">
                <button onclick="showJoinGroupForm()">Join Group</button>
            </div>
            <div id="groups-section">
                <h2>Your Groups</h2>
                <div id="groups-list" class="group-list"></div>
            </div>
            <div id="assignments-section">
                <h2></br>Pending Assignments</h2>
                <div id="assignments-list" class="assignment-list"></div>
            </div>
        </div>
    `;

    await loadStudentGroups();
    await loadStudentAssignments();
}

async function loadStudentGroups() {
    try {
        const response = await fetch('/api/groups/student', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const groups = await response.json();
        
        const groupsList = document.getElementById('groups-list');

        if (groups.length === 0) {
            groupsList.innerHTML = '<p>No groups found.</p>';
            return;
        }

        groupsList.innerHTML = `
            <table class="modern-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Group Name</th>
                        <th>Teacher</th>
                    </tr>
                </thead>
                <tbody>
                    ${groups.map((group, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${group.name}</td>
                            <td>${group.teacher_name}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}


async function loadStudentAssignments() {
    try {
        const response = await fetch('/api/assignments/student', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const assignments = await response.json();

        const assignmentsList = document.getElementById('assignments-list');
        assignmentsList.innerHTML = assignments.map(assignment => `
            <div class="assignment-item" id="assignment-${assignment.id}">
                <h3>${assignment.title}</h3>
                <p>Group: ${assignment.group_name}</p>
                <p>Deadline: ${new Date(assignment.deadline).toLocaleString()}</p>
                <p>Status: <span class="status status-${assignment.submitted ? 'submitted' : 'pending'}" id="status-${assignment.id}">
                    ${assignment.submitted ? 'Submitted' : 'Pending'}
                </span></p>
                ${!assignment.submitted ? `
                    <input type="file" id="file-${assignment.id}" />
                    <button onclick="submitAssignment(${assignment.id})">Upload & Submit</button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

async function loadStudentAssignments() {
    try {
        const response = await fetch('/api/assignments/student', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const assignments = await response.json();

        const assignmentsList = document.getElementById('assignments-list');
        assignmentsList.innerHTML = assignments.map(assignment => `
            <div class="assignment-item" id="assignment-${assignment.id}">
                <h3>${assignment.title}</h3>
                <p>Group: ${assignment.group_name}</p>
                <p>Deadline: ${new Date(assignment.deadline).toLocaleString()}</p>
                <p>Status: <span class="status status-${assignment.submitted ? 'submitted' : 'pending'}" id="status-${assignment.id}">
                    ${assignment.submitted ? 'Submitted' : 'Pending'}
                </span></p>
                ${!assignment.submitted ? `
                    <input type="file" id="file-${assignment.id}" onchange="enableSubmit(${assignment.id})"/>
                    <button id="submit-btn-${assignment.id}" onclick="submitAssignment(${assignment.id})" disabled>Upload & Submit</button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

function enableSubmit(assignmentId) {
    const fileInput = document.getElementById(`file-${assignmentId}`);
    const submitBtn = document.getElementById(`submit-btn-${assignmentId}`);
    if (fileInput.files.length > 0) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}



async function submitAssignment(assignmentId) {
    try {
        // Example hardcoded payload – replace with your actual form data logic
        const payload = {
            assignment_id: assignmentId,
            submission_type: 'file',
            content: 'data:text/plain;base64,SGVsbG8gd29ybGQ=' // dummy base64 string
        };

        const response = await fetch('/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            // ✅ Update status text and style
            const statusSpan = document.getElementById(`status-${assignmentId}`);
            statusSpan.textContent = 'Submitted';
            statusSpan.classList.remove('status-pending');
            statusSpan.classList.add('status-submitted');

            // ✅ Optionally remove the submit button
            const container = document.getElementById(`assignment-${assignmentId}`);
            const button = container.querySelector('button');
            if (button) button.remove();
        } else {
            alert('Submission failed: ' + result.message);
        }
    } catch (error) {
        console.error('Submission error:', error);
    }
}


// Form Handlers
function showCreateGroupForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Group</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form id="create-group-form" class="form-container">
                    <div class="form-group">
                        <label for="group-name">Group Name</label>
                        <input type="text" id="group-name" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Create Group</button>
                        <button type="button" class="secondary-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(form);

    form.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('group-name').value;
        
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (response.ok) {
                form.innerHTML = `
                    <div class="modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2>Group Created Successfully!</h2>
                                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                            </div>
                            <div class="success-content">
                                <div class="success-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <p>Share this join code with your students:</p>
                                <div class="join-code">${data.group.join_code}</div>
                                <button class="primary-btn" onclick="this.closest('.modal').remove()">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                await loadTeacherGroups();
            } else {
                alert(data.message || 'Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('An error occurred while creating the group');
        }
    });
}

function showJoinGroupForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <h2>Join Group</h2>
                <form id="join-group-form">
                    <div class="form-group">
                        <label for="join-code">Group Join Code</label>
                        <input type="text" id="join-code" required>
                    </div>
                    <button type="submit">Join Group</button>
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(form);

    form.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const joinCode = document.getElementById('join-code').value;
        
        try {
            const response = await fetch('/api/groups/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ join_code: joinCode })
            });

            if (response.ok) {
                form.remove();
                await loadStudentGroups();
            } else {
                alert('Failed to join group');
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('An error occurred while joining the group');
        }
    });
}

function showCreateAssignmentForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Assignment</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <form id="create-assignment-form" class="form-container">
                    <div class="form-group">
                        <label for="assignment-title">Title</label>
                        <input type="text" id="assignment-title" required>
                    </div>
                    <div class="form-group">
                        <label for="assignment-description">Description</label>
                        <textarea id="assignment-description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="assignment-group">Group</label>
                        <select id="assignment-group" required></select>
                    </div>
                    <div class="form-group">
                        <label for="assignment-deadline">Deadline</label>
                        <input type="datetime-local" id="assignment-deadline" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Create Assignment</button>
                        <button type="button" class="secondary-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(form);

    loadGroupsForAssignment(form.querySelector('#assignment-group'));

    form.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('assignment-title').value;
        const description = document.getElementById('assignment-description').value;
        const groupId = document.getElementById('assignment-group').value;
        const deadline = document.getElementById('assignment-deadline').value;
        
        try {
            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    group_id: groupId,
                    deadline
                })
            });

            if (response.ok) {
                form.remove();
                await loadTeacherAssignments();
            } else {
                alert('Failed to create assignment');
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert('An error occurred while creating the assignment');
        }
    });
}

async function loadGroupsForAssignment(selectElement) {
    try {
        const response = await fetch('/api/groups/teacher', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const groups = await response.json();
        
        selectElement.innerHTML = groups.map(group => 
            `<option value="${group.id}">${group.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function showSubmissionForm(assignmentId) {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="modal">
            <div class="modal-content">
                <h2>Submit Assignment</h2>
                <form id="submit-assignment-form">
                    <div class="form-group">
                        <label for="submission-type">Submission Type</label>
                        <select id="submission-type" required>
                            <option value="file">File Upload</option>
                            <option value="link">Link</option>
                        </select>
                    </div>
                    <div class="form-group" id="file-upload-group">
                        <label for="submission-file">Upload File</label>
                        <input type="file" id="submission-file">
                    </div>
                    <div class="form-group hidden" id="link-input-group">
                        <label for="submission-link">Submission Link</label>
                        <input type="url" id="submission-link">
                    </div>
                    <button type="submit">Submit</button>
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(form);

    // Toggle between file upload and link input
    const submissionType = form.querySelector('#submission-type');
    const fileUploadGroup = form.querySelector('#file-upload-group');
    const linkInputGroup = form.querySelector('#link-input-group');

    submissionType.addEventListener('change', (e) => {
        if (e.target.value === 'file') {
            fileUploadGroup.classList.remove('hidden');
            linkInputGroup.classList.add('hidden');
        } else {
            fileUploadGroup.classList.add('hidden');
            linkInputGroup.classList.remove('hidden');
        }
    });

    form.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submissionType = document.getElementById('submission-type').value;
        let content;

        if (submissionType === 'file') {
            const file = document.getElementById('submission-file').files[0];
            if (!file) {
                alert('Please select a file');
                return;
            }
            content = await readFileAsDataURL(file);
        } else {
            content = document.getElementById('submission-link').value;
            if (!content) {
                alert('Please enter a link');
                return;
            }
        }

        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    assignment_id: assignmentId,
                    submission_type: submissionType,
                    content
                })
            });

            if (response.ok) {
                form.remove();
                await loadStudentAssignments();
            } else {
                alert('Failed to submit assignment');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            alert('An error occurred while submitting the assignment');
        }
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
} 