// DOM Elements
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search-input');
const noResults = document.getElementById('no-results');
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');
const loadingScreen = document.getElementById('loading-screen');
const countdownDays = document.getElementById('countdown-days');
const countdownHours = document.getElementById('countdown-hours');
const countdownMinutes = document.getElementById('countdown-minutes');

// Shopping Cart
let shoppingCart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Set up countdown timer
        setupCountdown();
        
        // Load products
        await loadProducts();
        displayProducts();
        updateCartCount();
        
        // Hide loading screen after minimum display time
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 1000);
    } catch (error) {
        console.error('Initialization error:', error);
        loadingScreen.classList.add('hidden');
        showErrorAlert('Failed to load products. Please try again later.');
    }
});

// Product Loading
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        products = await response.json();
        
        // Validate and enhance products
        products = products.map(product => ({
            id: product.id || Math.floor(Math.random() * 1000000),
            name: product.name || 'Unnamed Product',
            price: product.price || 0,
            originalPrice: product.originalPrice || null,
            images: Array.isArray(product.images) ? 
                product.images.map(img => img.startsWith('http') ? img : `/img/products${img}`) : 
                ['/img/products/placeholder.jpg'],
            description: product.description || 'No description available',
            category: Array.isArray(product.category) ? product.category : [],
            featured: !!product.featured,
            sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? 
                product.sizes : ['One Size'],
            colors: Array.isArray(product.colors) ? product.colors : [],
            rating: product.rating || Math.floor(Math.random() * 2) + 3 + Math.random().toFixed(1),
            reviews: product.reviews || Math.floor(Math.random() * 100)
        }));
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
        throw error;
    }
}

// Display Products
function displayProducts(filter = '') {
    productList.innerHTML = '';
    
    const filteredProducts = products.filter(product => {
        if (!filter) return true;
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
        productCard.className = `product-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${product.featured ? 'featured' : ''}`;
        
        // Image gallery with hover effect
        const galleryHTML = `
            <div class="image-container relative group" style="height: 280px;">
                <div class="image-gallery w-full h-full relative overflow-hidden">
                    ${product.images.map((img, index) => `
                        <img src="${img}" 
                             alt="${product.name}" 
                             class="gallery-image absolute inset-0 w-full h-full object-contain transition-opacity duration-300 cursor-pointer ${index === 0 ? 'opacity-100' : 'opacity-0'}"
                             loading="lazy"
                             onerror="this.src='/img/products/placeholder.jpg'"
                             onclick="showProductDetails(${product.id})">
                    `).join('')}
                </div>
                
                ${product.images.length > 1 ? `
                <div class="gallery-nav absolute bottom-3 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${product.images.map((_, index) => `
                        <div class="gallery-dot w-2 h-2 rounded-full bg-white bg-opacity-50 cursor-pointer ${index === 0 ? 'bg-opacity-100' : ''}" 
                             data-index="${index}" 
                             onclick="event.stopPropagation(); changeGalleryImage(this, ${product.id})"></div>
                    `).join('')}
                </div>` : ''}
                
                ${product.featured ? `
                <div class="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Featured
                </div>` : ''}
                
                ${product.originalPrice ? `
                <div class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ${Math.round(100 - (product.price / product.originalPrice * 100))}% OFF
                </div>` : ''}
            </div>
        `;
        
        // Rating stars
        const ratingStars = Array(5).fill(0).map((_, i) => `
            <svg class="w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}" 
                 fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
        `).join('');
    
        productCard.innerHTML = `
            ${galleryHTML}
            <div class="p-4">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">${product.name}</h3>
                    <button onclick="event.stopPropagation(); toggleWishlist(${product.id})" 
                            class="text-gray-400 hover:text-red-500 transition-colors">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                
                <div class="flex items-center mb-2">
                    <div class="flex mr-2">
                        ${ratingStars}
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">(${product.reviews})</span>
                </div>
                
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">${product.description}</p>
                
                <div class="flex justify-between items-center">
                    <div>
                        ${product.originalPrice ? `
                        <span class="text-gray-400 dark:text-gray-500 text-sm line-through mr-2">$${product.originalPrice.toFixed(2)}</span>
                        ` : ''}
                        <span class="font-bold text-purple-600 dark:text-purple-400">$${product.price.toFixed(2)}</span>
                    </div>
                    <button onclick="event.stopPropagation(); addToCartPrompt(${product.id})" 
                            class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition-colors flex items-center">
                        <i class="fas fa-cart-plus mr-1"></i> Add
                    </button>
                </div>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

// Product Details Modal
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Size options
    const sizeOptions = product.sizes.map(size => `
        <div class="size-option inline-flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer transition-colors hover:border-purple-500">
            ${size}
        </div>
    `).join('');
    
    // Color options
    const colorOptions = product.colors.length > 0 ? `
        <div class="mt-3">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Color:</label>
            <div class="color-selector flex flex-wrap gap-2">
                ${product.colors.map(color => `
                    <div class="color-option w-8 h-8 rounded-full border-2 border-transparent" 
                         style="background-color: ${color.code}"
                         title="${color.name}"
                         onclick="selectColor(this)">
                        ${color.name === 'White' ? '<div class="w-full h-full border border-gray-300 rounded-full"></div>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Rating stars
    const ratingStars = Array(5).fill(0).map((_, i) => `
        <svg class="w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}" 
             fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
    `).join('');
    
    // Image gallery for modal
    const modalGalleryHTML = `
        <div class="image-gallery-container relative rounded-lg overflow-hidden" style="height: 400px;">
            <div class="image-gallery w-full h-full relative">
                ${product.images.map((img, index) => `
                    <img src="${img}" alt="${product.name}" 
                         class="gallery-image absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${index === 0 ? 'opacity-100' : 'opacity-0'}"
                         loading="lazy"
                         onerror="this.src='/img/products/placeholder.jpg'">
                `).join('')}
            </div>
            
            ${product.images.length > 1 ? `
            <div class="gallery-nav absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                ${product.images.map((_, index) => `
                    <div class="gallery-dot w-3 h-3 rounded-full bg-white bg-opacity-50 cursor-pointer ${index === 0 ? 'bg-opacity-100' : ''}" 
                         data-index="${index}" 
                         onclick="changeModalGalleryImage(this)"></div>
                `).join('')}
            </div>
            
            <button class="gallery-nav-btn absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-opacity-100 transition-all"
                    onclick="navigateGallery(-1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="gallery-nav-btn absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-opacity-100 transition-all"
                    onclick="navigateGallery(1)">
                <i class="fas fa-chevron-right"></i>
            </button>
            ` : ''}
        </div>
        
        ${product.images.length > 1 ? `
        <div class="thumbnail-container flex gap-2 mt-3 overflow-x-auto py-2">
            ${product.images.map((img, index) => `
                <img src="${img}" alt="Thumbnail ${index + 1}"
                     class="thumbnail w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${index === 0 ? 'border-purple-500' : 'border-transparent'}"
                     onclick="changeModalGalleryByThumbnail(this, ${index})">
            `).join('')}
        </div>
        ` : ''}
    `;
    
    Swal.fire({
        title: `<h2 class="text-2xl font-bold text-gray-900 dark:text-white">${product.name}</h2>`,
        html: `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="md:w-1/2">
                    ${modalGalleryHTML}
                </div>
                <div class="md:w-1/2 text-gray-800 dark:text-gray-200">
                    <div class="flex items-center mb-2">
                        <div class="flex mr-2">
                            ${ratingStars}
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">${product.rating} (${product.reviews} reviews)</span>
                    </div>
                    
                    ${product.originalPrice ? `
                    <div class="mb-3">
                        <span class="text-gray-400 dark:text-gray-500 text-sm line-through">$${product.originalPrice.toFixed(2)}</span>
                        <span class="ml-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold px-2 py-1 rounded">
                            ${Math.round(100 - (product.price / product.originalPrice * 100))}% OFF
                        </span>
                    </div>
                    ` : ''}
                    
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                        $${product.price.toFixed(2)}
                    </div>
                    
                    <p class="text-gray-600 dark:text-gray-300 mb-6">${product.description}</p>
                    
                    <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                        <div class="mb-3">
                            <label class="block text-gray-700 dark:text-gray-300 mb-2">Size:</label>
                            <div class="size-selector flex flex-wrap gap-2">
                                ${sizeOptions}
                            </div>
                        </div>
                        
                        ${colorOptions}
                        
                        <div class="mt-4 flex items-center">
                            <label class="block text-gray-700 dark:text-gray-300 mr-3">Quantity:</label>
                            <div class="flex items-center">
                                <button class="quantity-btn w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                        onclick="adjustQuantity(-1)">
                                    <i class="fas fa-minus text-xs"></i>
                                </button>
                                <input type="number" id="modal-quantity" min="1" value="1" 
                                       class="w-12 h-8 text-center border-t border-b border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800">
                                <button class="quantity-btn w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                        onclick="adjustQuantity(1)">
                                    <i class="fas fa-plus text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="addToCartFromModal(${product.id})" 
                                class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center">
                            <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                        </button>
                        <button class="w-12 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                                onclick="toggleWishlist(${product.id})">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <i class="fas fa-box-open mr-2"></i>
                            <span>Free shipping on orders over $50</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <i class="fas fa-undo-alt mr-2"></i>
                            <span>30-day return policy</span>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showConfirmButton: false,
        background: '#ffffff',
        width: '900px',
        customClass: {
            popup: 'dark:bg-gray-800'
        },
        didOpen: () => {
            // Initialize size selection
            const sizeContainer = document.querySelector('.swal2-container .size-selector');
            if (sizeContainer && sizeContainer.firstChild) {
                sizeContainer.firstChild.classList.add('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
            }
            
            // Initialize color selection
            const colorContainer = document.querySelector('.swal2-container .color-selector');
            if (colorContainer && colorContainer.firstChild) {
                colorContainer.firstChild.classList.add('border-purple-500', 'ring-2', 'ring-purple-300');
            }
        }
    });
}

// Gallery navigation in modal
function navigateGallery(direction) {
    const modal = document.querySelector('.swal2-container');
    const gallery = modal.querySelector('.image-gallery');
    const images = gallery.querySelectorAll('.gallery-image');
    const dots = modal.querySelectorAll('.gallery-dot');
    const thumbnails = modal.querySelectorAll('.thumbnail');
    
    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('opacity-100'));
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    
    // Update images
    images[currentIndex].classList.remove('opacity-100');
    images[currentIndex].classList.add('opacity-0');
    images[newIndex].classList.remove('opacity-0');
    images[newIndex].classList.add('opacity-100');
    
    // Update dots
    if (dots.length) {
        dots[currentIndex].classList.remove('bg-opacity-100');
        dots[currentIndex].classList.add('bg-opacity-50');
        dots[newIndex].classList.remove('bg-opacity-50');
        dots[newIndex].classList.add('bg-opacity-100');
    }
    
    // Update thumbnails
    if (thumbnails.length) {
        thumbnails[currentIndex].classList.remove('border-purple-500');
        thumbnails[currentIndex].classList.add('border-transparent');
        thumbnails[newIndex].classList.remove('border-transparent');
        thumbnails[newIndex].classList.add('border-purple-500');
    }
}

function changeModalGalleryByThumbnail(thumbnail, index) {
    const modal = document.querySelector('.swal2-container');
    const gallery = modal.querySelector('.image-gallery');
    const images = gallery.querySelectorAll('.gallery-image');
    const dots = modal.querySelectorAll('.gallery-dot');
    const thumbnails = modal.querySelectorAll('.thumbnail');
    
    // Find current active image
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('opacity-100'));
    
    // Update images
    images[currentIndex].classList.remove('opacity-100');
    images[currentIndex].classList.add('opacity-0');
    images[index].classList.remove('opacity-0');
    images[index].classList.add('opacity-100');
    
    // Update dots
    if (dots.length) {
        dots[currentIndex].classList.remove('bg-opacity-100');
        dots[currentIndex].classList.add('bg-opacity-50');
        dots[index].classList.remove('bg-opacity-50');
        dots[index].classList.add('bg-opacity-100');
    }
    
    // Update thumbnails
    thumbnails[currentIndex].classList.remove('border-purple-500');
    thumbnails[currentIndex].classList.add('border-transparent');
    thumbnails[index].classList.remove('border-transparent');
    thumbnails[index].classList.add('border-purple-500');
}

// Add to Cart from Modal
function addToCartFromModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = parseInt(document.getElementById('modal-quantity').value) || 1;
    const size = document.querySelector('.swal2-container .size-selector .border-purple-500')?.textContent || 'One Size';
    const color = document.querySelector('.swal2-container .color-selector .border-purple-500')?.title || '';
    
    addToCart(product, quantity, size, color);
    Swal.close();
}

function adjustQuantity(change) {
    const input = document.getElementById('modal-quantity');
    let value = parseInt(input.value) || 1;
    value += change;
    if (value < 1) value = 1;
    input.value = value;
}

function toggleWishlist(productId) {
    // In a real app, you would manage a wishlist here
    showToast('Product added to wishlist', 'success');
}

// Cart Management
function addToCart(product, quantity = 1, size = 'One Size', color = '') {
    const existingItem = shoppingCart.find(item => 
        item.id === product.id && 
        item.size === size && 
        item.color === color
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        shoppingCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.images[0],
            quantity: quantity,
            size: size,
            color: color
        });
    }
    
    updateCartCount();
    saveCartToLocalStorage();
    
    showToast(`${quantity} ${product.name} (${size}) added to cart`, 'success');
}

function openCart() {
    if (shoppingCart.length === 0) {
        Swal.fire({
            title: 'Your Cart is Empty',
            html: '<p class="text-gray-500 dark:text-gray-400">Looks like you haven\'t added anything to your cart yet.</p>',
            icon: 'info',
            confirmButtonText: 'Browse Products',
            background: '#ffffff',
            customClass: {
                popup: 'dark:bg-gray-800'
            }
        });
        return;
    }
    
    let cartContent = `
        <div class="max-h-96 overflow-y-auto pr-2">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
                ${shoppingCart.map(item => `
                    <div class="py-4 flex items-start">
                        <img src="${item.image}" alt="${item.name}" 
                             class="w-16 h-16 object-contain rounded-lg mr-4 bg-gray-100 dark:bg-gray-700 p-1"
                             onerror="this.src='/img/products/placeholder.jpg'">
                        <div class="flex-1 text-gray-800 dark:text-gray-200">
                            <div class="flex justify-between">
                                <h4 class="font-bold">${item.name}</h4>
                                <span class="text-purple-600 dark:text-purple-400 font-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            
                            ${item.size !== 'One Size' ? `
                            <p class="text-sm text-gray-500 dark:text-gray-400">Size: ${item.size}</p>
                            ` : ''}
                            
                            ${item.color ? `
                            <p class="text-sm text-gray-500 dark:text-gray-400">Color: ${item.color}</p>
                            ` : ''}
                            
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-gray-600 dark:text-gray-300 text-sm">$${item.price.toFixed(2)} × ${item.quantity}</span>
                                <div class="flex items-center">
                                    <button onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity - 1})" 
                                            class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                        <i class="fas fa-minus text-xs"></i>
                                    </button>
                                    <span class="mx-2 w-8 text-center">${item.quantity}</span>
                                    <button onclick="updateQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity + 1})" 
                                            class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                    <button onclick="removeFromCart(${item.id}, '${item.size}', '${item.color}')" 
                                            class="ml-4 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div class="flex justify-between items-center mb-4">
                <span class="font-bold text-lg text-gray-800 dark:text-gray-200">Subtotal:</span>
                <span class="text-purple-600 dark:text-purple-400 font-bold text-xl">
                    $${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                </span>
            </div>
            
            <div class="mb-4">
                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <i class="fas fa-truck mr-2"></i>
                    <span>Shipping calculated at checkout</span>
                </div>
                ${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) < 50 ? `
                <div class="flex items-center text-sm text-purple-600 dark:text-purple-400">
                    <i class="fas fa-info-circle mr-2"></i>
                    <span>Spend $${(50 - shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0)).toFixed(2)} more for free shipping!</span>
                </div>
                ` : `
                <div class="flex items-center text-sm text-green-600 dark:text-green-400">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>You qualify for free shipping!</span>
                </div>
                `}
            </div>
            
            <button onclick="checkout()" 
                    class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors mb-2">
                Proceed to Checkout
            </button>
            <button onclick="continueShopping()" 
                    class="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-bold transition-colors">
                Continue Shopping
            </button>
        </div>
    `;
    
    Swal.fire({
        title: '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Shopping Cart</h2>',
        html: cartContent,
        showConfirmButton: false,
        background: '#ffffff',
        width: '900px',
        customClass: {
            popup: 'dark:bg-gray-800'
        }
    });
}

function updateQuantity(productId, size, color, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId, size, color);
        return;
    }
    
    const item = shoppingCart.find(item => 
        item.id === productId && 
        item.size === size && 
        item.color === color
    );
    
    if (item) {
        item.quantity = newQuantity;
        saveCartToLocalStorage();
        updateCartCount();
        openCart();
    }
}

function removeFromCart(productId, size, color) {
    shoppingCart = shoppingCart.filter(item => 
        !(item.id === productId && 
          item.size === size && 
          item.color === color)
    );
    
    saveCartToLocalStorage();
    updateCartCount();
    
    if (shoppingCart.length === 0) {
        Swal.close();
    } else {
        openCart();
    }
}

function continueShopping() {
    Swal.close();
}

// Checkout Process
function checkout() {
    Swal.fire({
        title: '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Checkout</h2>',
        html: `
            <div class="text-left text-gray-800 dark:text-gray-200">
                <div class="mb-6">
                    <h3 class="font-bold text-lg mb-2">Order Summary</h3>
                    <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        ${shoppingCart.map(item => `
                            <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                <div class="flex items-center">
                                    <img src="${item.image}" alt="${item.name}" 
                                         class="w-10 h-10 object-contain rounded mr-3 bg-white dark:bg-gray-600 p-1"
                                         onerror="this.src='/img/products/placeholder.jpg'">
                                    <div>
                                        <p class="font-medium">${item.name}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            ${item.size !== 'One Size' ? item.size : ''}
                                            ${item.color ? ' • ' + item.color : ''}
                                            × ${item.quantity}
                                        </p>
                                    </div>
                                </div>
                                <span class="font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="flex justify-between pt-3 font-bold">
                            <span>Subtotal</span>
                            <span>$${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Shipping</span>
                            <span>$${shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) >= 50 ? '0.00' : '5.99'}</span>
                        </div>
                        <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Tax</span>
                            <span>$${(shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.08).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 font-bold text-lg">
                            <span>Total</span>
                            <span class="text-purple-600 dark:text-purple-400">
                                $${(shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) * 1.08 + 
                                    (shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) >= 50 ? 0 : 5.99)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-bold text-lg mb-2">Shipping Information</h3>
                        <div class="space-y-3">
                            <div>
                                <label for="checkout-name" class="block text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                <input type="text" id="checkout-name" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div>
                                <label for="checkout-email" class="block text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                <input type="email" id="checkout-email" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div>
                                <label for="checkout-phone" class="block text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                                <input type="tel" id="checkout-phone" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div>
                                <label for="checkout-address" class="block text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                                <input type="text" id="checkout-address" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label for="checkout-city" class="block text-gray-700 dark:text-gray-300 mb-1">City *</label>
                                    <input type="text" id="checkout-city" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                                </div>
                                <div>
                                    <label for="checkout-zip" class="block text-gray-700 dark:text-gray-300 mb-1">ZIP Code *</label>
                                    <input type="text" id="checkout-zip" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                                </div>
                            </div>
                            <div>
                                <label for="checkout-country" class="block text-gray-700 dark:text-gray-300 mb-1">Country *</label>
                                <select id="checkout-country" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                                    <option value="">Select Country</option>
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="AU">Australia</option>
                                    <option value="DE">Germany</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-lg mb-2">Payment Method</h3>
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                            <div class="flex items-center mb-3">
                                <input id="credit-card" type="radio" name="payment" value="credit-card" class="mr-2" checked>
                                <label for="credit-card" class="flex items-center">
                                    <i class="far fa-credit-card mr-2"></i>
                                    <span>Credit Card</span>
                                </label>
                            </div>
                            <div class="flex items-center mb-3">
                                <input id="paypal" type="radio" name="payment" value="paypal" class="mr-2">
                                <label for="paypal" class="flex items-center">
                                    <i class="fab fa-paypal mr-2"></i>
                                    <span>PayPal</span>
                                </label>
                            </div>
                            <div class="flex items-center">
                                <input id="apple-pay" type="radio" name="payment" value="apple-pay" class="mr-2">
                                <label for="apple-pay" class="flex items-center">
                                    <i class="fab fa-apple mr-2"></i>
                                    <span>Apple Pay</span>
                                </label>
                            </div>
                        </div>
                        
                        <div id="credit-card-form">
                            <div class="mb-3">
                                <label for="card-number" class="block text-gray-700 dark:text-gray-300 mb-1">Card Number *</label>
                                <input type="text" id="card-number" placeholder="1234 5678 9012 3456" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div class="mb-3">
                                <label for="card-name" class="block text-gray-700 dark:text-gray-300 mb-1">Name on Card *</label>
                                <input type="text" id="card-name" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label for="card-expiry" class="block text-gray-700 dark:text-gray-300 mb-1">Expiry Date *</label>
                                    <input type="text" id="card-expiry" placeholder="MM/YY" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                                </div>
                                <div>
                                    <label for="card-cvc" class="block text-gray-700 dark:text-gray-300 mb-1">CVC *</label>
                                    <input type="text" id="card-cvc" placeholder="123" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <label for="order-notes" class="block text-gray-700 dark:text-gray-300 mb-1">Order Notes</label>
                            <textarea id="order-notes" rows="2" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Complete Purchase',
        cancelButtonText: 'Back to Cart',
        background: '#ffffff',
        width: '900px',
        customClass: {
            popup: 'dark:bg-gray-800'
        },
        preConfirm: () => {
            // Validate all required fields
            const requiredFields = [
                'checkout-name', 'checkout-email', 'checkout-phone', 
                'checkout-address', 'checkout-city', 'checkout-zip', 
                'checkout-country', 'card-number', 'card-name', 
                'card-expiry', 'card-cvc'
            ];
            
            const missingFields = [];
            requiredFields.forEach(field => {
                if (!document.getElementById(field).value.trim()) {
                    missingFields.push(field);
                }
            });
            
            if (missingFields.length > 0) {
                Swal.showValidationMessage('Please fill in all required fields');
                return false;
            }
            
            // Validate email format
            const email = document.getElementById('checkout-email').value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                Swal.showValidationMessage('Please enter a valid email address');
                return false;
            }
            
            // Validate credit card number (simple check)
            const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
            if (!/^\d{13,16}$/.test(cardNumber)) {
                Swal.showValidationMessage('Please enter a valid credit card number');
                return false;
            }
            
            // Validate expiry date
            const expiry = document.getElementById('card-expiry').value.trim();
            if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
                Swal.showValidationMessage('Please enter a valid expiry date (MM/YY)');
                return false;
            }
            
            // Validate CVC
            const cvc = document.getElementById('card-cvc').value.trim();
            if (!/^\d{3,4}$/.test(cvc)) {
                Swal.showValidationMessage('Please enter a valid CVC (3 or 4 digits)');
                return false;
            }
            
            // Collect all data
            return {
                shipping: {
                    name: document.getElementById('checkout-name').value.trim(),
                    email: document.getElementById('checkout-email').value.trim(),
                    phone: document.getElementById('checkout-phone').value.trim(),
                    address: document.getElementById('checkout-address').value.trim(),
                    city: document.getElementById('checkout-city').value.trim(),
                    zip: document.getElementById('checkout-zip').value.trim(),
                    country: document.getElementById('checkout-country').value
                },
                payment: {
                    method: document.querySelector('input[name="payment"]:checked').value,
                    cardNumber: cardNumber,
                    cardName: document.getElementById('card-name').value.trim(),
                    cardExpiry: expiry,
                    cardCvc: cvc
                },
                notes: document.getElementById('order-notes').value.trim()
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            processOrder(result.value);
        }
    });
}

function processOrder(orderData) {
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    
    Swal.fire({
        title: 'Processing Your Order...',
        html: '<div class="loading-spinner mx-auto my-4"></div><p class="text-gray-500 dark:text-gray-400">Please wait while we process your order</p>',
        showConfirmButton: false,
        allowOutsideClick: false,
        background: '#ffffff',
        customClass: {
            popup: 'dark:bg-gray-800'
        }
    });
    
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        customer: orderData.shipping,
        payment: orderData.payment,
        items: shoppingCart,
        subtotal: shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0),
        shipping: shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) >= 50 ? 0 : 5.99,
        tax: shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.08,
        notes: orderData.notes
    };
    
    // In production, you would send this to your backend
    setTimeout(() => {
        Swal.fire({
            title: 'Order Placed Successfully!',
            html: `
                <div class="text-center text-gray-800 dark:text-gray-200">
                    <i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                    <p class="text-xl font-bold mb-2">Thank you for your order, ${order.customer.name}!</p>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">Your order #${order.id} is confirmed.</p>
                    
                    <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 text-left">
                        <p class="font-semibold mb-2">Order Summary:</p>
                        ${order.items.map(item => `
                            <div class="flex justify-between py-1">
                                <span class="text-gray-600 dark:text-gray-300">${item.name} (${item.size}) × ${item.quantity}</span>
                                <span class="font-medium">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        
                        <div class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>$${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Shipping</span>
                                <span>$${order.shipping.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Tax</span>
                                <span>$${order.tax.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between font-bold mt-1">
                                <span>Total</span>
                                <span class="text-purple-600 dark:text-purple-400">$${(order.subtotal + order.shipping + order.tax).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 text-left">
                        <p class="font-semibold mb-2">Shipping Information:</p>
                        <p class="text-gray-600 dark:text-gray-300">${order.customer.name}</p>
                        <p class="text-gray-600 dark:text-gray-300">${order.customer.address}</p>
                        <p class="text-gray-600 dark:text-gray-300">${order.customer.city}, ${order.customer.zip}</p>
                        <p class="text-gray-600 dark:text-gray-300">${order.customer.country}</p>
                        <p class="text-gray-600 dark:text-gray-300 mt-2">${order.customer.phone}</p>
                        <p class="text-gray-600 dark:text-gray-300">${order.customer.email}</p>
                    </div>
                    
                    <p class="text-gray-500 dark:text-gray-400">A confirmation has been sent to ${order.customer.email}</p>
                </div>
            `,
            confirmButtonText: 'Continue Shopping',
            background: '#ffffff',
            customClass: {
                popup: 'dark:bg-gray-800'
            }
        }).then(() => {
            shoppingCart = [];
            saveCartToLocalStorage();
            updateCartCount();
        });
        
        // Here you would typically send the order to your backend
        sendOrderToServer(order);
    }, 2000);
}

function sendOrderToServer(order) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxTXxN4jvaQ3NrmyP6JiFiaRsh0VSqL-oClmLRJD-fe2ftPqut3E9K_880NHLuXYDbeFA/exec";
    
    const params = new URLSearchParams();
    params.append('productName', order.items.map(item => `${item.name} (${item.size}, Qty: ${item.quantity})`).join("\n"));
    params.append('price', order.subtotal + order.shipping + order.tax);
    params.append('count', order.items.reduce((total, item) => total + item.quantity, 0));
    params.append('phone', order.customer.phone);
    params.append('name', order.customer.name);
    params.append('location', `${order.customer.address}, ${order.customer.city}, ${order.customer.zip}, ${order.customer.country}`);
    params.append('orderId', order.id);
    params.append('email', order.customer.email);
    
    fetch(`${scriptUrl}?${params.toString()}`, {
        method: "GET",
        redirect: "follow"
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .catch(error => {
        console.error('Error sending order:', error);
    });
}

// Gallery Functions
function changeGalleryImage(dotElement, productId) {
    const productCard = dotElement.closest('.product-card');
    const images = productCard.querySelectorAll('.gallery-image');
    const dots = productCard.querySelectorAll('.gallery-dot');
    
    const index = parseInt(dotElement.getAttribute('data-index'));
    
    images.forEach(img => img.classList.remove('opacity-100'));
    images.forEach(img => img.classList.add('opacity-0'));
    dots.forEach(dot => dot.classList.remove('bg-opacity-100'));
    dots.forEach(dot => dot.classList.add('bg-opacity-50'));
    
    images[index].classList.remove('opacity-0');
    images[index].classList.add('opacity-100');
    dotElement.classList.remove('bg-opacity-50');
    dotElement.classList.add('bg-opacity-100');
}

function changeModalGalleryImage(dotElement) {
    const modal = document.querySelector('.swal2-container');
    const gallery = modal.querySelector('.image-gallery');
    const images = gallery.querySelectorAll('.gallery-image');
    const dots = modal.querySelectorAll('.gallery-dot');
    const thumbnails = modal.querySelectorAll('.thumbnail');
    
    const index = parseInt(dotElement.getAttribute('data-index'));
    
    // Find current active image
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('opacity-100'));
    
    // Update images
    images[currentIndex].classList.remove('opacity-100');
    images[currentIndex].classList.add('opacity-0');
    images[index].classList.remove('opacity-0');
    images[index].classList.add('opacity-100');
    
    // Update dots
    dots[currentIndex].classList.remove('bg-opacity-100');
    dots[currentIndex].classList.add('bg-opacity-50');
    dotElement.classList.remove('bg-opacity-50');
    dotElement.classList.add('bg-opacity-100');
    
    // Update thumbnails
    thumbnails[currentIndex].classList.remove('border-purple-500');
    thumbnails[currentIndex].classList.add('border-transparent');
    thumbnails[index].classList.remove('border-transparent');
    thumbnails[index].classList.add('border-purple-500');
}

function selectSize(element) {
    const container = element.parentElement;
    container.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.remove('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
    });
    element.classList.add('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
}

function selectColor(element) {
    const container = element.parentElement;
    container.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('border-purple-500', 'ring-2', 'ring-purple-300');
    });
    element.classList.add('border-purple-500', 'ring-2', 'ring-purple-300');
}

// Search Functionality
searchInput.addEventListener('input', (e) => {
    displayProducts(e.target.value);
});

// Utility Functions
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(shoppingCart));
}

function showErrorAlert(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        background: '#ffffff',
        customClass: {
            popup: 'dark:bg-gray-800'
        }
    });
}

// Countdown Timer
function setupCountdown() {
    const now = new Date();
    const target = new Date();
    
    target.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
    target.setHours(12, 0, 0, 0);
    target.setHours(target.getHours() + 1);
    
    if (now.getDay() === 5 && now.getHours() >= 12) {
        target.setDate(target.getDate() + 7);
    }
    
    setInterval(() => {
        updateCountdown(target);
    }, 1000);
    
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

// Initialize dark mode if preferred
function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'true' || 
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
}

// Initialize
initDarkMode();
// Utility Functions
function updateCartCount() {
    const count = shoppingCart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
    count > 0 ? cartCount.classList.remove('hidden') : cartCount.classList.add('hidden');
}

function showToast(message, icon = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1a202c',
        color: 'white',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    
    Toast.fire({ icon, title: message });
}