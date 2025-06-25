document.addEventListener('DOMContentLoaded', () => {
    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            const projectData = data.projects;
            const projectOrder = data.order;

            // --- 2. DOM ELEMENT REFERENCES ---
            const tapestryContainer = document.getElementById('pi-tapestry');
            const modalBackdrop = document.getElementById('modal-backdrop');
            const modalCloseBtn = document.getElementById('modal-close-btn');
            const canvas = document.getElementById('pi-stream-background');
            const ctx = canvas.getContext('2d');
            
            // --- 3. RENDER TAPESTRY (with animation delay) ---
            const renderTapestry = () => {
                tapestryContainer.innerHTML = '';
                projectOrder.forEach((projectId, index) => {
                    const quartetElement = document.createElement('div');
                    quartetElement.classList.add('pi-quartet');
                    quartetElement.textContent = projectId;
                    quartetElement.dataset.projectId = projectId;
                    quartetElement.style.animationDelay = `${index * 60}ms`;
                    tapestryContainer.appendChild(quartetElement);
                });
            };

            // --- 4. MODAL LOGIC (with Accessibility) ---
            let currentImageIndex = 0;
            let lastFocusedElement; // For accessibility
            const openModal = (projectId) => {
                const project = projectData[projectId];
                if (!project) return;
                
                lastFocusedElement = document.activeElement; // Store what was focused before opening modal

                // --- Populate Content (As before) ---
                document.getElementById('modal-title').textContent = project.title;
                document.getElementById('modal-description').textContent = project.description;

                // --- Media Viewer ---
                const mediaViewer = document.getElementById('modal-media-viewer');
                mediaViewer.innerHTML = '';
                if (project.media && project.media.length > 0) {
                    mediaViewer.style.display = 'block';
                    currentImageIndex = 0;
                    project.media.forEach((src, index) => {
                        const img = document.createElement('img');
                        img.src = src;
                        img.onerror = () => img.src = 'https://placehold.co/800x500/1F2937/E5E7EB?text=Image+Not+Found';
                        if(index === 0) img.classList.add('active');
                        mediaViewer.appendChild(img);
                    });
                    if (project.media.length > 1) {
                        const prevBtn = document.createElement('button');
                        prevBtn.id = 'carousel-prev';
                        prevBtn.className = 'carousel-btn';
                        prevBtn.innerHTML = '&#10094;';
                        const nextBtn = document.createElement('button');
                        nextBtn.id = 'carousel-next';
                        nextBtn.className = 'carousel-btn';
                        nextBtn.innerHTML = '&#10095;';
                        mediaViewer.appendChild(prevBtn);
                        mediaViewer.appendChild(nextBtn);
                        const images = mediaViewer.querySelectorAll('img');
                        const updateCarousel = () => {
                            images.forEach((img, i) => img.classList.toggle('active', i === currentImageIndex));
                        };
                        prevBtn.onclick = () => {
                            currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : images.length - 1;
                            updateCarousel();
                        };
                        nextBtn.onclick = () => {
                            currentImageIndex = (currentImageIndex < images.length - 1) ? currentImageIndex + 1 : 0;
                            updateCarousel();
                        };
                    }
                } else {
                    mediaViewer.style.display = 'none';
                }

                // --- Architect's Notes ---
                const notesContainer = document.getElementById('modal-architect-notes');
                notesContainer.innerHTML = '';
                if (project.notes) {
                    notesContainer.innerHTML = `
                        <h4>Challenge:</h4><p>${project.notes.challenge}</p>
                        <h4>Solution:</h4><p>${project.notes.solution}</p>
                        <h4>Learning:</h4><p>${project.notes.learning}</p>
                    `;
                }
                
                // --- Tech Stack & Links ---
                const techStackContainer = document.getElementById('modal-tech-stack');
                techStackContainer.innerHTML = '<h3>Tech Stack:</h3>';
                if(project.techStack) project.techStack.forEach(tech => {
                    const techTag = document.createElement('span');
                    techTag.textContent = tech;
                    techStackContainer.appendChild(techTag);
                });
                const linksContainer = document.getElementById('modal-links');
                linksContainer.innerHTML = '';
                if (project.liveUrl) linksContainer.innerHTML += `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer">Live Demo</a>`;
                if (project.githubUrl) linksContainer.innerHTML += `<a href="${project.githubUrl}" 'target="_blank" rel="noopener noreferrer">View on GitHub</a>`;
                
                modalBackdrop.classList.add('visible');
                document.body.style.overflow = 'hidden';
                modalCloseBtn.focus(); // Move focus to the close button for accessibility
            };
            const closeModal = () => {
                modalBackdrop.classList.remove('visible');
                document.body.style.overflow = '';
                if (lastFocusedElement) lastFocusedElement.focus(); // Return focus to the element that opened the modal
            };

            // --- 5. PI STREAM BACKGROUND ANIMATION (with comments) ---
            let animationFrameId;
            const setupPiStream = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                const pi = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
                const fontSize = 14;
                const columns = canvas.width / fontSize;
                // Create an array of 'drops', one for each column.
                // Each drop tracks the Y-position of the falling digit in its column.
                const drops = Array(Math.floor(columns)).fill(1);
                
                const draw = () => {
                    // The semi-transparent fill creates the iconic fading trail effect.
                    ctx.fillStyle = "rgba(17, 24, 39, 0.1)"; 
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Set the color and font for the falling digits.
                    ctx.fillStyle = "rgba(129, 140, 248, 0.2)";
                    ctx.font = `${fontSize}px ${getComputedStyle(document.body).fontFamily}`;

                    for (let i = 0; i < drops.length; i++) {
                        const text = pi[Math.floor(Math.random() * pi.length)];
                        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                        // Reset the drop to the top if it's off-screen.
                        // The Math.random() check adds variation, so they don't all reset at once.
                        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i]++;
                    }
                };
                
                const animateStream = () => {
                    draw();
                    animationFrameId = requestAnimationFrame(animateStream);
                }
                animateStream();
            };
            
            const handleResize = () => {
                cancelAnimationFrame(animationFrameId);
                setupPiStream();
            }
            window.addEventListener('resize', handleResize);

            // --- 6. EVENT LISTENERS ---
            tapestryContainer.addEventListener('click', (event) => {
                const quartet = event.target.closest('.pi-quartet');
                if (quartet) openModal(quartet.dataset.projectId);
            });
            modalCloseBtn.addEventListener('click', closeModal);
            modalBackdrop.addEventListener('click', (event) => {
                if (event.target === modalBackdrop) closeModal();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && modalBackdrop.classList.contains('visible')) closeModal();
            });

            // --- INITIALIZATION ---
            renderTapestry();
            setupPiStream();
        });
});