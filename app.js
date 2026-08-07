const INSTAGRAM_USERNAME = "baby_bloom.tj";

// Ваши подключенные ключи Supabase
const SUPABASE_URL = "https://pwkwtulyvwvxddtniidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_aVaAogTKMyIeSX181EF2nA_CxxU-1eH";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = [];

// Загрузка товаров из базы данных
async function fetchProductsFromDB() {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = `<div class="loading">Загрузка товаров...</div>`;

  const { data, error } = await db.from('products').select('*').order('id', { ascending: false });

  if (error) {
    grid.innerHTML = `<div class="loading">Ошибка загрузки товаров</div>`;
    console.error(error);
    return;
  }

  allProducts = data;
  renderProducts("all");
}

function renderProducts(filter = "all") {
  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  const filtered = filter === "all" 
    ? allProducts 
    : allProducts.filter(p => p.status === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="loading">В этой категории пока нет товаров</div>`;
    return;
  }

  filtered.forEach(product => {
    const statusText = product.status === "in_stock" ? "В наличии" : "Предзаказ";
    const statusClass = product.status === "in_stock" ? "badge-in_stock" : "badge-preorder";
    const coverImage = product.images && product.images.length > 0 
      ? product.images[0] 
      : 'https://via.placeholder.com/400';

    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openModal(product);
    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${coverImage}" alt="${product.title}" loading="lazy">
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="card-content">
        <div class="card-title">${product.title}</div>
        <div class="card-price">${product.price}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterProducts(type, btnElement) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  btnElement.classList.add("active");
  renderProducts(type);
}

function openModal(product) {
  const modal = document.getElementById("modal");
  const statusText = product.status === "in_stock" ? "В наличии" : "Предзаказ";
  const statusClass = product.status === "in_stock" ? "badge-in_stock" : "badge-preorder";

  document.getElementById("modal-title").innerText = product.title;
  document.getElementById("modal-price").innerText = product.price;
  document.getElementById("modal-description").innerText = product.description || "";
  
  const badgeEl = document.getElementById("modal-badge");
  badgeEl.innerText = statusText;
  badgeEl.className = `badge ${statusClass}`;

  const mainImg = document.getElementById("modal-main-img");
  const thumbsContainer = document.getElementById("modal-thumbnails");
  thumbsContainer.innerHTML = "";

  if (product.images && product.images.length > 0) {
    mainImg.src = product.images[0];

    if (product.images.length > 1) {
      product.images.forEach((imgUrl, index) => {
        const thumb = document.createElement("img");
        thumb.src = imgUrl;
        thumb.className = `thumb-img ${index === 0 ? 'active' : ''}`;
        thumb.onclick = () => {
          mainImg.src = imgUrl;
          document.querySelectorAll(".thumb-img").forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        };
        thumbsContainer.appendChild(thumb);
      });
    }
  }

  const igMessage = encodeURIComponent(
    `Здравствуйте! Хочу оформить ${product.status === "in_stock" ? "заказ" : "предзаказ"} на товар: "${product.title}" (${product.price}).`
  );
  const igLink = `https://ig.me/m/${INSTAGRAM_USERNAME}?text=${igMessage}`;
  document.getElementById("modal-ig-link").href = igLink;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(event) {
  if (event.target.id === "modal") closeModalDirect();
}

function closeModalDirect() {
  document.getElementById("modal").classList.remove("active");
  document.body.style.overflow = "auto";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProductsFromDB();
});