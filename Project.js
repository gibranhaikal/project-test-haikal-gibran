// Header Scroll Behavior
let lastScrollPosition = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Hide header on scroll down, show on scroll up
    if (currentScroll > lastScrollPosition && currentScroll > 100) {
        header.classList.add('hide');
    } else {
        header.classList.remove('hide');
    }

    // Add transparency to header on scroll
    if (currentScroll > 50) {
        header.classList.add('transparent');
    } else {
        header.classList.remove('transparent');
    }

    lastScrollPosition = currentScroll;
});

// Parallax Effect
const bannerImage = document.querySelector('.banner-image');
const bannerContent = document.querySelector('.banner-content');

function handleParallax() {
    const scrolled = window.pageYOffset;

    if (bannerImage) {
        bannerImage.style.transform = `translateY(${scrolled * 0.5}px)`;
    }

    if (bannerContent) {
        bannerContent.style.transform = `translate(-50%, ${-50 + scrolled * 0.2}%)`;
    }
}

let isTicking = false;

window.addEventListener('scroll', () => {
    if (!isTicking) {
        window.requestAnimationFrame(() => {
            handleParallax();
            isTicking = false;
        });
        isTicking = true;
    }
});

// API Configuration
const API_BASE_URL = 'https://suitmedia-backend.suitdev.com/api/ideas';

// State Management
const state = {
    currentPage: 1,
    perPage: 10,
    sort: 'newest',
    totalItems: 0,
    isLoading: false
};

// Load state from URL
const loadStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    state.currentPage = parseInt(params.get('page')) || 1;
    state.perPage = parseInt(params.get('perPage')) || 10;
    state.sort = params.get('sort') || 'newest';

    document.getElementById('perPage').value = state.perPage;
    document.getElementById('sort').value = state.sort;
};

// Update URL with current state
const updateURL = () => {
    const params = new URLSearchParams();
    params.set('page', state.currentPage);
    params.set('perPage', state.perPage);
    params.set('sort', state.sort);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
};

// Fetch posts from API
const fetchPosts = async () => {
    try {
        state.isLoading = true;
        const sortParam = state.sort === 'newest' ? '-published_at' : 'published_at';

        const url = `${API_BASE_URL}?page[number]=${state.currentPage}&page[size]=${state.perPage}&append[]=small_image&append[]=medium_image&sort=${sortParam}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.meta && data.meta.total) {
            state.totalItems = data.meta.total;
        }

        return data.data || [];
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    } finally {
        state.isLoading = false;
    }
};

// Render Posts
const renderPosts = async () => {
    const grid = document.querySelector('.grid');

    grid.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const posts = await fetchPosts();

        if (!posts || posts.length === 0) {
            grid.innerHTML = '<div class="no-posts">No posts found</div>';
            return;
        }

        grid.innerHTML = posts.map(post => {
            const imageUrl = post.medium_image?.[0]?.url || '';
            const date = new Date(post.published_at);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
    <div class="card">
        <div class="card-image">
            ${imageUrl ? `
                <img src="${imageUrl}" alt="${post.title}" loading="lazy" onerror="this.src='../img/post2.jpg'" />
            ` : `
                <div class="no-image">No image available</div>
            `}
        </div>
        <div class="card-content">
            <div class="card-date">${formattedDate}</div>
            <h3 class="card-title">${post.title}</h3>
        </div>
    </div>
`;

        }).join('');

        const start = (state.currentPage - 1) * state.perPage + 1;
        const end = Math.min(start + posts.length - 1, state.totalItems);
        document.querySelector('.showing').textContent = `Showing ${start}-${end} of ${state.totalItems}`;

    } catch (error) {
        console.error('Error rendering posts:', error);
        grid.innerHTML = '<div class="error">Error loading posts. Please try again later.</div>';
    }
};

// Render Pagination
const renderPagination = () => {
    const pagination = document.querySelector('.pagination');
    const totalPages = Math.ceil(state.totalItems / state.perPage);

    let buttons = [];
    if (state.currentPage > 1) {
        buttons.push('<button onclick="changePage(1)">«</button>');
        buttons.push(`<button onclick="changePage(${state.currentPage - 1})">‹</button>`);
    }

    for (let i = Math.max(1, state.currentPage - 2); i <= Math.min(totalPages, state.currentPage + 2); i++) {
        buttons.push(`<button onclick="changePage(${i})" ${i === state.currentPage ? 'class="active"' : ''}>${i}</button>`);
    }

    if (state.currentPage < totalPages) {
        buttons.push(`<button onclick="changePage(${state.currentPage + 1})">›</button>`);
        buttons.push(`<button onclick="changePage(${totalPages})">»</button>`);
    }

    pagination.innerHTML = buttons.join('');
};

// Event Handlers
const changePage = (page) => {
    state.currentPage = page;
    updateURL();
    renderPosts().then(() => renderPagination());
};

document.getElementById('perPage').addEventListener('change', (e) => {
    state.perPage = parseInt(e.target.value);
    state.currentPage = 1;
    updateURL();
    renderPosts().then(() => renderPagination());
});

document.getElementById('sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    updateURL();
    renderPosts().then(() => renderPagination());
});

// Initialize
loadStateFromURL();
renderPosts().then(() => renderPagination());


