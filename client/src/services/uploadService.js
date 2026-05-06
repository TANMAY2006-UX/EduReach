import api from './api';

export const uploadService = {
  /**
   * Upload a document to Cloudinary via the backend.
   *
   * @param {File|File[]} files - Single file or array (for certifications)
   * @param {string} documentType - 'degree'|'certifications'|'aadhaar'|'schoolId'|'registrationProof'
   * @returns {Promise<{ success, url?, urls?, verificationStatus, documentType }>}
   */
  uploadDocument: async (files, documentType) => {
    const formData = new FormData();
    const isMulti  = Array.isArray(files);

    if (isMulti) {
      files.forEach(f => formData.append('file', f));
    } else {
      formData.append('file', files);
    }

    const { data } = await api.post(
      `/upload/document?documentType=${documentType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  /**
   * Get the current user's document URLs and verification status.
   * NOTE: aadhaar is never returned here.
   *
   * @returns {Promise<{ success, verificationStatus, verificationNote, documents }>}
   */
  getMyDocuments: () =>
    api.get('/upload/my-documents').then(r => r.data),
};
