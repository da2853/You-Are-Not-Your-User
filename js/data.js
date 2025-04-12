// js/data.js - Handles interaction with localStorage for the prototype

const PROFILE_KEY = 'jobAppPrototype_profile';
const APPLICATIONS_KEY = 'jobAppPrototype_applications';
const DOCUMENTS_KEY = 'jobAppPrototype_documents';
const CURRENT_APP_KEY = 'jobAppPrototype_currentApp'; // For auto-save

/**
 * Saves the user's profile data to localStorage.
 * @param {object} profileData - The profile data object.
 */
function saveProfile(profileData) {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
        console.log('Profile saved.');
        return true;
    } catch (e) {
        console.error('Error saving profile to localStorage:', e);
        return false;
    }
}

/**
 * Loads the user's profile data from localStorage.
 * @returns {object | null} The profile data object or null if not found/error.
 */
function loadProfile() {
    try {
        const profileJson = localStorage.getItem(PROFILE_KEY);
        return profileJson ? JSON.parse(profileJson) : null;
    } catch (e) {
        console.error('Error loading profile from localStorage:', e);
        return null;
    }
}

/**
 * Saves the list of submitted applications to localStorage.
 * @param {Array<object>} applications - Array of application objects.
 */
function saveApplications(applications) {
     try {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
         console.log('Applications saved.');
    } catch (e) {
        console.error('Error saving applications to localStorage:', e);
    }
}

/**
 * Loads the list of submitted applications from localStorage.
 * @returns {Array<object>} Array of application objects or an empty array.
 */
function loadApplications() {
    try {
        const applicationsJson = localStorage.getItem(APPLICATIONS_KEY);
        return applicationsJson ? JSON.parse(applicationsJson) : [];
    } catch (e) {
        console.error('Error loading applications from localStorage:', e);
        return [];
    }
}

/**
 * Adds a single submitted application to the list.
 * @param {object} applicationData - The application data to add.
 */
function addSubmittedApplication(applicationData) {
    const applications = loadApplications();
    // Assign a simple ID (in a real app, this would be server-generated)
    applicationData.id = Date.now().toString();
    applicationData.submittedDate = new Date().toLocaleDateString();
    applicationData.status = 'Submitted'; // Initial status
    applications.push(applicationData);
    saveApplications(applications);
}


/**
 * Saves the user's uploaded documents (metadata) to localStorage.
 * @param {Array<object>} documents - Array of document objects {name: string, type: string}.
 */
function saveDocuments(documents) {
     try {
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
         console.log('Documents saved.');
    } catch (e) {
        console.error('Error saving documents to localStorage:', e);
    }
}

/**
 * Loads the user's uploaded documents (metadata) from localStorage.
 * @returns {Array<object>} Array of document objects or an empty array.
 */
function loadDocuments() {
    try {
        const documentsJson = localStorage.getItem(DOCUMENTS_KEY);
        return documentsJson ? JSON.parse(documentsJson) : [];
    } catch (e) {
        console.error('Error loading documents from localStorage:', e);
        return [];
    }
}
/**
 * Adds a single document to the locker.
 * @param {object} docData - The document data {name: string, type: string}.
 */
function addDocumentToLocker(docData) {
    const documents = loadDocuments();
    // Avoid duplicates (simple check by name)
    if (!documents.some(doc => doc.name === docData.name)) {
        documents.push(docData);
        saveDocuments(documents);
        return true;
    }
    console.warn(`Document named "${docData.name}" already exists.`);
    return false;
}

/**
 * Removes a document from the locker by name.
 * @param {string} docName - The name of the document to remove.
 */
function removeDocumentFromLocker(docName) {
    let documents = loadDocuments();
    documents = documents.filter(doc => doc.name !== docName);
    saveDocuments(documents);
    console.log(`Document "${docName}" removed.`);
}


/**
 * Saves the current state of the application form (auto-save).
 * @param {object} applicationFormData - Data from the application form.
 * @param {string} jobId - Identifier for the job being applied to.
 */
function saveCurrentApplicationProgress(applicationFormData, jobId) {
    try {
        const currentAppData = { jobId, formData: applicationFormData, lastSaved: Date.now() };
        localStorage.setItem(CURRENT_APP_KEY, JSON.stringify(currentAppData));
        console.log(`Auto-saved progress for job ${jobId}`);
    } catch (e) {
        console.error('Error auto-saving application progress:', e);
    }
}

/**
 * Loads the saved state of the application form.
 * @param {string} jobId - Identifier for the job being applied to.
 * @returns {object | null} The saved form data or null.
 */
function loadCurrentApplicationProgress(jobId) {
     try {
        const currentAppJson = localStorage.getItem(CURRENT_APP_KEY);
        if (currentAppJson) {
            const currentAppData = JSON.parse(currentAppJson);
            // Only return data if it matches the current job ID
            if (currentAppData.jobId === jobId) {
                 console.log(`Loaded saved progress for job ${jobId}`);
                return currentAppData.formData;
            }
        }
        return null;
    } catch (e) {
        console.error('Error loading application progress:', e);
        return null;
    }
}

/**
 * Clears the auto-saved application progress.
 */
function clearCurrentApplicationProgress() {
    try {
        localStorage.removeItem(CURRENT_APP_KEY);
        console.log('Cleared auto-saved application progress.');
    } catch (e) {
         console.error('Error clearing application progress:', e);
    }
}

// Make functions available globally or export if using modules (simple global for this prototype)
window.dataApi = {
    saveProfile,
    loadProfile,
    saveApplications,
    loadApplications,
    addSubmittedApplication,
    saveDocuments,
    loadDocuments,
    addDocumentToLocker,
    removeDocumentFromLocker,
    saveCurrentApplicationProgress,
    loadCurrentApplicationProgress,
    clearCurrentApplicationProgress
};