const SUPABASE_URL = "https://pwkwtulyvwvxddtniidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_aVaAogTKMyIeSX181EF2nA_CxxU-1eH";
const INSTAGRAM_USERNAME = "baby_bloom_tj_";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Легкая встроенная заглушка (не требует интернета и не лагает)
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='100%25' height='100%25' fill='%23f5e2d8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%234a3b32'%3EBaby Bloom%3C/text%3E%3C/svg%3E";

let allProducts = [];
let currentFilter = 'all';

// 1. Загрузка данных один раз при старте
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    allProducts = data || [];
    renderProducts();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="loading">Ошибка загрузки товаров</div>';
  }
}

// 2. Мгновенная отрисовка из памяти без лагов
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = currentFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.status === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '<div class="loading">В этой категории пока нет товаров</div>';
    return;
  }

  // Используем DocumentFragment для плавной работы на слабых телефонах
  const fragment = document.createDocumentFragment();

  filtered.forEach(p => {
    let badgeText = 'В наличии';
    let badgeClass = 'in-stock';
    if (p.status === 'sale') { badgeText = '🔥 По акции'; badgeClass = 'sale'; }
    if (p.status === 'preorder') { badgeText = 'Предзаказ'; badgeClass = 'preorder'; }

    const mainImg = (p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : DEFAULT_IMAGE;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openModal(p);
    
    card.innerHTML = `
      <div class="product-image-container">
        <span class="badge ${badgeClass}">${badgeText}</span>
        <img src="${mainImg}" alt="${p.title}" loading="lazy" onerror="this.src='${DEFAULT_IMAGE}'">
      </div>
      <div class="product-info">
        <div class="product-title">${p.title}</div>
        <div class="product-price">${p.price}</div>
      </div>
    `;
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
}

// 3. Быстрое переключение категорий
window.filterProducts = function(status, btnElement) {
  currentFilter = status;
  
  // Переключение активной кнопки
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderProducts();
};

// 4. Логика модального окна
window.openModal = function(product) {
  const modal = document.getElementById('modal');
  if (!modal) return;

  const mainImg = (product.images && product.images.length > 0) ? product.images[0] : DEFAULT_IMAGE;
  document.getElementById('modal-main-img').src = mainImg;

  // Значок
  const badgeEl = document.getElementById('modal-badge');
  if (badgeEl) {
    let badgeText = 'В наличии';
    if (product.status === 'sale') badgeText = '🔥 По акции';
    if (product.status === 'preorder') badgeText = 'Предзаказ';
    badgeEl.innerText = badgeText;
  }

  document.getElementById('modal-title').innerText = product.title || '';
  document.getElementById('modal-price').innerText = product.price || '';
  document.getElementById('modal-description').innerText = product.description || 'Описание отсутствует';

  // Галерея миниатюр
  const thumbsContainer = document.getElementById('modal-thumbnails');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    if (product.images && product.images.length > 1) {
      product.images.forEach(imgUrl => {
        const thumb = document.createElement('img');
        thumb.src = imgUrl;
        thumb.onclick = () => { document.getElementById('modal-main-img').src = imgUrl; };
        thumbsContainer.appendChild(thumb);
      });
    }
  }

  // Ссылка в Instagram Direct
  const igLink = document.getElementById('modal-ig-link');
  if (igLink) {
    const text = encodeURIComponent(`Здравствуйте! Хочу заказать: "${product.title}" (${product.price})`);
    igLink.href = `https://ig.me/m/${INSTAGRAM_USERNAME}?text=${text}`;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeModal = function(e) {
  if (e.target.id === 'modal') window.closeModalDirect();
};

window.closeModalDirect = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = 'auto';
};

// Старт при загрузке
document.addEventListener('DOMContentLoaded', loadProducts);