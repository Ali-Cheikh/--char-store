// DOM Elements
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
const noResults = document.getElementById('no-results');
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');
const loadingScreen = document.getElementById('loading-screen');
const dropsButton = document.getElementById('drops-button');
const countdownDays = document.getElementById('countdown-days');
const countdownHours = document.getElementById('countdown-hours');
const countdownMinutes = document.getElementById('countdown-minutes');

// Shopping Cart
let shoppingCart = JSON.parse(localStorage.getItem('cart')) || [];

// Products array
let products = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set up countdown timer (next Friday at 12PM GMT+1)
    setupCountdown();
    
    // Hide loading screen after 1.5s
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }, 1500);
    
    // Load products first
    loadProducts().then(() => {
        displayProducts();
        updateCartCount();
    });
});

// Set up countdown timer
function setupCountdown() {
    // Set the target date (next Friday at 12PM GMT+1)
    const now = new Date();
    const target = new Date();
    
    // Find next Friday
    target.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
    target.setHours(12, 0, 0, 0); // 12PM
    
    // Convert to GMT+1 (Tunisia time)
    target.setHours(target.getHours() + 1);
    
    // If today is Friday and it's past 12PM, set for next Friday
    if (now.getDay() === 5 && now.getHours() >= 12) {
        target.setDate(target.getDate() + 7);
    }
    
    // Update countdown every second
    setInterval(() => {
        updateCountdown(target);
    }, 1000);
    
    // Initial update
    updateCountdown(target);
}

function updateCountdown(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        countdownDays.textContent = '00';
        countdownHours.textContent = '00';
        countdownMinutes.textContent = '00';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    countdownDays.textContent = days.toString().padStart(2, '0');
    countdownHours.textContent = hours.toString().padStart(2, '0');
    countdownMinutes.textContent = minutes.toString().padStart(2, '0');
}

// Function to load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
        
        Swal.fire({
            title: 'Error Loading Products',
            text: 'Could not load product information. Please try again later.',
            icon: 'error',
            background: '#1a202c',
            color: 'white'
        });
    }
}

// Display products
function displayProducts(filter = '') {
    productList.innerHTML = '';
    
    const filteredProducts = products.filter(product => {
        const searchTerm = filter.toLowerCase();
        return (
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.some(cat => cat.toLowerCase().includes(searchTerm))
        );
    });
    
    if (filteredProducts.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = `product-card bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${product.featured ? 'featured' : ''}`;
        
        // Create image gallery HTML
        const galleryHTML = `
            <div class="image-gallery relative">
                ${product.images.map((img, index) => `
                    <img src="${img}" alt="${product.name}" 
                         class="gallery-image w-full h-64 object-cover cursor-pointer ${index === 0 ? 'active' : ''}" 
                         onclick="showProductDetails(${product.id})">
                `).join('')}
                <div class="gallery-nav">
                    ${product.images.map((_, index) => `
                        <div class="gallery-dot ${index === 0 ? 'active' : ''}" 
                             data-index="${index}" 
                             onclick="changeGalleryImage(this, ${product.id})"></div>
                    `).join('')}
                </div>
            </div>
        `;
        
        productCard.innerHTML = `
            ${galleryHTML}
            <div class="p-4">
                <h3 class="font-bold text-lg text-white mb-1">${product.name}</h3>
                <p class="text-gray-400 text-sm mb-3 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="font-bold text-purple-400">$${product.price.toFixed(2)}</span>
                    <button onclick="addToCartPrompt(${product.id})" 
                            class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition-colors">
                        <i class="fas fa-cart-plus mr-1"></i> Add
                    </button>
                </div>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

// Change gallery image
function changeGalleryImage(dotElement, productId) {
    const productCard = dotElement.closest('.product-card');
    const images = productCard.querySelectorAll('.gallery-image');
    const dots = productCard.querySelectorAll('.gallery-dot');
    
    const index = parseInt(dotElement.getAttribute('data-index'));
    
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    images[index].classList.add('active');
    dotElement.classList.add('active');
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    displayProducts(e.target.value);
});

// Show product details
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Create size options HTML
    const sizeOptions = product.sizes.map(size => `
        <div class="size-option" onclick="selectSize(this)">${size}</div>
    `).join('');
    
    // Create image gallery HTML for modal
    const modalGalleryHTML = `
        <div class="image-gallery relative h-64 md:h-96 mb-4">
            ${product.images.map((img, index) => `
                <img src="${img}" alt="${product.name}" 
                     class="gallery-image w-full h-full object-cover ${index === 0 ? 'active' : ''}">
            `).join('')}
            <div class="gallery-nav">
                ${product.images.map((_, index) => `
                    <div class="gallery-dot ${index === 0 ? 'active' : ''}" 
                         data-index="${index}" 
                         onclick="changeModalGalleryImage(this)"></div>
                `).join('')}
            </div>
        </div>
    `;
    
    Swal.fire({
        title: `<h2 class="text-2xl font-bold text-white">${product.name}</h2>`,
        html: `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/2">
                    ${modalGalleryHTML}
                </div>
                <div class="md:w-1/2 text-white">
                    <p class="text-gray-300 mb-4">${product.description}</p>
                    
                    <div class="bg-gray-700 p-4 rounded-lg mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold">Price:</span>
                            <span class="text-purple-400 font-bold">$${product.price.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center mb-4">
                            <span class="font-semibold">Status:</span>
                            <span class="bg-green-600 text-white px-2 py-1 rounded-full text-xs">IN STOCK</span>
                        </div>
                        
                        <div class="mb-3">
                            <label class="block text-gray-300 mb-2">Size:</label>
                            <div class="size-selector">
                                ${sizeOptions}
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="addToCartPrompt(${productId}, Swal.close)" 
                            class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors">
                        <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                    </button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        background: '#1a202c',
        width: '900px'
    });
}

// Change modal gallery image
function changeModalGalleryImage(dotElement) {
    const modal = document.querySelector('.swal2-container');
    const gallery = modal.querySelector('.image-gallery');
    const images = gallery.querySelectorAll('.gallery-image');
    const dots = gallery.querySelectorAll('.gallery-dot');
    
    const index = parseInt(dotElement.getAttribute('data-index'));
    
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    images[index].classList.add('active');
    dotElement.classList.add('active');
}

// Select size
function selectSize(element) {
    const container = element.parentElement;
    container.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
}

// Add to cart prompt
function addToCartPrompt(productId, callback) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    Swal.fire({
        title: `<h3 class="text-xl font-bold text-white">Add ${product.name} to Cart</h3>`,
        html: `
            <div class="flex flex-col md:flex-row gap-6 items-center">
                <div class="md:w-1/3">
                    <img src="${product.images[0]}" alt="${product.name}" class="w-full rounded-lg shadow-md">
                </div>
                <div class="md:w-2/3 text-white">
                    <div class="mb-4">
                        <label for="quantity" class="block text-gray-300 mb-2">Quantity:</label>
                        <input type="number" id="quantity" min="1" value="1" 
                               class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white">
                    </div>
                    <div class="bg-gray-700 p-3 rounded-lg mb-4">
                        <div class="flex justify-between">
                            <span class="font-semibold">Total:</span>
                            <span class="text-purple-400 font-bold" id="total-price">$${product.price.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-300 mb-2">Size:</label>
                        <div class="size-selector">
                            ${product.sizes.map(size => `
                                <div class="size-option ${size === 'M' ? 'selected' : ''}">${size}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add to Cart',
        cancelButtonText: 'Cancel',
        background: '#1a202c',
        didOpen: () => {
            const quantityInput = document.getElementById('quantity');
            const totalPrice = document.getElementById('total-price');
            
            quantityInput.addEventListener('input', () => {
                const quantity = parseInt(quantityInput.value) || 1;
                totalPrice.textContent = `$${(product.price * quantity).toFixed(2)}`;
            });
            
            // Set up size selection
            const sizeContainer = document.querySelector('.swal2-container .size-selector');
            if (sizeContainer) {
                sizeContainer.querySelectorAll('.size-option').forEach(opt => {
                    opt.addEventListener('click', function() {
                        sizeContainer.querySelectorAll('.size-option').forEach(o => o.classList.remove('selected'));
                        this.classList.add('selected');
                    });
                });
            }
        },
        preConfirm: () => {
            const quantity = parseInt(document.getElementById('quantity').value) || 1;
            const size = document.querySelector('.swal2-container .size-option.selected')?.textContent || 'M';
            
            addToCart(product, quantity, size);
            if (callback) callback();
        }
    });
}

// Add to cart
function addToCart(product, quantity = 1, size = 'M') {
    const existingItem = shoppingCart.find(item => 
        item.id === product.id && 
        item.size === size
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: quantity,
            size: size
        });
    }
    
    updateCartCount();
    saveCartToLocalStorage();
    
    // Show success notification
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#1a202c',
        color: 'white',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    
    Toast.fire({
        icon: 'success',
        title: `${quantity} ${product.name} added to cart`
    });
}

// Update cart count
function updateCartCount() {
    const count = shoppingCart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
    count > 0 ? cartCount.classList.remove('hidden') : cartCount.classList.add('hidden');
}

// Save cart to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(shoppingCart));
}

// Open cart
function openCart() {
    if (shoppingCart.length === 0) {
        Swal.fire({
            title: 'Your Cart is Empty',
            html: '<p class="text-gray-400">Looks like you haven\'t added anything to your cart yet.</p>',
            icon: 'info',
            confirmButtonText: 'Browse Drops',
            background: '#1a202c'
        });
        return;
    }
    
    let cartContent = `
        <div class="max-h-96 overflow-y-auto pr-2">
            <div class="divide-y divide-gray-700">
                ${shoppingCart.map(item => `
                    <div class="py-4 flex items-start">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg mr-4">
                        <div class="flex-1 text-white">
                            <h4 class="font-bold">${item.name}</h4>
                            <p class="text-sm text-gray-400">Size: ${item.size}</p>
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-purple-400 font-bold">$${item.price.toFixed(2)} × ${item.quantity}</span>
                                <span class="font-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div class="flex items-center mt-2">
                                <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity - 1})" 
                                        class="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600">
                                    <i class="fas fa-minus text-xs"></i>
                                </button>
                                <span class="mx-2 w-8 text-center">${item.quantity}</span>
                                <button onclick="updateQuantity(${item.id}, '${item.size}', ${item.quantity + 1})" 
                                        class="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600">
                                    <i class="fas fa-plus text-xs"></i>
                                </button>
                                <button onclick="removeFromCart(${item.id}, '${item.size}')" 
                                        class="ml-auto text-red-400 hover:text-red-300">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="border-t border-gray-700 pt-4 mt-4">
            <div class="flex justify-between items-center mb-4 text-white">
                <span class="font-bold text-lg">Total:</span>
                <span class="text-purple-400 font-bold text-xl">
                    $${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                </span>
            </div>
            <button onclick="checkout()" 
                    class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors">
                Proceed to Checkout
            </button>
        </div>
    `;
    
    Swal.fire({
        title: '<h2 class="text-2xl font-bold text-white mb-4">Your Shopping Cart</h2>',
        html: cartContent,
        showConfirmButton: false,
        background: '#1a202c',
        width: '900px'
    });
}

// Update item quantity
function updateQuantity(productId, size, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId, size);
        return;
    }
    
    const item = shoppingCart.find(item => 
        item.id === productId && 
        item.size === size
    );
    
    if (item) {
        item.quantity = newQuantity;
        saveCartToLocalStorage();
        updateCartCount();
        openCart(); // Refresh cart view
    }
}

// Remove from cart
function removeFromCart(productId, size) {
    shoppingCart = shoppingCart.filter(item => 
        !(item.id === productId && 
        item.size === size)
    );
    
    saveCartToLocalStorage();
    updateCartCount();
    
    if (shoppingCart.length === 0) {
        Swal.close();
    } else {
        openCart(); // Refresh cart view
    }
}

// Checkout process
function checkout() {
    Swal.fire({
        title: '<h2 class="text-2xl font-bold text-white mb-4">Checkout</h2>',
        html: `
            <div class="text-left text-white">
                <div class="mb-6">
                    <h3 class="font-bold text-lg mb-2">Order Summary</h3>
                    <div class="bg-gray-800 p-4 rounded-lg">
                        ${shoppingCart.map(item => `
                            <div class="flex justify-between py-2 border-b border-gray-700">
                                <span>${item.name} (${item.size}) × ${item.quantity}</span>
                                <span class="font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="flex justify-between pt-2 font-bold">
                            <span>Total</span>
                            <span class="text-purple-400">
                                $${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h3 class="font-bold text-lg mb-2">Shipping Information</h3>
                    <div class="space-y-3">
                        <div>
                            <label for="name" class="block text-gray-300 mb-1">Full Name</label>
                            <input type="text" id="name" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                        </div>
                        <div>
                            <label for="email" class="block text-gray-300 mb-1">Email</label>
                            <input type="email" id="email" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                        </div>
                        <div>
                            <label for="phone" class="block text-gray-300 mb-1">Phone Number</label>
                            <input type="tel" id="phone" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                        </div>
                        <div>
                            <label for="address" class="block text-gray-300 mb-1">Shipping Address</label>
                            <textarea id="address" rows="2" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Complete Purchase',
        cancelButtonText: 'Continue Shopping',
        background: '#1a202c',
        preConfirm: () => {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            
            if (!name || !email || !phone || !address) {
                Swal.showValidationMessage('Please fill in all required fields');
                return false;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                Swal.showValidationMessage('Please enter a valid email address');
                return false;
            }
            
            // if (!/^[0-9]{10,15}$/.test(phone)) {
            //     Swal.showValidationMessage('Please enter a valid phone number');
            //     return false;
            // }
            
            return { name, email, phone, address };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            processOrder(result.value);
        }
    });
}

// Process order
function processOrder(customerInfo) {
    Swal.fire({
        title: 'Processing Your Order...',
        html: '<div class="loading-spinner mx-auto my-4"></div><p class="text-gray-400">Please wait while we process your order</p>',
        showConfirmButton: false,
        allowOutsideClick: false,
        background: '#1a202c'
    });
    
    // Prepare order data
    const order = {
        customer: customerInfo,
        items: shoppingCart,
        total: shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };
    
    // In a real app, you would send this to your backend
    setTimeout(() => {
        Swal.fire({
            title: 'Order Placed Successfully!',
            html: `
                <div class="text-center text-white">
                    <i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                    <p class="text-xl font-bold mb-2">Thank you for your order, ${customerInfo.name}!</p>
                    <p class="text-gray-300 mb-4">Your limited edition anime gear is on its way.</p>
                    <p class="text-gray-400">We've sent a confirmation email to ${customerInfo.email}</p>
                </div>
            `,
            confirmButtonText: 'Browse More Drops',
            background: '#1a202c'
        }).then(() => {
            // Clear cart
            shoppingCart = [];
            saveCartToLocalStorage();
            updateCartCount();
        });
        
        // Here you would typically send the order to your backend
        sendOrderToServer(order);
    }, 2000);
}

// Send order to server
function sendOrderToServer(order) {
    Swal.fire({
        title: "Sending...",
        text: "Please wait while your purchase is being processed.",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#1a202c',
        color: 'white',
        willOpen: () => {
            Swal.showLoading();
        },
    });

    const scriptUrl = "https://script.google.com/macros/s/AKfycbwrTBVKzTTii1kyEu8x0BkQwo6lUpimSrcA3ykqLylJg5g2loEa6SV0Yp2Z0ZQk1sdE/exec";

    const formData = new FormData();
    formData.append("productName", order.items.map(item => `${item.name} (${item.size}) × ${item.quantity}`).join(", "));
    formData.append("price", order.total);
    formData.append("count", order.items.reduce((total, item) => total + item.quantity, 0));
    formData.append("phone", order.customer.phone);
    formData.append("name", order.customer.name);
    formData.append("email", order.customer.email);
    formData.append("location", order.customer.address);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", scriptUrl);
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log("Order sent successfully");
        } else {
            console.error("Error sending order");
        }
    };
    xhr.onerror = function () {
        console.error("Error sending order");
    };
    xhr.send(formData);
}