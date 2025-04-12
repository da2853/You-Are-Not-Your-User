document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Default to index if root
    console.log(`Initializing page: ${currentPage}`);

    // --- Common Utilities ---
    const statusMessageTimers = {}; // Store timers for status messages

    // Function to show a status message and optionally clear it
    function showStatusMessage(elementId, message, type = 'info', duration = 4000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Clear existing timer for this element
        if (statusMessageTimers[elementId]) {
            clearTimeout(statusMessageTimers[elementId]);
        }

        element.textContent = message;
        element.className = `status-message ${type}`; // Reset classes and add type
        element.style.display = 'block';

        if (duration > 0) {
            statusMessageTimers[elementId] = setTimeout(() => {
                element.style.display = 'none';
                element.textContent = '';
                delete statusMessageTimers[elementId]; // Remove timer reference
            }, duration);
        }
    }

    // Function to get data from dynamic list items
    function getListItemsData(listElement, itemSelector) {
        const items = listElement.querySelectorAll(itemSelector);
        const data = [];
        items.forEach(item => {
            const itemData = {};
            const inputs = item.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.name) {
                    itemData[input.name] = input.value.trim();
                }
            });
            // Only add if some core data exists (e.g., jobTitle or institution)
            if (itemData.jobTitle || itemData.institution || Object.values(itemData).some(val => val !== '')) {
               data.push(itemData);
            }
        });
        return data;
   }

    // Function to add a list item using a template
    function addListItem(listElement, templateElement, focusFirstInput = true, clearPlaceholder = true) {
        if (!templateElement) {
            console.error("Template element not found!");
            return null;
        }
        if (clearPlaceholder && listElement.querySelector('.text-muted')) {
             listElement.innerHTML = ''; // Clear "No items added yet" placeholder
        }

        const clone = templateElement.content.cloneNode(true);
        const newItem = clone.querySelector('div'); // Assuming the template's root is a div
        listElement.appendChild(newItem);

        // Add remove functionality
        const removeBtn = newItem.querySelector('.remove-item-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                newItem.remove();
                 // If list becomes empty, show placeholder again (optional)
                 if (listElement.children.length === 0 && clearPlaceholder) {
                     listElement.innerHTML = `<p class="text-muted">No items added yet.</p>`;
                 }
                // Trigger auto-save or progress update if applicable (add this later in page-specific logic)
                 if (typeof updateProgressBar === 'function') updateProgressBar();
                 if (typeof triggerAutoSave === 'function') triggerAutoSave();
            });
        }

        if (focusFirstInput) {
            const firstInput = newItem.querySelector('input, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }
        return newItem; // Return the added element
    }

     // Function to render list items from data
    function renderListItems(listElement, itemsData, templateElement, addItemFunction, clearPlaceholder = true) {
         if (clearPlaceholder) {
             listElement.innerHTML = ''; // Clear existing content or placeholder
         }
         if (!itemsData || itemsData.length === 0) {
             if (clearPlaceholder) {
                 listElement.innerHTML = `<p class="text-muted">No items added yet.</p>`;
             }
             return;
         }

         itemsData.forEach(itemData => {
            const newItem = addItemFunction(false, false); // Add without focus, without clearing placeholder this time
             if(newItem){
                 // Populate the new item with data
                 Object.keys(itemData).forEach(key => {
                     const input = newItem.querySelector(`[name=${key}]`);
                     if (input) {
                         input.value = itemData[key] || ''; // Handle null/undefined
                     }
                 });
             }
         });
    }

     // Function to handle file input simulation
     function setupFileInputSimulation(inputId, buttonId, displayId) {
         const input = document.getElementById(inputId);
         const button = document.getElementById(buttonId);
         const display = document.getElementById(displayId);
         if (!input || !button || !display) return;

         button.addEventListener('click', () => input.click());
         input.addEventListener('change', (e) => {
             display.textContent = e.target.files.length > 0 ? e.target.files[0].name : 'No file chosen';
             // Optional: Clear error/status message related to file selection
         });
     }

    // --- Page Initializers ---
    if (currentPage === 'dashboard.html' || currentPage === 'index.html' || currentPage === '') {
        // Redirect index.html to dashboard if needed, or just init dashboard
        if (currentPage === 'index.html' || currentPage === '') {
           // For GitHub pages root, or explicit index.html, maybe just stay there?
           // Or redirect: window.location.replace('dashboard.html');
           // For now, let index.html be standalone, and dashboard init if it's the dashboard page.
           if (currentPage === 'dashboard.html') initDashboard();
        } else {
             initDashboard();
        }
    } else if (currentPage === 'profile.html') {
        initProfile();
    } else if (currentPage === 'apply.html') {
        initApplication();
    }

    // --- Dashboard Page Logic ---
    function initDashboard() {
        console.log('Initializing Dashboard');
        const applicationsList = document.getElementById('applications-list');
        if (!applicationsList) return;

        const applications = dataApi.loadApplications();
        // Sort applications by last update time (most recent first)
        applications.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));


        if (applications.length === 0) {
            applicationsList.innerHTML = '<p>You have no submitted applications yet. Start one using the button below!</p>';
            return;
        }

        applicationsList.innerHTML = ''; // Clear loading message
        applications.forEach(app => {
            const item = document.createElement('div');
            item.classList.add('application-item');

            // Determine status and class dynamically
            const status = app.status || 'Unknown';
            const statusClass = `status-${status.toLowerCase().replace(/ /g, '-')}`; // e.g., status-in-review

            item.innerHTML = `
                <div class="application-info">
                    <span><strong>Job:</strong> ${app.jobTitle || 'Unknown Job'}</span>
                    <span><strong>Company:</strong> ${app.formData?.company || 'N/A'}</span>
                    <span><strong>Submitted:</strong> ${app.submittedDate || 'N/A'}</span>
                    <span><strong>Last Update:</strong> ${app.lastUpdated ? new Date(app.lastUpdated).toLocaleString() : 'N/A'}</span>
                </div>
                <div class="application-status">
                     <span class="status ${statusClass}">${status}</span>
                </div>
                <div class="application-actions">
                    <!-- Link to apply.html with the specific jobId for editing -->
                    <a href="apply.html?jobId=${app.jobId}" class="btn btn-secondary btn-small">View/Edit</a>
                    <!-- Add Withdraw/Delete simulation if needed -->
                     <button type="button" class="btn btn-danger btn-small withdraw-btn" data-jobid="${app.jobId}" title="Simulate Withdraw/Delete">Withdraw</button>
                </div>
            `;
            applicationsList.appendChild(item);
        });

         // Add event listeners for Withdraw buttons (simulation)
        applicationsList.querySelectorAll('.withdraw-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const jobId = e.target.dataset.jobid;
                if (confirm(`Simulate withdrawing/deleting application for Job ID ${jobId}? This cannot be undone in the prototype.`)) {
                    // Find app and update status or remove
                    const apps = dataApi.loadApplications();
                    const appIndex = apps.findIndex(a => a.jobId === jobId);
                    if (appIndex > -1) {
                        // Option 1: Change status to Withdrawn
                        // apps[appIndex].status = 'Withdrawn';
                        // apps[appIndex].lastUpdated = new Date().toISOString();
                        // dataApi.saveApplications(apps);

                        // Option 2: Remove completely (more permanent)
                        apps.splice(appIndex, 1);
                        dataApi.saveApplications(apps);

                        // Remove auto-save for this job too
                        dataApi.clearCurrentApplicationProgress(jobId);

                        // Re-render the list
                        initDashboard();
                        alert(`Application ${jobId} withdrawn/deleted (simulated).`);
                    }
                }
            });
        });
    }

    // --- Profile Page Logic ---
    function initProfile() {
        console.log('Initializing Profile Page');
        const profileForm = document.getElementById('profile-form');
        const saveStatus = document.getElementById('profile-save-status');
        const parseResumeBtn = document.getElementById('parse-resume-btn');
        const parseStatus = document.getElementById('parse-status');

        const workExperienceList = document.getElementById('work-experience-list');
        const addExperienceBtn = document.getElementById('add-experience-btn');
        const educationList = document.getElementById('education-list');
        const addEducationBtn = document.getElementById('add-education-btn');

        const documentList = document.getElementById('document-list');
        const addDocBtn = document.getElementById('add-doc-btn');
        const docUploadStatus = document.getElementById('doc-upload-status');

        // Templates
        const workExpTemplate = document.getElementById('work-experience-template');
        const eduTemplate = document.getElementById('education-template');

        // File Input Simulations
        setupFileInputSimulation('resume-upload-input', 'resume-upload-btn', 'resume-file-name');
        setupFileInputSimulation('doc-upload-input', 'doc-upload-btn', 'doc-file-name');

        // Load existing profile data
        const profileData = dataApi.loadProfile(); // Already has default structure if null
        if (profileData) {
            profileForm.querySelector('#profile-name').value = profileData.name || '';
            profileForm.querySelector('#profile-email').value = profileData.email || '';
            profileForm.querySelector('#profile-phone').value = profileData.phone || '';
            profileForm.querySelector('#profile-location').value = profileData.location || '';
            profileForm.querySelector('#profile-skills').value = profileData.skills || '';
            // Render lists using the profile data
            renderListItems(workExperienceList, profileData.workExperience || [], workExpTemplate, addWorkExperienceItem);
            renderListItems(educationList, profileData.education || [], eduTemplate, addEducationItem);
        } else {
            showStatusMessage('profile-save-status', 'Error loading profile data.', 'error', 0);
        }

        // Save profile handler
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simple HTML5 validation check
             if (!profileForm.checkValidity()) {
                 showStatusMessage('profile-save-status', 'Please fill in all required fields (marked with *).', 'error');
                 // Optionally highlight invalid fields
                  profileForm.querySelectorAll(':invalid').forEach(el => el.classList.add('validation-error'));
                 return;
             }
              // Remove error class from valid fields
              profileForm.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error'));


            const updatedProfile = {
                name: profileForm.querySelector('#profile-name').value.trim(),
                email: profileForm.querySelector('#profile-email').value.trim(),
                phone: profileForm.querySelector('#profile-phone').value.trim(),
                location: profileForm.querySelector('#profile-location').value.trim(),
                skills: profileForm.querySelector('#profile-skills').value.trim(),
                workExperience: getListItemsData(workExperienceList, '.experience-item'),
                education: getListItemsData(educationList, '.education-item'),
            };

            console.log('Saving profile:', updatedProfile);

            if (dataApi.saveProfile(updatedProfile)) {
                 showStatusMessage('profile-save-status', 'Profile saved successfully!', 'success');
            } else {
                 showStatusMessage('profile-save-status', 'Error saving profile.', 'error');
            }
        });

        // --- Dynamic List Handling ---
        const addWorkExperienceItem = (focus = true, clearPlaceholder = true) => {
             return addListItem(workExperienceList, workExpTemplate, focus, clearPlaceholder);
        };
        const addEducationItem = (focus = true, clearPlaceholder = true) => {
            return addListItem(educationList, eduTemplate, focus, clearPlaceholder);
        };

        addExperienceBtn.addEventListener('click', () => addWorkExperienceItem());
        addEducationBtn.addEventListener('click', () => addEducationItem());


        // --- Resume Parsing Simulation ---
        parseResumeBtn.addEventListener('click', () => {
             const resumeInput = document.getElementById('resume-upload-input');
             if (resumeInput.files.length === 0) {
                 showStatusMessage('parse-status', 'Please choose a resume file first.', 'error');
                 return;
             }

             showStatusMessage('parse-status', 'Parsing resume... (Simulated)', 'info', 0); // Show indefinitely until success/error
             parseResumeBtn.disabled = true;

             // Simulate parsing delay and pre-fill
             setTimeout(() => {
                 // Use existing data as base, only overwrite if empty or add dummy data
                 const currentProfile = dataApi.loadProfile();

                 profileForm.querySelector('#profile-name').value = currentProfile.name || 'Jane Doe (Parsed)';
                 profileForm.querySelector('#profile-email').value = currentProfile.email || 'jane.doe.parsed@email.com';
                 profileForm.querySelector('#profile-phone').value = currentProfile.phone || '555-123-4567';
                 profileForm.querySelector('#profile-location').value = currentProfile.location || 'Anytown, USA (Parsed)';

                 const existingSkills = (currentProfile.skills || '').split(',').map(s => s.trim()).filter(s => s);
                 const parsedSkills = ['Parsed Skill: Web Dev', 'Parsed Skill: Communication'];
                 profileForm.querySelector('#profile-skills').value = [...new Set([...existingSkills, ...parsedSkills])].join(', ');


                 // Add dummy experience/education if lists are empty or append
                 if (!currentProfile.workExperience || currentProfile.workExperience.length === 0) {
                     const expItem = addWorkExperienceItem(false);
                     expItem.querySelector('[name=jobTitle]').value = 'Software Engineer (Parsed)';
                     expItem.querySelector('[name=company]').value = 'Parsed Tech Inc.';
                     expItem.querySelector('[name=duration]').value = 'Jan 2021 - Present';
                     expItem.querySelector('[name=description]').value = 'Developed web applications using simulated parsed technologies.';
                 } else {
                     console.log("Work experience exists, not adding parsed item.");
                 }
                 if (!currentProfile.education || currentProfile.education.length === 0) {
                     const eduItem = addEducationItem(false);
                     eduItem.querySelector('[name=institution]').value = 'State University (Parsed)';
                     eduItem.querySelector('[name=degree]').value = 'B.S. Computer Science (Parsed)';
                     eduItem.querySelector('[name=eduDuration]').value = '2017 - 2021';
                 } else {
                      console.log("Education exists, not adding parsed item.");
                 }

                 showStatusMessage('parse-status', 'Resume parsed and profile pre-filled! Please review and click "Save Profile".', 'success');
                 parseResumeBtn.disabled = false;
                 // Highlight fields that were changed? (more complex)

             }, 1500); // Simulate 1.5 second parse time
        });

        // --- Document Locker ---
        function renderDocumentList() {
            const documents = dataApi.loadDocuments();
            documentList.innerHTML = ''; // Clear
            if (documents.length === 0) {
                documentList.innerHTML = '<li class="text-muted">No documents uploaded yet.</li>';
                return;
            }
            documents.forEach(doc => {
                const li = document.createElement('li');
                // Use doc.id for removal
                li.innerHTML = `
                    <span>${doc.name} <small class="text-muted">(${doc.type || 'Unknown type'})</small></span>
                    <button type="button" class="btn btn-danger btn-small remove-doc-btn" data-docid="${doc.id}" title="Remove ${doc.name}">Remove</button>
                `;
                documentList.appendChild(li);
            });
            // Add event listeners to new remove buttons
            documentList.querySelectorAll('.remove-doc-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const docId = e.target.dataset.docid;
                    const docName = e.target.closest('li').querySelector('span').textContent.split(' ')[0]; // Get name for confirm message
                    if (confirm(`Are you sure you want to remove "${docName}" from the locker?`)) {
                        if (dataApi.removeDocumentFromLocker(docId)) {
                             renderDocumentList(); // Re-render the list
                             showStatusMessage('doc-upload-status', `Document "${docName}" removed.`, 'success');
                        } else {
                             showStatusMessage('doc-upload-status', `Error removing document "${docName}".`, 'error');
                        }
                    }
                });
            });
        }

        addDocBtn.addEventListener('click', () => {
             const fileInput = document.getElementById('doc-upload-input');
             const fileNameDisplay = document.getElementById('doc-file-name');

             if (fileInput.files.length > 0) {
                 const file = fileInput.files[0];
                 // Basic size check (e.g., < 5MB for prototype)
                 if (file.size > 5 * 1024 * 1024) {
                      showStatusMessage('doc-upload-status', 'File is too large (Max 5MB for prototype).', 'error');
                      return;
                 }

                 const docData = { name: file.name, type: file.type || 'Unknown' };

                 if (dataApi.addDocumentToLocker(docData)) {
                    showStatusMessage('doc-upload-status', `Document "${file.name}" added to locker.`, 'success');
                    renderDocumentList(); // Update list
                     // Reset file input display
                     fileInput.value = ''; // Clear the selected file
                     fileNameDisplay.textContent = 'No file chosen';
                 } else {
                      // Error message (e.g., duplicate) is handled by addDocumentToLocker alert
                       showStatusMessage('doc-upload-status', `Could not add document "${file.name}". It might already exist.`, 'error');
                 }
             } else {
                 showStatusMessage('doc-upload-status', 'Please choose a file first.', 'error');
             }
        });

        // Initial render
        renderDocumentList();
    }


    // --- Application Page Logic (Smart Application Flow 2.0) ---
    let currentJobId = null; // Store the jobId for the current application page globally for this scope
    let autoSaveTimeout = null;

    function initApplication() {
        console.log('Initializing Application Page');
        const applicationForm = document.getElementById('application-form');
        const progressBar = document.getElementById('application-progress');
        const autoSaveStatus = document.getElementById('auto-save-status');
        const submitBtn = document.getElementById('submit-application-btn');
        const validationSummary = document.getElementById('validation-summary');
        const applicationTitle = document.getElementById('application-title');
        const applicationHeaderTitle = document.getElementById('application-header-title');


        // Templates (ensure IDs match the HTML)
        const workExpTemplate = document.getElementById('work-experience-template');
        const eduTemplate = document.getElementById('education-template');

        // Get Job ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const jobIdFromUrl = urlParams.get('jobId');
        const isNewApplication = urlParams.get('new') === 'true' || !jobIdFromUrl;

        let pageTitle = "Apply for Job";
        let jobTitleDisplay = "New Job Application (Demo)"; // Default for new

        if (isNewApplication) {
            currentJobId = `new_${Date.now()}`; // Use a temporary, unique ID for auto-save
            console.log('Starting new application with temp Job ID:', currentJobId);
            // Clear any old 'new' auto-save (shouldn't exist with unique ID, but good practice)
            // dataApi.clearCurrentApplicationProgress(currentJobId); // No need if ID is unique
        } else {
            currentJobId = jobIdFromUrl;
             // Try loading existing application data from the *submitted* list
            const applications = dataApi.loadApplications();
            const existingApp = applications.find(app => app.jobId === currentJobId);
            if (existingApp) {
                 jobTitleDisplay = `${existingApp.jobTitle || 'Job ID ' + currentJobId}`;
                 pageTitle = `Editing: ${jobTitleDisplay}`;
                 console.log('Editing existing application:', currentJobId, existingApp);
            } else {
                // Job ID provided, but not found in submitted list - treat as potentially started but not submitted
                jobTitleDisplay = `Application for Job ID ${currentJobId}`;
                pageTitle = `Resume Application: ${jobTitleDisplay}`;
                console.log('Resuming application with Job ID:', currentJobId);
            }
        }

        // Set page titles
        document.title = pageTitle;
        applicationHeaderTitle.textContent = pageTitle;
        applicationTitle.textContent = jobTitleDisplay;


        // --- Data Loading & Pre-filling ---
        const profileData = dataApi.loadProfile();
        const savedProgress = dataApi.loadCurrentApplicationProgress(currentJobId); // Load auto-save specific to this job

        console.log("Profile Data:", profileData);
        console.log("Saved Progress:", savedProgress);

        // Populate form fields: Prioritize savedProgress > profileData > default empty
        function populateField(selector, savedValue, profileValue) {
            const field = applicationForm.querySelector(selector);
            if (field) {
                field.value = savedValue ?? profileValue ?? ''; // Use saved, fallback to profile, then empty
            }
        }

        // Personal Info
        populateField('#app-name', savedProgress?.name, profileData?.name);
        populateField('#app-email', savedProgress?.email, profileData?.email);
        populateField('#app-phone', savedProgress?.phone, profileData?.phone);
        populateField('#app-location', savedProgress?.location, profileData?.location);

        // Skills
        populateField('#app-skills', savedProgress?.skills, profileData?.skills);

        // Cover Letter & Additional Questions
        populateField('#app-cover-letter', savedProgress?.coverLetter, '');
        populateField('#app-q-salary', savedProgress?.desiredSalary, '');
        populateField('#app-q-startdate', savedProgress?.startDate, '');
        populateField('#app-q-referral', savedProgress?.referralSource, '');

        // --- Dynamic Lists (Work Exp, Edu) ---
        const appWorkExperienceList = document.getElementById('app-work-experience-list');
        const appEducationList = document.getElementById('app-education-list');

        // Prioritize saved progress lists, fallback to profile lists
        const workExperienceData = savedProgress?.workExperience ?? profileData?.workExperience ?? [];
        const educationData = savedProgress?.education ?? profileData?.education ?? [];

        const addAppWorkExperienceItem = (focus = true, clearPlaceholder = true) => {
             const item = addListItem(appWorkExperienceList, workExpTemplate, focus, clearPlaceholder);
             // Trigger updates after adding/removing items
              if (item) {
                  item.addEventListener('input', triggerAutoSave); // Auto-save on input within item
                  item.querySelector('.remove-item-btn')?.addEventListener('click', () => {
                     updateProgressBar();
                     triggerAutoSave(); // Also save when item removed
                 });
              }
             return item;
        };
        const addAppEducationItem = (focus = true, clearPlaceholder = true) => {
            const item = addListItem(appEducationList, eduTemplate, focus, clearPlaceholder);
             if (item) {
                  item.addEventListener('input', triggerAutoSave);
                  item.querySelector('.remove-item-btn')?.addEventListener('click', () => {
                      updateProgressBar();
                      triggerAutoSave();
                  });
             }
            return item;
        };

        renderListItems(appWorkExperienceList, workExperienceData, workExpTemplate, addAppWorkExperienceItem);
        renderListItems(appEducationList, educationData, eduTemplate, addAppEducationItem);

        // Add buttons for adding items directly in the application
         applicationForm.querySelector('.add-app-experience-btn').addEventListener('click', () => {
             addAppWorkExperienceItem();
             updateProgressBar(); // Update progress after adding structure
             triggerAutoSave();
         });
         applicationForm.querySelector('.add-app-education-btn').addEventListener('click', () => {
            addAppEducationItem();
            updateProgressBar();
            triggerAutoSave();
         });

        // --- Populate Document Selection ---
        const appDocumentList = document.getElementById('app-document-list');
        function renderAppDocumentSelection() {
            const documents = dataApi.loadDocuments();
            appDocumentList.innerHTML = ''; // Clear
             if (documents.length === 0) {
                appDocumentList.innerHTML = '<p class="no-docs-message text-muted">No documents found in locker. Please <a href="profile.html#document-locker" target="_blank">upload documents</a> to your profile first.</p>';
                return;
            }
            // Get selected documents from saved progress
            const selectedDocIds = savedProgress?.selectedDocuments || []; // Assume IDs are stored

            documents.forEach(doc => {
                const div = document.createElement('div');
                div.classList.add('doc-select-item');
                const checkboxId = `doc-select-${doc.id}`;
                const isChecked = selectedDocIds.includes(doc.id); // Check based on ID

                div.innerHTML = `
                    <input type="checkbox" id="${checkboxId}" name="selectedDocs" value="${doc.id}" ${isChecked ? 'checked' : ''}>
                    <label for="${checkboxId}">${doc.name} <small class="text-muted">(${doc.type || 'Unknown'})</small></label>
                `;
                appDocumentList.appendChild(div);
                 // Add event listener for auto-save and progress update on checkbox change
                 div.querySelector('input[type="checkbox"]').addEventListener('change', () => {
                    updateProgressBar();
                    triggerAutoSave();
                 });
            });
        }
        renderAppDocumentSelection();


        // --- Card Collapse/Expand ---
        applicationForm.querySelectorAll('.card-header').forEach(header => {
            const card = header.closest('.card');
            const content = card.querySelector('.card-content');
            const toggleBtn = header.querySelector('.toggle-card');

            // Initial state based on aria-expanded
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            if (!isExpanded && content) {
                content.classList.add('collapsed');
                if(toggleBtn) toggleBtn.textContent = '+';
                 if(toggleBtn) toggleBtn.setAttribute('aria-label', `Expand ${card.dataset.section || ''} Section`);
            }

            header.addEventListener('click', (e) => {
                // Don't toggle if the click was on the button itself (it handles its own event type)
                 if (e.target === toggleBtn || e.target.closest('.toggle-card')) return;

                if (content) {
                    const isCollapsed = content.classList.toggle('collapsed');
                    header.setAttribute('aria-expanded', !isCollapsed);
                    if (toggleBtn) {
                        toggleBtn.textContent = isCollapsed ? '+' : '-';
                        toggleBtn.setAttribute('aria-label', `${isCollapsed ? 'Expand' : 'Collapse'} ${card.dataset.section || ''} Section`);
                    }
                }
            });
            // Also allow button to toggle
             if(toggleBtn) {
                 toggleBtn.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent header click handler firing too
                     if (content) {
                         const isCollapsed = content.classList.toggle('collapsed');
                         header.setAttribute('aria-expanded', !isCollapsed);
                         toggleBtn.textContent = isCollapsed ? '+' : '-';
                         toggleBtn.setAttribute('aria-label', `${isCollapsed ? 'Expand' : 'Collapse'} ${card.dataset.section || ''} Section`);
                     }
                 });
             }
        });

        // --- Progress Bar Update Logic ---
        function updateProgressBar() {
            if (!progressBar) return;

            const requiredFields = Array.from(applicationForm.querySelectorAll('[required]'));
            const requiredCards = Array.from(applicationForm.querySelectorAll('.card.required'));
            let filledCount = 0;
            let totalRequiredCount = 0;

            // 1. Check direct required input fields
            requiredFields.forEach(field => {
                // Only count visible fields within non-collapsed required cards
                 const parentCard = field.closest('.card');
                 if (parentCard && parentCard.classList.contains('required') && !parentCard.querySelector('.card-content')?.classList.contains('collapsed')) {
                     totalRequiredCount++;
                     if (field.type === 'checkbox') {
                         if (field.checked) filledCount++;
                     } else if (field.value.trim() !== '') {
                         filledCount++;
                     }
                 }
            });

            // 2. Check required sections (dynamic lists, documents)
            requiredCards.forEach(card => {
                const section = card.dataset.section;
                 if (section === 'work-experience') {
                    totalRequiredCount++; // Count the section itself as required
                    if (appWorkExperienceList.children.length > 0 && appWorkExperienceList.querySelector('.experience-item')) { // Check if at least one item exists
                         // Check if the *first* required field within the *first* item is filled (simple check)
                         const firstItemRequiredInput = appWorkExperienceList.querySelector('.experience-item [required]');
                         if (firstItemRequiredInput && firstItemRequiredInput.value.trim() !== '') {
                              filledCount++;
                         }
                    }
                } else if (section === 'education' && card.classList.contains('required')) { // Only if education card IS required
                    totalRequiredCount++;
                    if (appEducationList.children.length > 0 && appEducationList.querySelector('.education-item')) {
                         const firstItemRequiredInput = appEducationList.querySelector('.education-item [required]');
                         if (firstItemRequiredInput && firstItemRequiredInput.value.trim() !== '') {
                             filledCount++;
                         }
                    }
                } else if (section === 'documents') {
                     totalRequiredCount++; // Assume document section always counts if required
                    const selectedDocs = appDocumentList.querySelectorAll('input[name="selectedDocs"]:checked').length;
                    const availableDocs = appDocumentList.querySelectorAll('input[name="selectedDocs"]').length;
                     // Only require selection if documents are available to select
                     if (availableDocs > 0 && selectedDocs > 0) {
                         filledCount++;
                     } else if (availableDocs === 0) {
                        // If no docs available, maybe count as complete? Or keep incomplete? Depends on rules.
                        // Let's count as complete if none available but section required (user can't do anything)
                        filledCount++;
                     }
                }
                // Add checks for other potential required sections (e.g., questions)
            });

            // Calculate percentage
            const progress = totalRequiredCount > 0 ? Math.min(100, Math.round((filledCount / totalRequiredCount) * 100)) : 0;
            progressBar.value = progress;
            // console.log(`Progress: ${filledCount} / ${totalRequiredCount} = ${progress}%`);
        }


        // --- Auto-Save Functionality ---
        function triggerAutoSave() {
             if (!currentJobId) return; // Don't save if no job ID context

            clearTimeout(autoSaveTimeout); // Debounce: reset timer on new input/change
            autoSaveTimeout = setTimeout(() => {
                const formData = getApplicationFormData(); // Get current form data
                dataApi.saveCurrentApplicationProgress(formData, currentJobId); // Pass current job ID
                 showStatusMessage('auto-save-status', `Auto-saved draft at ${new Date().toLocaleTimeString()}`, 'info', 3000);
                 // updateProgressBar(); // Progress updated separately on input/change
            }, 1800); // Auto-save 1.8 seconds after last input/change
        }

        // Add input/change listeners to trigger auto-save and progress update
        applicationForm.addEventListener('input', (e) => {
             // Only trigger if it's a form element that user interacts with directly
             if (e.target.matches('input, textarea, select')) {
                 updateProgressBar();
                 triggerAutoSave();
                 // Clear validation error style on input
                 if (e.target.classList.contains('validation-error')) {
                      e.target.classList.remove('validation-error');
                 }
             }
        });
        // Attach listeners specifically to dynamically added list items inside the addApp... functions


        // Helper to get all application form data
        function getApplicationFormData() {
            const formData = {};
            const formElements = applicationForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.type !== 'submit' && element.type !== 'button' && !element.closest('.remove-item-btn')) { // Exclude remove buttons etc.
                     if (element.type === 'checkbox') {
                        if (element.name === 'selectedDocs') { // Handle document selection by ID
                             if (!formData.selectedDocuments) formData.selectedDocuments = [];
                             if (element.checked) formData.selectedDocuments.push(element.value); // Value is the doc ID
                        } else {
                            // General checkbox handling (if any)
                            formData[element.name] = element.checked;
                        }
                    } else if (element.type === 'radio') {
                        if (element.checked) {
                            formData[element.name] = element.value;
                        }
                    }
                    else {
                        // Standard input, textarea, select
                        formData[element.name] = element.value;
                    }
                }
            }
             // Get dynamic list data
             formData.workExperience = getListItemsData(appWorkExperienceList, '.experience-item');
             formData.education = getListItemsData(appEducationList, '.education-item');
            return formData;
        }

        // --- Form Validation ---
        function validateForm() {
             validationSummary.innerHTML = ''; // Clear previous errors
             validationSummary.style.display = 'none';
             applicationForm.querySelectorAll('.validation-error').forEach(el => el.classList.remove('validation-error')); // Clear previous field errors

             let isValid = true;
             const errors = [];

             // 1. Check HTML5 required attributes within visible cards
             applicationForm.querySelectorAll('.card:not(:has(.collapsed)) [required]').forEach(field => {
                 if (!field.checkValidity()) {
                    isValid = false;
                    const label = applicationForm.querySelector(`label[for='${field.id}']`);
                    const fieldName = label ? label.textContent.replace('*','').trim() : (field.name || field.id);
                     // Check if error for this field already added (e.g., multiple inputs in one item)
                     const errorMsg = `Field "${fieldName}" in the "${field.closest('.card')?.querySelector('h3')?.textContent || 'section'}" is required.`;
                     if (!errors.includes(errorMsg)) {
                         errors.push(errorMsg);
                     }
                    field.classList.add('validation-error'); // Add error style
                     // Ensure card is expanded
                     const cardContent = field.closest('.card-content');
                     if (cardContent && cardContent.classList.contains('collapsed')) {
                         cardContent.classList.remove('collapsed');
                         cardContent.closest('.card').querySelector('.toggle-card').textContent = '-';
                         cardContent.closest('.card').querySelector('.card-header').setAttribute('aria-expanded', 'true');
                     }
                 }
             });

             // 2. Validate required sections (dynamic lists, documents)
             applicationForm.querySelectorAll('.card.required').forEach(card => {
                 const section = card.dataset.section;
                 if (section === 'work-experience' && appWorkExperienceList.querySelectorAll('.experience-item').length === 0) {
                     isValid = false;
                     errors.push("At least one Work Experience entry is required.");
                      card.classList.add('validation-error'); // Style card header maybe? Or add error message inside
                 } else if (section === 'education' && appEducationList.querySelectorAll('.education-item').length === 0) {
                     // Only add error IF this section is actually required
                     if (card.classList.contains('required')) {
                          isValid = false;
                          errors.push("At least one Education entry is required.");
                          card.classList.add('validation-error');
                     }
                 } else if (section === 'documents') {
                     const selectedDocs = appDocumentList.querySelectorAll('input[name="selectedDocs"]:checked').length;
                     const availableDocs = appDocumentList.querySelectorAll('input[name="selectedDocs"]').length;
                     // Only require selection if documents are available
                     if (availableDocs > 0 && selectedDocs === 0) {
                         isValid = false;
                         errors.push("Please select at least one document (e.g., Resume) to attach.");
                         card.classList.add('validation-error');
                     }
                 }
                  // Add validation for other custom required sections here
             });


             if (!isValid) {
                 // Display validation errors
                 validationSummary.innerHTML = '<strong>Please review the following issues:</strong><ul>' +
                                              errors.map(err => `<li>${err}</li>`).join('') +
                                              '</ul>';
                 validationSummary.style.display = 'block';
                  validationSummary.focus(); // Focus for accessibility
                  validationSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 console.warn('Validation failed:', errors);
             }

             return isValid;
        }


        // --- Form Submission ---
        applicationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (validateForm()) {
                // Simulate submission
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting... Please Wait';

                const finalApplicationData = getApplicationFormData();

                // Get the job title from the page H2 for saving
                const jobTitle = applicationTitle.textContent.replace('Applying for: ', '').replace('Editing: ','').replace('Resume Application: ','');

                const submissionPayload = {
                    jobId: currentJobId, // Use the ID established for this page session
                    jobTitle: jobTitle,
                    formData: finalApplicationData,
                    // Status and dates are handled by addOrUpdateSubmittedApplication
                };

                 console.log('Submitting application payload:', submissionPayload);

                // Simulate network delay
                setTimeout(() => {
                    // Add/Update submitted applications list
                     dataApi.addOrUpdateSubmittedApplication(submissionPayload);
                    // Clear auto-save for this application session
                    dataApi.clearCurrentApplicationProgress(currentJobId);

                    // Redirect to dashboard with success message (optional query param for message?)
                    alert('Application Submitted Successfully! (Prototype)');
                    window.location.href = 'dashboard.html'; // Redirect after successful pseudo-submit

                }, 1200); // Simulate 1.2 second network delay

            } else {
                // Validation failed, errors displayed by validateForm()
                submitBtn.disabled = false; // Re-enable button
                submitBtn.textContent = 'Submit Application';
            }
        });

        updateProgressBar();

    } 

});