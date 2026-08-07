const SUPABASE_URL = "https://pwkwtulyvwvxddtniidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_aVaAogTKMyIeSX181EF2nA_CxxU-1eH";
const INSTAGRAM_USERNAME = "baby_bloom_tj_"; // Актуальный никнейм из скриншота

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productsData = [];

async function fetchProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: false });

  if (error) {
    grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Ошибка загрузки товаров</p>';
    return;
  }

  productsData = data || [];
  renderProducts('all');
}

function renderProducts(filter) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  const filtered = filter === 'all' 
    ? productsData 
    : productsData.filter(p => p.status === filter);

  if (!filtered.length) {
    grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 40px 0; color: #888;">В этой категории товаров пока нет</p>';
    return;
  }

  filtered.forEach(p => {
    let badgeText = 'В наличии';
    let badgeClass = 'in-stock';
    if (p.status === 'sale') { badgeText = '🔥 По акции'; badgeClass = 'sale'; }
    if (p.status === 'preorder') { badgeText = 'Предзаказ'; badgeClass = 'preorder'; }

    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300x350?text=Baby+Bloom';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="image-wrapper">
        <span class="badge ${badgeClass}">${badgeText}</span>
        <img src="${mainImg}" alt="${p.title}">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>
        <p class="product-price">${p.price}</p>
        <button class="order-btn" onclick="orderProduct('${p.title}', '${p.price}')">Заказать в Direct</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function orderProduct(title, price) {
  const text = encodeURIComponent(`Здравствуйте! Хочу заказать товар: "${title}" за ${price}`);
  window.open(`https://ig.me/m/${INSTAGRAM_USERNAME}?text=${text}`, '_blank');
}

// Фильтрация
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
});