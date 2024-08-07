document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ideaForm");
    const message = document.getElementById("message");
    const title = document.getElementById("title");
    const category = document.getElementById("category");
    const description = document.getElementById("description");
    const ideasContainer = document.getElementById("ideasContainer");
    const errorMessage = document.getElementById("errorMessage");

    // Observer pour détecter les modifications non autorisées
    const originalCategories = Array.from(category.options).map(option => option.outerHTML).join('');

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                category.innerHTML = originalCategories;
                errorMessage.textContent = 'Modification non autorisée détectée et annulée.';
            }
        }
    });

    observer.observe(category, {
        attributes: true,
        childList: true,
        subtree: true
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        clearErrors();

        const titleValue = sanitizeInput(title.value.trim());
        const categoryValue = sanitizeInput(category.value.trim());
        const descriptionValue = sanitizeInput(description.value.trim());

        if (validateForm(titleValue, categoryValue, descriptionValue)) {
            const idea = { title: titleValue, category: categoryValue, description: descriptionValue, status: "En attente" };
            addIdeaToStorage(idea);
            form.reset();

                                
                        message.textContent = "Idée ajoutée avec succès!";
                        form.style.display = "none";
                        setTimeout(function() {
                            form.style.display = "block";  
                            message.textContent = "";      
                            displayIdeas();                
                        }, 2000);
                        displayIdeas();
        }
    });

    function validateForm(title, category, description) {
        let isValid = true;
    
        const validations = [
            { field: title, errorId: "titleError", message: "Le libellé est requis.", maxLength: 25 },
            { field: category, errorId: "categoryError", message: "La catégorie est requise." },
            { field: description, errorId: "descriptionError", message: "Le message descriptif est requis.", maxLength: 255 }
        ];
    
        // Regex pour détecter les caractères indésirables (exemple : séquences répétées de caractères)
        const unwantedCharsRegex = /(\w)\1{5,}/; // Exemple: détecte une lettre répétée 6 fois ou plus
    
        validations.forEach(validation => {
            if (validation.field.trim() === "") {
                showError(validation.errorId, validation.message);
                isValid = false;
            } else if (validation.maxLength && validation.field.length > validation.maxLength) {
                showError(validation.errorId, `Ce champ ne peut pas dépasser ${validation.maxLength} caractères.`);
                isValid = false;
            } else if (unwantedCharsRegex.test(validation.field)) {
                showError(validation.errorId, `Ce champ contient des caractères indésirables.`);
                isValid = false;
            }
        });
    
        return isValid;
    }
    

    function sanitizeInput(input) {
        const tempDiv = document.createElement("div");
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    }

    function clearErrors() {
        document.querySelectorAll(".error").forEach(error => error.textContent = "");
    }

    function showError(id, message) {
        document.getElementById(id).textContent = message;
    }

    function addIdeaToStorage(idea) {
        const ideas = JSON.parse(localStorage.getItem("ideas")) || [];
        ideas.push(idea);
        localStorage.setItem("ideas", JSON.stringify(ideas));
    }

    function displayIdeas() {



        ideasContainer.innerHTML = "";
        const ideas = JSON.parse(localStorage.getItem("ideas")) || [];
    
        ideas.forEach(idea => {
            const card = document.createElement("div");
            card.classList.add("card");
    
            // Ajouter la classe approuvée si l'idée est approuvée
            if (idea.status === "Approuvée") {
                card.classList.add("approved");
            }

            // Ajouter la classe désapprouvée si l'idée est désapprouvée
            if (idea.status === "Désapprouvée") {
                card.classList.add("disapproved");
            }
    
            // Déterminer la classe et l'icône du bouton initial en fonction de l'état de l'idée
            // let buttonClass, iconClass;
            // if (idea.status === "Approuvée") {
            //     buttonClass = "disapprove-btn";
            //     iconClass = "fa-times-circle";
            // } else {
            //     buttonClass = "approve-btn";
            //     iconClass = "fa-check-circle";
            // }
    
            card.innerHTML = `
                <div class="card-header">${idea.title}</div>
                <div class="card-body">
                    <p><strong>Catégorie:</strong> ${idea.category}</p>
                    <p><strong>Description:</strong> ${idea.description}</p>
                    <p><strong>Statut:</strong> <span class="status ${idea.status === 'Approuvée' ? 'approved' : 'disapproved'}">${idea.status}</span></p>
                </div>
                <div class="card-actions">
                    ${idea.status === "En attente" ? `
                    <button class="approve-btn"><i class="fas fa-check-circle"></i></button>
                    <button class="disapprove-btn"><i class="fas fa-times-circle"></i></button>
                    ` : ''}
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
    
            // Ajouter les événements aux boutons d'action
            if (idea.status === "En attente") {
                card.querySelector(".approve-btn").addEventListener("click", () => {
                    idea.status = "Approuvée";
                    updateIdeaInStorage(ideas);
                    displayIdeas(); // Rafraîchir les idées affichées
                });
    
                card.querySelector(".disapprove-btn").addEventListener("click", () => {
                    idea.status = "Désapprouvée";
                    updateIdeaInStorage(ideas);
                    displayIdeas(); // Rafraîchir les idées affichées
                });
            }
    
            card.querySelector(".delete-btn").addEventListener("click", () => {
                removeIdeaFromStorage(idea);
                displayIdeas(); // Actualiser les idées affichées après leur suppression
            });
    
            ideasContainer.appendChild(card);
        });
    }

    function updateIdeaInStorage(ideas) {
        localStorage.setItem("ideas", JSON.stringify(ideas));
    }

    function removeIdeaFromStorage(ideaToRemove) {
        const ideas = JSON.parse(localStorage.getItem("ideas")) || [];
        const filteredIdeas = ideas.filter(idea => idea.title !== ideaToRemove.title || idea.category !== ideaToRemove.category || idea.description !== ideaToRemove.description);
        localStorage.setItem("ideas", JSON.stringify(filteredIdeas));
    }

    // Charger les idées du Local Storage au démarrage
    displayIdeas();
});
