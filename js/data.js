// js/data.js - Handles interaction with localStorage for the prototype

const PROFILE_KEY = 'jobAppPrototype_profile_v2'; // Added version suffix
const APPLICATIONS_KEY = 'jobAppPrototype_applications_v2';
const DOCUMENTS_KEY = 'jobAppPrototype_documents_v2';
const CURRENT_APP_KEY_PREFIX = 'jobAppPrototype_currentApp_v2_'; // Prefix for specific job auto-save

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
        alert('Error saving profile. Local storage might be full or disabled.');
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
        // Provide default structure if nothing exists
        const defaultProfile = { name: '', email: '', phone: '', location: '', skills: '', workExperience: [], education: [] };
        return profileJson ? JSON.parse(profileJson) : defaultProfile;
    } catch (e) {
        console.error('Error loading profile from localStorage:', e);
        return null; // Indicate error
    }
}

/**
 * Saves the list of submitted applications to localStorage.
 * @param {Array<object>} applications - Array of application objects.
 */
function saveApplications(applications) {
     try {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
         console.log('Applications list saved.');
    } catch (e) {
        console.error('Error saving applications to localStorage:', e);
         alert('Error saving applications list. Local storage might be full or disabled.');
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
        return []; // Return empty on error
    }
}

/**
 * Adds or updates a submitted application in the list.
 * If an app with the same jobId exists, it updates it. Otherwise, adds it.
 * @param {object} applicationData - The application data to add/update. Must include a unique 'jobId'.
 */
function addOrUpdateSubmittedApplication(applicationData) {
    if (!applicationData || !applicationData.jobId) {
        console.error("Cannot save application without a jobId.");
        return;
    }
    const applications = loadApplications();
    const existingIndex = applications.findIndex(app => app.jobId === applicationData.jobId);

    const appToSave = {
        ...applicationData,
        submittedDate: new Date().toLocaleDateString(),
        lastUpdated: new Date().toISOString(),
        // Keep existing status if updating, otherwise set to Submitted
        status: existingIndex > -1 ? applications[existingIndex].status : 'Submitted'
    };

    if (existingIndex > -1) {
        // Update existing application
        applications[existingIndex] = appToSave;
        console.log(`Application updated: ${applicationData.jobId}`);
    } else {
        // Add new application
        // Assign a unique ID if it's a truly new submission (not an edit)
        if (!appToSave.id) { // Ensure we dont overwrite an existing ID if it was an edit
             appToSave.id = `app_${Date.now()}`;
        }
        applications.push(appToSave);
        console.log(`Application added: ${applicationData.jobId}`);
    }
    saveApplications(applications);
}


/**
 * Saves the user's uploaded documents (metadata) to localStorage.
 * @param {Array<object>} documents - Array of document objects {name: string, type: string, id: string}.
 */
function saveDocuments(documents) {
     try {
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
         console.log('Documents saved.');
    } catch (e) {
        console.error('Error saving documents to localStorage:', e);
         alert('Error saving documents. Local storage might be full or disabled.');
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
 * Adds a single document to the locker. Assigns a unique ID.
 * @param {object} docData - The document data {name: string, type: string}.
 * @returns {boolean} True if added, false if duplicate name or error.
 */
function addDocumentToLocker(docData) {
    const documents = loadDocuments();
    // Check for duplicate names
    if (documents.some(doc => doc.name.toLowerCase() === docData.name.toLowerCase())) {
        console.warn(`Document named "${docData.name}" already exists.`);
        alert(`A document named "${docData.name}" already exists in the locker.`);
        return false;
    }
    // Add a simple unique ID
    docData.id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    documents.push(docData);
    saveDocuments(documents);
    console.log(`Document "${docData.name}" added with ID ${docData.id}.`);
    return true;
}

/**
 * Removes a document from the locker by its unique ID.
 * @param {string} docId - The unique ID of the document to remove.
 */
function removeDocumentFromLocker(docId) {
    let documents = loadDocuments();
    const initialLength = documents.length;
    documents = documents.filter(doc => doc.id !== docId);
    if (documents.length < initialLength) {
        saveDocuments(documents);
        console.log(`Document with ID "${docId}" removed.`);
        return true;
    } else {
        console.warn(`Document with ID "${docId}" not found.`);
        return false;
    }
}


/**
 * Saves the current state of the application form (auto-save) for a specific job.
 * @param {object} applicationFormData - Data from the application form.
 * @param {string} jobId - Identifier for the job being applied to. Must not be empty.
 */
function saveCurrentApplicationProgress(applicationFormData, jobId) {
    if (!jobId) {
        console.error("Cannot auto-save progress without a valid jobId.");
        return;
    }
    try {
        const currentAppData = { jobId, formData: applicationFormData, lastSaved: Date.now() };
        const key = CURRENT_APP_KEY_PREFIX + jobId;
        localStorage.setItem(key, JSON.stringify(currentAppData));
        console.log(`Auto-saved progress for job ${jobId}`);
    } catch (e) {
        console.error(`Error auto-saving application progress for ${jobId}:`, e);
        // Optionally notify user, but might be annoying during typing
    }
}

/**
 * Loads the saved state of the application form for a specific job.
 * @param {string} jobId - Identifier for the job being applied to.
 * @returns {object | null} The saved form data or null.
 */
function loadCurrentApplicationProgress(jobId) {
     if (!jobId) return null;
     try {
        const key = CURRENT_APP_KEY_PREFIX + jobId;
        const currentAppJson = localStorage.getItem(key);
        if (currentAppJson) {
            const currentAppData = JSON.parse(currentAppJson);
            // Basic check, should always match if key is correct, but good practice
            if (currentAppData.jobId === jobId) {
                 console.log(`Loaded saved progress for job ${jobId}`);
                return currentAppData.formData;
            }
        }
        return null; // No saved data for this specific job ID
    } catch (e) {
        console.error(`Error loading application progress for ${jobId}:`, e);
        return null;
    }
}

/**
 * Clears the auto-saved application progress for a specific job.
 * @param {string} jobId - Identifier for the job being applied to.
 */
function clearCurrentApplicationProgress(jobId) {
    if (!jobId) return;
    try {
        const key = CURRENT_APP_KEY_PREFIX + jobId;
        localStorage.removeItem(key);
        console.log(`Cleared auto-saved application progress for ${jobId}.`);
    } catch (e) {
         console.error(`Error clearing application progress for ${jobId}:`, e);
    }
}

// Make functions available globally via a namespace
window.dataApi = {
    saveProfile,
    loadProfile,
    saveApplications,
    loadApplications,
    addOrUpdateSubmittedApplication, // Use this for saving submitted apps
    saveDocuments,
    loadDocuments,
    addDocumentToLocker,
    removeDocumentFromLocker,
    saveCurrentApplicationProgress,
    loadCurrentApplicationProgress,
    clearCurrentApplicationProgress
};