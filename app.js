const SUPABASE_URL = "https://pwkwtulyvwvxddtniidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_aVaAogTKMyIeSX181EF2nA_CxxU-1eH";
const INSTAGRAM_USERNAME = "baby_bloom_tj_";

// Инициализация Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Встроенная SVG-картинка (работает мгновенно, не лагает и не требует сети)
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='100%25' height='100%25' fill='%23f5e2d8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%234a3b32'%3EBaby Bloom%3C/text%3E%3C/svg%3E";

let allProducts = [];
let currentFilter = 'all';

function normalizeSizes(sizes) {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map(s => ({ size: String(s.size || '').trim(), qty: Math.max(0, parseInt(s.qty, 10) || 0) }))
    .filter(s => s.size);
}

function getAvailableSizes(sizes) {
  return normalizeSizes(sizes).filter(s => s.qty > 0);
}

function formatSizesText(sizes) {
  const available = getAvailableSizes(sizes);
  if (!available.length) return '';
  return available.map(s => s.size).join(' · ');
}

// Загрузка товаров из Supabase
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
    console.error('Ошибка Supabase:', err);
    grid.innerHTML = '<div class="loading">Ошибка загрузки товаров. Проверьте соединение.</div>';
  }
}

// Отрисовка товаров
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

  grid.innerHTML = filtered.map(p => {
    let badgeText = 'В наличии';
    let badgeClass = 'badge-in_stock';
    if (p.status === 'sale') { badgeText = '🔥 По акции'; badgeClass = 'badge-preorder'; }
    if (p.status === 'preorder') { badgeText = 'Предзаказ'; badgeClass = 'badge-preorder'; }

    const mainImg = (p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : DEFAULT_IMAGE;
    const sizesText = formatSizesText(p.sizes);

    return `
      <div class="product-card" onclick='openModalById(${p.id})'>
        <div class="card-image-wrap">
          <span class="badge ${badgeClass}">${badgeText}</span>
          <img src="${mainImg}" alt="${p.title || 'Товар'}" loading="lazy" onerror="this.src='${DEFAULT_IMAGE}'">
        </div>
        <div class="card-content">
          <div class="card-title">${p.title || ''}</div>
          ${sizesText ? `<div class="card-sizes">${sizesText}</div>` : ''}
          <div class="card-price">${p.price || ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Фильтрация товаров по кнопкам
window.filterProducts = function(status, btnElement) {
  currentFilter = status;
  
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (btnElement) {
    btnElement.classList.add('active');
  }

  renderProducts();
};

// Открытие модального окна
window.openModalById = function(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('modal');
  if (!modal) return;

  const mainImg = (product.images && product.images.length > 0) ? product.images[0] : DEFAULT_IMAGE;
  const modalImg = document.getElementById('modal-main-img');
  if (modalImg) modalImg.src = mainImg;

  // Значок статуса
  const badgeEl = document.getElementById('modal-badge');
  if (badgeEl) {
    let badgeText = 'В наличии';
    if (product.status === 'sale') badgeText = '🔥 По акции';
    if (product.status === 'preorder') badgeText = 'Предзаказ';
    badgeEl.innerText = badgeText;
  }

  const titleEl = document.getElementById('modal-title');
  if (titleEl) titleEl.innerText = product.title || '';

  const priceEl = document.getElementById('modal-price');
  if (priceEl) priceEl.innerText = product.price || '';

  const sizesEl = document.getElementById('modal-sizes');
  const sizesWrap = document.getElementById('modal-sizes-wrap');
  if (sizesEl && sizesWrap) {
    const available = getAvailableSizes(product.sizes);
    if (available.length) {
      sizesEl.innerHTML = available.map(s =>
        `<span class="size-tag">${s.size}</span>`
      ).join('');
      sizesWrap.style.display = 'block';
    } else {
      sizesEl.innerHTML = '';
      sizesWrap.style.display = 'none';
    }
  }

  const descEl = document.getElementById('modal-description');
  if (descEl) descEl.innerText = product.description || 'Описание отсутствует';

  // Галерея миниатюр
  const thumbsContainer = document.getElementById('modal-thumbnails');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    if (product.images && product.images.length > 1) {
      product.images.forEach(imgUrl => {
        const thumb = document.createElement('img');
        thumb.src = imgUrl;
        thumb.onclick = () => { if (modalImg) modalImg.src = imgUrl; };
        thumbsContainer.appendChild(thumb);
      });
    }
  }

  // Ссылка в Instagram
  const igLink = document.getElementById('modal-ig-link');
  if (igLink) {
    const sizesNote = formatSizesText(product.sizes);
    const sizePart = sizesNote ? `, размер: ${sizesNote}` : '';
    const text = encodeURIComponent(`Здравствуйте! Хочу заказать: "${product.title}" (${product.price}${sizePart})`);
    igLink.href = `https://ig.me/m/${INSTAGRAM_USERNAME}?text=${text}`;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function(e) {
  if (e.target.id === 'modal') window.closeModalDirect();
};

window.closeModalDirect = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = 'auto';
};

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', loadProducts);