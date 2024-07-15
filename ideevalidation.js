   // Initialisation de Supabase
const supabaseUrl = 'https://rtugoouunkkrdiximytz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dWdvb3V1bmtrcmRpeGlteXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA4NjM5MjYsImV4cCI6MjAzNjQzOTkyNn0.g3uOTZZyMOmTPT44IVk1a06O-pDbCWte5PAMbYrS-1M';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

        form.addEventListener("submit", async function(event) {
            event.preventDefault();

            clearErrors();

            const titleValue = sanitizeInput(title.value.trim());
            const categoryValue = sanitizeInput(category.value.trim());
            const descriptionValue = sanitizeInput(description.value.trim());

            if (validateForm(titleValue, categoryValue, descriptionValue)) {
                const idea = { title: titleValue, category: categoryValue, description: descriptionValue, status: "En attente" };
                await addIdeaToSupabase(idea);
                form.reset();
                message.textContent = "Idée ajoutée avec succès!";
                setTimeout(function() {
                    message.textContent = "";
                    displayIdeas();
                }, 2000);
            }
        });

        async function addIdeaToSupabase(idea) {
            const { data, error } = await supabaseClient.from('ideas').insert([idea]);
            if (error) {
                console.error('Erreur lors de l\'ajout de l\'idée:', error.message);
                return;
            }
            console.log('Idée ajoutée avec succès:', data);
        }

        function validateForm(title, category, description) {
            let isValid = true;
        
            const validations = [
                { field: title, errorId: "titleError", message: "Le libellé est requis.", maxLength: 25 },
                { field: category, errorId: "categoryError", message: "La catégorie est requise." },
                { field: description, errorId: "descriptionError", message: "Le message descriptif est requis.", maxLength: 255 }
            ];
        
           // Regex pour détecter les caractères indésirables (exemple : 
        //    séquences répétées de caractères et caractères spéciaux consécutifs)
        const unwantedCharsRegex = /(\w)\1{5,}|[^a-zA-Z0-9\s]{2,}/;

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

        async function displayIdeas() {
            ideasContainer.innerHTML = "";
    
            const { data, error } = await supabaseClient.from('ideas').select('*');
            if (error) {
                console.error('Erreur lors de la récupération des idées:', error.message);
                return;
            }
    
            data.forEach(idea => {
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
    
                card.innerHTML = `
                    <div class="card-header">${idea.title}</div>
                    <div class="card-body">
                        <p><strong>Catégorie:</strong> ${idea.category}</p>
                        <p><strong>Description:</strong> ${idea.description}</p>
                        <p><strong>Statut:</strong> <span class="status ${idea.status === 'Approuvée' ? 'approved' : idea.status === 'Désapprouvée' ? 'disapproved' : 'pending'}">${idea.status}</span></p>
                    </div>
                    <div class="card-actions">
                        ${idea.status === "En attente" ? `
                        <button class="approve-btn"><i class="fas fa-check-circle"></i></button>
                        <button class="disapprove-btn"><i class="fas fa-times-circle"></i></button>
                        ` : ''}
                        <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
    
                if (idea.status === "En attente") {
                    card.querySelector(".approve-btn").addEventListener("click", async () => {
                        await updateIdeaStatus(idea.id, "Approuvée");
                        displayIdeas();
                    });
    
                    card.querySelector(".disapprove-btn").addEventListener("click", async () => {
                        await updateIdeaStatus(idea.id, "Désapprouvée");
                        displayIdeas();
                    });
                }
    
                card.querySelector(".delete-btn").addEventListener("click", async () => {
                    await removeIdeaFromSupabase(idea.id);
                    displayIdeas();
                });
    
                ideasContainer.appendChild(card);
            });
        }
    
        async function updateIdeaStatus(id, status) {
            const { error } = await supabaseClient.from('ideas').update({ status }).eq('id', id);
            if (error) {
                console.error('Erreur lors de la mise à jour de l\'état de l\'idée:', error.message);
                return;
            }
            console.log('État de l\'idée mis à jour avec succès:', id, status);
        }
    
        async function removeIdeaFromSupabase(id) {
            const { error } = await supabaseClient.from('ideas').delete().eq('id', id);
            if (error) {
                console.error('Erreur lors de la suppression de l\'idée:', error.message);
                return;
            }
            console.log('Idée supprimée avec succès de Supabase:', id);
        }
    

        // async function removeIdeaFromSupabase(idea) {
        //     const { error } = await supabaseClient.from('ideas').delete().eq('title', idea.title);
        //     if (error) {
        //         console.error('Erreur lors de la suppression de l\'idée:', error.message);
        //         return;
        //     }
        //     console.log('Idée supprimée avec succès:', idea.title);
        // }

        // Charger les idées du Supabase au démarrage
        displayIdeas();
    });
