// Newsletter functionality
const newsletterModal = document.getElementById('newsletter-modal');
const newsletterEmail = document.getElementById('newsletter-email');
const newsletterError = document.getElementById('newsletter-error');

// Open newsletter modal
function openNewsletterModal() {
    newsletterModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

// Close newsletter modal
function closeNewsletterModal() {
    newsletterModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    newsletterError.classList.add('hidden');
    newsletterEmail.value = '';
}

// Submit newsletter form
function submitNewsletter() {
    const email = newsletterEmail.value.trim();
    
    // Simple email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newsletterError.textContent = 'Please enter a valid email address';
        newsletterError.classList.remove('hidden');
        return;
    }
    
    // Here you would typically send to your backend
    // For now we'll just show a success message
    Swal.fire({
        title: 'Success!',
        html: `<p class="text-gray-300">You'll be notified about our next drop at <span class="text-purple-400">${email}</span></p>`,
        icon: 'success',
        background: '#1a202c',
        confirmButtonText: 'Awesome!',
        confirmButtonColor: '#6b46c1'
    });
    
    closeNewsletterModal();
    
    // In a real app, you would send this to your backend:
    // sendNewsletterSignup(email);
}

// Example function to send to backend (you would implement this)
function sendNewsletterSignup(email) {
    const scriptUrl = "YOUR_GOOGLE_SCRIPT_URL";
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("source", "anime-drop-notifications");
    
    fetch(scriptUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => console.log("Newsletter signup successful:", data))
    .catch(error => console.error("Error signing up:", error));
}