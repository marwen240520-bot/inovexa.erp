// utils/apiErrorHandler.ts
export const handleApiError = (error, showMessage) => {
  console.error("API Error:", error);
  
  if (error.message === "Failed to fetch") {
    showMessage("❌ Impossible de se connecter au serveur. Vérifiez que le backend est démarré.", "error");
  } else if (error.response?.status === 401) {
    showMessage("❌ Session expirée. Veuillez vous reconnecter.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => window.location.href = "/auth/login", 2000);
  } else if (error.response?.status === 403) {
    showMessage("❌ Accès non autorisé.", "error");
  } else if (error.response?.status === 404) {
    showMessage("❌ Ressource non trouvée.", "error");
  } else if (error.response?.status === 500) {
    showMessage("❌ Erreur interne du serveur.", "error");
  } else {
    showMessage(`❌ ${error.message || "Une erreur est survenue"}`, "error");
  }
};

export const apiRequest = async (url, options = {}, showMessage) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw { response, message: error.message || "Erreur serveur" };
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, showMessage);
    throw error;
  }
};
