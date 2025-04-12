
// js/main.js - Core interactivity for the prototype

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    console.log(`Initializing page: ${currentPage}`);

    // --- Common Elements ---
    const statusMessages = document.querySelectorAll('.status-message');

    // Clear status messages after a delay
    const clearStatusMessages = () => {
        setTimeout(() => {
            statusMessages.forEach(el => el.textContent = '');
        }, 4000); // Clear after 4 seconds
    };

    // --- Page Initializers ---
    if (currentPage === 'dashboard.html' || currentPage === '') { // Treat root as dashboard too
        initDashboard();
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

        if (applications.length === 0) {
            applicationsList.innerHTML = '<p>You have no submitted applications yet.</p>';
            return;
        }

        applicationsList.innerHTML = ''; // Clear loading message
        applications.forEach(app => {
            const item = document.createElement('div');
            item.classList.add('application-item');
            // In a real app, status would change based on backend data
            let randomStatus = app.status || 'Submitted'; // Use saved status or default
            if (randomStatus === 'Submitted' && Math.random() > 0.7) randomStatus = 'In Review';
            if (randomStatus === 'In Review' && Math.random() > 0.8) randomStatus = 'Interview';

            item.innerHTML = `
                <span><strong>Job:</strong> ${app.jobTitle || 'N/A'}</span>
                <span><strong>Company:</strong> ${app.formData?.company || 'N/A'}</span>
                <span><strong>Submitted:</strong> ${app.submittedDate || 'N/A'}</span>
                <span class="status status-${randomStatus.toLowerCase().replace(' ', '-')}">${randomStatus}</span>
                <a href="apply.html?jobId=${app.id}" class="btn btn-secondary btn-small">View/Edit</a>
            `;
            applicationsList.appendChild(item);
        });
    }

    // --- Profile Page Logic ---
    function initProfile() {
        console.log('Initializing Profile Page');
        const profileForm = document.getElementById('profile-form');
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        const locationInput = document.getElementById('profile-location');
        const skillsInput = document.getElementById('profile-skills');
        const saveStatus = document.getElementById('profile-save-status');
        const parseResumeBtn = document.getElementById('parse-resume-btn');
        const resumeUploadBtn = document.getElementById('resume-upload-btn');
        const resumeUploadInput = document.getElementById('resume-upload-input');
        const resumeFileName = document.getElementById('resume-file-name');
        const parseStatus = document.getElementById('parse-status');

        const workExperienceList = document.getElementById('work-experience-list');
        const addExperienceBtn = document.getElementById('add-experience-btn');
        const educationList = document.getElementById('education-list');
        const addEducationBtn = document.getElementById('add-education-btn');

        const documentList = document.getElementById('document-list');
        const docUploadBtn = document.getElementById('doc-upload-btn');
        const docUploadInput = document.getElementById('doc-upload-input');
        const docFileName = document.getElementById('doc-file-name');
        const addDocBtn = document.getElementById('add-doc-btn');
        const docUploadStatus = document.getElementById('doc-upload-status');

        // Templates
        const workExpTemplate = document.getElementById('work-experience-template');
        const eduTemplate = document.getElementById('education-template');

        // Load existing profile data
        const profileData = dataApi.loadProfile() || { workExperience: [], education: [], skills: '' };
        if (profileData) {
            nameInput.value = profileData.name || '';
            emailInput.value = profileData.email || '';
            phoneInput.value = profileData.phone || '';
            locationInput.value = profileData.location || '';
            skillsInput.value = profileData.skills || '';
            renderListItems(workExperienceList, profileData.workExperience || [], workExpTemplate, addWorkExperienceItem);
            renderListItems(educationList, profileData.education || [], eduTemplate, addEducationItem);
        }

        // Save profile handler
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedProfile = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                location: locationInput.value.trim(),
                skills: skillsInput.value.trim(),
                workExperience: getListItemsData(workExperienceList, '.experience-item'),
                education: getListItemsData(educationList, '.education-item'),
            };
            if (dataApi.saveProfile(updatedProfile)) {
                 saveStatus.textContent = 'Profile saved successfully!';
                 saveStatus.style.display = 'block';
            } else {
                 saveStatus.textContent = 'Error saving profile.';
                 saveStatus.style.display = 'block';
            }
             clearStatusMessages();
        });

        // --- Dynamic List Handling ---
        function renderListItems(listElement, items, template, addItemFunction) {
             listElement.innerHTML = ''; // Clear existing
             items.forEach(itemData => {
                const newItem = addItemFunction(false); // Add without saving immediately
                 // Populate the new item with data
                 Object.keys(itemData).forEach(key => {
                     const input = newItem.querySelector(`[name=${key}]`);
                     if (input) {
                         input.value = itemData[key];
                     }
                 });
             });
        }

        function getListItemsData(listElement, itemSelector) {
             const items = listElement.querySelectorAll(itemSelector);
             const data = [];
             items.forEach(item => {
                 const itemData = {};
                 const inputs = item.querySelectorAll('input, textarea');
                 inputs.forEach(input => {
                     if (input.name) {
                         itemData[input.name] = input.value.trim();
                     }
                 });
                 // Only add if some data exists (e.g., jobTitle or institution)
                 if (Object.values(itemData).some(val => val !== '')) {
                    data.push(itemData);
                 }
             });
             return data;
        }

        function addListItem(listElement, template) {
            const clone = template.content.cloneNode(true);
            const newItem = clone.querySelector('div'); // Assuming the template's root is a div
            listElement.appendChild(newItem);
             // Add remove functionality
             const removeBtn = newItem.querySelector('.remove-item-btn');
             if (removeBtn) {
                 removeBtn.addEventListener('click', () => {
                     newItem.remove();
                     // Maybe trigger profile save? For now, user must click save manually.
                 });
             }
            return newItem; // Return the added element
        }

        const addWorkExperienceItem = (focus = true) => {
             const newItem = addListItem(workExperienceList, workExpTemplate);
             if (focus) newItem.querySelector('input')?.focus(); // Focus first input
             return newItem;
        };
        const addEducationItem = (focus = true) => {
            const newItem = addListItem(educationList, eduTemplate);
             if (focus) newItem.querySelector('input')?.focus(); // Focus first input
            return newItem;
        };

        addExperienceBtn.addEventListener('click', () => addWorkExperienceItem());
        addEducationBtn.addEventListener('click', () => addEducationItem());


        // --- Resume Parsing Simulation ---
         resumeUploadBtn.addEventListener('click', () => resumeUploadInput.click());
         resumeUploadInput.addEventListener('change', (e) => {
             resumeFileName.textContent = e.target.files.length > 0 ? e.target.files[0].name : 'No file chosen';
         });

        parseResumeBtn.addEventListener('click', () => {
             parseStatus.textContent = 'Parsing resume... (Simulated)';
             parseStatus.style.display = 'block';
             // Simulate parsing delay and pre-fill
             setTimeout(() => {
                 nameInput.value = profileData?.name || 'Jane Doe (Parsed)';
                 emailInput.value = profileData?.email || 'jane.doe.parsed@email.com';
                 phoneInput.value = profileData?.phone || '555-123-4567';
                 locationInput.value = profileData?.location || 'Anytown, USA';
                 skillsInput.value = (profileData?.skills ? profileData.skills + ', ' : '') + 'Simulated Skill 1, Simulated Skill 2';

                 // Add dummy experience/education if lists are empty
                 if (workExperienceList.children.length === 0) {
                     const expItem = addWorkExperienceItem(false);
                     expItem.querySelector('[name=jobTitle]').value = 'Software Engineer (Parsed)';
                     expItem.querySelector('[name=company]').value = 'Tech Solutions Inc.';
                     expItem.querySelector('[name=duration]').value = 'Jan 2021 - Present';
                     expItem.querySelector('[name=description]').value = 'Developed web applications using simulated tech.';
                 }
                 if (educationList.children.length === 0) {
                     const eduItem = addEducationItem(false);
                     eduItem.querySelector('[name=institution]').value = 'State University (Parsed)';
                     eduItem.querySelector('[name=degree]').value = 'B.S. Computer Science';
                     eduItem.querySelector('[name=eduDuration]').value = '2017 - 2021';
                 }

                 parseStatus.textContent = 'Resume parsed and profile pre-filled! Please review and save.';
                 clearStatusMessages();
             }, 1500); // Simulate 1.5 second parse time
        });

        // --- Document Locker ---
        function renderDocumentList() {
            const documents = dataApi.loadDocuments();
            documentList.innerHTML = ''; // Clear
            if (documents.length === 0) {
                documentList.innerHTML = '<li>No documents uploaded yet.</li>';
                return;
            }
            documents.forEach(doc => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${doc.name} (${doc.type})</span>
                    <button type="button" class="btn btn-danger btn-small remove-doc-btn" data-docname="${doc.name}">Remove</button>
                `;
                documentList.appendChild(li);
            });
            // Add event listeners to new remove buttons
            documentList.querySelectorAll('.remove-doc-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const docName = e.target.dataset.docname;
                    if (confirm(`Are you sure you want to remove "${docName}"?`)) {
                        dataApi.removeDocumentFromLocker(docName);
                        renderDocumentList(); // Re-render the list
                    }
                });
            });
        }

         docUploadBtn.addEventListener('click', () => docUploadInput.click());
         docUploadInput.addEventListener('change', (e) => {
             docFileName.textContent = e.target.files.length > 0 ? e.target.files[0].name : 'No file chosen';
         });

        addDocBtn.addEventListener('click', () => {
             const fileInput = docUploadInput;
             if (fileInput.files.length > 0) {
                 const file = fileInput.files[0];
                 const docData = { name: file.name, type: file.type || 'Unknown' };
                 if (dataApi.addDocumentToLocker(docData)) {
                    docUploadStatus.textContent = `Document "${file.name}" added to locker.`;
                    docUploadStatus.style.display = 'block';
                    renderDocumentList(); // Update list
                     // Reset file input display
                     fileInput.value = ''; // Clear the selected file
                     docFileName.textContent = 'No file chosen';
                 } else {
                      docUploadStatus.textContent = `Document "${file.name}" already exists or error occurred.`;
                      docUploadStatus.style.display = 'block';
                 }
             } else {
                 docUploadStatus.textContent = 'Please choose a file first.';
                 docUploadStatus.style.display = 'block';
             }
            clearStatusMessages();
        });

        // Initial render
        renderDocumentList();
    }


    // --- Application Page Logic ---
    function initApplication() {
        console.log('Initializing Application Page');
        const applicationForm = document.getElementById('application-form');
        const progressBar = document.getElementById('application-progress');
        const autoSaveStatus = document.getElementById('auto-save-status');
        const submitBtn = document.getElementById('submit-application-btn');
        const validationSummary = document.getElementById('validation-summary');
        const applicationTitle = document.getElementById('application-title');

        // Templates
        const workExpTemplate = document.getElementById('work-experience-template');
        const eduTemplate = document.getElementById('education-template');

        // Get Job ID from URL (if editing/viewing an existing application)
        const urlParams = new URLSearchParams(window.location.search);
        let jobId = urlParams.get('jobId');
        const isNewApplication = urlParams.get('new') === 'true';

        // If it's a new application, generate a temporary ID for auto-save
        if (isNewApplication || !jobId) {
            jobId = `new_${Date.now()}`; // Temporary ID for new app
            applicationTitle.textContent = 'Apply for New Job (Demo)';
            console.log('Starting new application with temp ID:', jobId);
            // Clear any previous auto-save for 'new'
            dataApi.clearCurrentApplicationProgress();
        } else {
             // Try loading existing application data (if feature implemented)
            const applications = dataApi.loadApplications();
            const existingApp = applications.find(app => app.id === jobId);
            if (existingApp) {
                 applicationTitle.textContent = `Editing Application for: ${existingApp.jobTitle || 'Job ID ' + jobId}`;
                 // Populate form with existingApp.formData (more complex, needs careful mapping)
                console.log('Editing existing application:', jobId);
            } else {
                applicationTitle.textContent = `Apply for Job ID: ${jobId}`; // Fallback
            }
        }


        // Load profile data to pre-fill
        const profileData = dataApi.loadProfile() || {};
        const appWorkExperienceList = document.getElementById('app-work-experience-list');
        const appEducationList = document.getElementById('app-education-list');
        const appSkillsInput = document.getElementById('app-skills');
        const appDocumentList = document.getElementById('app-document-list');

        // Attempt to load auto-saved progress for this specific job ID
        const savedProgress = dataApi.loadCurrentApplicationProgress(jobId);

        // Populate Personal Info (use saved progress > profile > default)
        applicationForm.querySelector('#app-name').value = savedProgress?.name || profileData.name || '';
        applicationForm.querySelector('#app-email').value = savedProgress?.email || profileData.email || '';
        applicationForm.querySelector('#app-phone').value = savedProgress?.phone || profileData.phone || '';
        applicationForm.querySelector('#app-location').value = savedProgress?.location || profileData.location || '';

        // Populate Skills (use saved progress > profile > default)
        appSkillsInput.value = savedProgress?.skills || profileData.skills || '';

         // Populate Cover Letter (use saved progress > default)
         applicationForm.querySelector('#app-cover-letter').value = savedProgress?.coverLetter || '';
         // Populate Additional Questions
         applicationForm.querySelector('#app-q-salary').value = savedProgress?.desiredSalary || '';
         applicationForm.querySelector('#app-q-startdate').value = savedProgress?.startDate || '';
         applicationForm.querySelector('#app-q-referral').value = savedProgress?.referralSource || '';

        // Function to render dynamic lists (Work Exp, Edu) in application form
        function renderAppListItems(listElement, items, template) {
            listElement.innerHTML = ''; // Clear existing
            items.forEach(itemData => {
                const clone = template.content.cloneNode(true);
                const newItem = clone.querySelector('div');
                 // Populate the new item with data
                 Object.keys(itemData).forEach(key => {
                     const input = newItem.querySelector(`[name=${key}]`);
                     if (input) {
                         input.value = itemData[key];
                     }
                 });
                  // Add remove functionality
                 const removeBtn = newItem.querySelector('.remove-item-btn');
                 if (removeBtn) {
                     removeBtn.addEventListener('click', () => newItem.remove());
                 }
                listElement.appendChild(newItem);
            });
        }

        // Populate Work Experience & Education (use saved progress > profile)
        renderAppListItems(appWorkExperienceList, savedProgress?.workExperience || profileData.workExperience || [], workExpTemplate);
        renderAppListItems(appEducationList, savedProgress?.education || profileData.education || [], eduTemplate);

        // Add buttons for adding items directly in the application
         applicationForm.querySelector('.add-app-experience-btn').addEventListener('click', () => {
             addListItem(appWorkExperienceList, workExpTemplate).querySelector('input')?.focus();
         });
         applicationForm.querySelector('.add-app-education-btn').addEventListener('click', () => {
            addListItem(appEducationList, eduTemplate).querySelector('input')?.focus();
         });


        // Populate Document Selection
        function renderAppDocumentSelection() {
            const documents = dataApi.loadDocuments();
            appDocumentList.innerHTML = ''; // Clear
             if (documents.length === 0) {
                appDocumentList.innerHTML = '<p>No documents found in locker. Please <a href="profile.html" target="_blank">upload documents</a> to your profile.</p>';
                return;
            }
            documents.forEach(doc => {
                const div = document.createElement('div');
                div.classList.add('doc-select-item');
                const checkboxId = `doc-${doc.name.replace(/[^a-zA-Z0-9]/g, '-')}`; // Create safe ID
                const isChecked = savedProgress?.selectedDocuments?.includes(doc.name); // Check if saved
                div.innerHTML = `
                    <input type="checkbox" id="${checkboxId}" name="selectedDocs" value="${doc.name}" ${isChecked ? 'checked' : ''}>
                    <label for="${checkboxId}">${doc.name} (${doc.type})</label>
                `;
                appDocumentList.appendChild(div);
            });
        }
        renderAppDocumentSelection();


        // --- Card Collapse/Expand ---
        applicationForm.querySelectorAll('.toggle-card').forEach(button => {
            button.addEventListener('click', (e) => {
                const cardContent = e.target.closest('.card').querySelector('.card-content');
                const isCollapsed = cardContent.classList.toggle('collapsed');
                e.target.textContent = isCollapsed ? '+' : '-';
            });
        });

        // --- Progress Bar Update ---
        function updateProgressBar() {
            const requiredFields = applicationForm.querySelectorAll('[required]');
            const totalRequired = requiredFields.length;
            let filledRequired = 0;
            requiredFields.forEach(field => {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    if (field.checked) filledRequired++;
                } else if (field.value.trim() !== '') {
                    filledRequired++;
                }
                // Basic check for required document selection (at least one checked)
                if (applicationForm.querySelector('#app-document-list input[type="checkbox"]:checked')) {
                   // Consider document requirement met if at least one is checked
                   // This logic might need refinement based on specific requirements
                }
            });
            // Add checks for dynamic required lists (experience, education)
            const requiredExpItems = appWorkExperienceList.querySelectorAll('.experience-item input[required]');
            let filledExpItems = 0;
             requiredExpItems.forEach(input => { if (input.value.trim() !== '') filledExpItems++; });
            // Simple check: consider required if at least one item has required fields filled
            if(appWorkExperienceList.children.length > 0 && filledExpItems > 0) filledRequired++; // Increment if *any* valid exp exists

            const requiredEduItems = appEducationList.querySelectorAll('.education-item input[required]');
            let filledEduItems = 0;
            requiredEduItems.forEach(input => { if (input.value.trim() !== '') filledEduItems++; });
             if(appEducationList.children.length > 0 && filledEduItems > 0) filledRequired++; // Increment if *any* valid edu exists


             // Very rough progress estimate - refine as needed
            const progress = totalRequired > 0 ? Math.min(100, Math.round((filledRequired / (totalRequired + 2)) * 100)) : 0; // +2 for list sections
            progressBar.value = progress;
        }


        // --- Auto-Save Functionality ---
        let autoSaveTimeout;
        applicationForm.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout); // Debounce: reset timer on new input
            autoSaveTimeout = setTimeout(() => {
                const formData = getApplicationFormData(); // Get current form data
                dataApi.saveCurrentApplicationProgress(formData, jobId); // Pass current job ID
                autoSaveStatus.textContent = `Auto-saved progress at ${new Date().toLocaleTimeString()}`;
                autoSaveStatus.style.display = 'block';
                updateProgressBar(); // Update progress on change
                clearStatusMessages();
            }, 1500); // Auto-save 1.5 seconds after last input
        });

        // Helper to get all form data for saving/submitting
        function getApplicationFormData() {
            const formData = {};
            const formElements = applicationForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.type !== 'submit' && element.type !== 'button') {
                     if (element.type === 'checkbox') {
                        if (element.name === 'selectedDocs') { // Handle document selection separately
                             if (!formData.selectedDocuments) formData.selectedDocuments = [];
                             if (element.checked) formData.selectedDocuments.push(element.value);
                        } else {
                            formData[element.name] = element.checked;
                        }
                    } else if (element.type === 'radio') {
                        if (element.checked) {
                            formData[element.name] = element.value;
                        }
                    }
                    else {
                        formData[element.name] = element.value;
                    }
                }
            }
             // Get dynamic list data
             formData.workExperience = getListItemsData(appWorkExperienceList, '.experience-item');
             formData.education = getListItemsData(appEducationList, '.education-item');
             // Add any other specific fields if needed
            return formData;
        }

        // Helper from Profile page adapted for Application page lists
         function getListItemsData(listElement, itemSelector) {
             const items = listElement.querySelectorAll(itemSelector);
             const data = [];
             items.forEach(item => {
                 const itemData = {};
                 const inputs = item.querySelectorAll('input, textarea');
                 inputs.forEach(input => {
                     if (input.name) {
                         itemData[input.name] = input.value.trim();
                     }
                 });
                 if (Object.values(itemData).some(val => val !== '')) {
                    data.push(itemData);
                 }
             });
             return data;
        }
         function addListItem(listElement, template) {
            const clone = template.content.cloneNode(true);
            const newItem = clone.querySelector('div');
            listElement.appendChild(newItem);
             const removeBtn = newItem.querySelector('.remove-item-btn');
             if (removeBtn) {
                 removeBtn.addEventListener('click', () => newItem.remove());
             }
            return newItem;
        }


        // --- Form Submission ---
        applicationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            validationSummary.innerHTML = ''; // Clear previous errors
            validationSummary.style.display = 'none';

            // Basic validation (check HTML5 required attribute)
            let isValid = true;
            const errors = [];
            applicationForm.querySelectorAll('[required]').forEach(field => {
                // Expand card if field is invalid and card is collapsed
                const cardContent = field.closest('.card-content');
                 if (!field.checkValidity()) {
                    isValid = false;
                    const label = applicationForm.querySelector(`label[for='${field.id}']`);
                    const fieldName = label ? label.textContent : (field.name || field.id);
                    errors.push(`Field "${fieldName}" is required.`);
                     // Expand the card if needed
                     if (cardContent && cardContent.classList.contains('collapsed')) {
                         cardContent.classList.remove('collapsed');
                         cardContent.closest('.card').querySelector('.toggle-card').textContent = '-';
                     }
                     // Optional: Add visual indication to the field itself
                     field.style.borderColor = '#dc3545'; // Red border
                 } else {
                     field.style.borderColor = ''; // Reset border color
                 }
            });

            // Validate required documents (at least one selected)
            const docCard = applicationForm.querySelector('[data-section="documents"]');
            if (docCard.classList.contains('required')) {
                 const selectedDocs = applicationForm.querySelectorAll('input[name="selectedDocs"]:checked').length;
                 const availableDocs = applicationForm.querySelectorAll('input[name="selectedDocs"]').length;
                 if (availableDocs > 0 && selectedDocs === 0) { // Only require if docs are available
                    isValid = false;
                    errors.push("Please select at least one document (e.g., Resume).");
                     const cardContent = docCard.querySelector('.card-content');
                     if (cardContent && cardContent.classList.contains('collapsed')) {
                         cardContent.classList.remove('collapsed');
                         docCard.querySelector('.toggle-card').textContent = '-';
                     }
                 }
            }
             // Validate required lists (experience, education) - at least one item
            if (appWorkExperienceList.closest('.card.required') && appWorkExperienceList.children.length === 0) {
                isValid = false;
                errors.push("Please add at least one Work Experience entry.");
            }
             if (appEducationList.closest('.card.required') && appEducationList.children.length === 0) {
                isValid = false;
                errors.push("Please add at least one Education entry.");
            }


            if (isValid) {
                // Simulate submission
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                const finalApplicationData = getApplicationFormData();
                 // Use a placeholder job title if not editing an existing one
                 const jobTitle = applicationTitle.textContent.startsWith('Apply for') ?
                                  'Demo Job - ' + new Date().toLocaleTimeString() :
                                  applicationTitle.textContent.replace('Editing Application for: ', '');

                const submissionPayload = {
                    jobId: jobId, // Include the ID used during editing/saving
                    jobTitle: jobTitle, // Add a job title
                    formData: finalApplicationData,
                    // Add timestamp, status etc. in dataApi.addSubmittedApplication
                };

                 console.log('Submitting application:', submissionPayload);

                setTimeout(() => {
                    // Add to submitted applications list
                     dataApi.addSubmittedApplication(submissionPayload);
                    // Clear auto-save for this application
                    dataApi.clearCurrentApplicationProgress();

                    // Redirect to dashboard or show success message
                    alert('Application Submitted Successfully! (Prototype)');
                    window.location.href = 'dashboard.html';

                }, 1000); // Simulate network delay

            } else {
                // Display validation errors
                validationSummary.innerHTML = '<strong>Please fix the following issues:</strong><ul>' +
                                             errors.map(err => `<li>${err}</li>`).join('') +
                                             '</ul>';
                validationSummary.style.display = 'block';
                 validationSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 console.warn('Validation failed:', errors);
            }
        });

        // Initial progress bar update
        updateProgressBar();
    }

}); // End DOMContentLoaded