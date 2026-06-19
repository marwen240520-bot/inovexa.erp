// Patch global pour résoudre l'erreur removeChild
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
    // Sauvegarder la fonction originale
    const originalRemoveChild = Node.prototype.removeChild;
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    const originalReplaceChild = Node.prototype.replaceChild;
    
    // Patch removeChild - IGNORE silencieusement les erreurs
    Node.prototype.removeChild = function(child) {
        try {
            // Vérifier si l'enfant existe et a le bon parent
            if (!child) return child;
            if (child.parentNode !== this) {
                // L'enfant n'est pas dans ce parent - ignorer silencieusement
                return child;
            }
            return originalRemoveChild.call(this, child);
        } catch (e) {
            // Ignorer complètement l'erreur
            return child;
        }
    };
    
    // Patch appendChild pour plus de sécurité
    Node.prototype.appendChild = function(child) {
        try {
            if (!child) return child;
            return originalAppendChild.call(this, child);
        } catch (e) {
            return child;
        }
    };
    
    // Patch insertBefore
    Node.prototype.insertBefore = function(newNode, referenceNode) {
        try {
            return originalInsertBefore.call(this, newNode, referenceNode);
        } catch (e) {
            return newNode;
        }
    };
    
    // Patch replaceChild
    Node.prototype.replaceChild = function(newChild, oldChild) {
        try {
            return originalReplaceChild.call(this, newChild, oldChild);
        } catch (e) {
            return newChild;
        }
    };
    
    console.log('[Patch] removeChild et fonctions DOM patchées avec succès');
}
