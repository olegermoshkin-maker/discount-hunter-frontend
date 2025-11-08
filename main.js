const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();
tg.MainButton.text = 'Кабинет'; tg.MainButton.onClick(() => document.getElementById('cabinet').style.display = 'block');

const BACKEND_URL = 'https://discount-hunter-backend.onrender.com';  // Твой Render URL после деплоя

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');

searchBtn.onclick = async () => {
  const query = searchInput.value;
  if (!query) { tg.showAlert('Что ищем?'); return; }
  searchBtn.innerText = 'Ищем...'; searchBtn.disabled = true;
  try {
    const res = await fetch(`${BACKEND_URL}/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, userId: tg.initDataUnsafe.user.id })
    });
    const data = await res.json();
    renderProducts(data.products);
  } catch (e) { tg.showAlert('Маркеты в депрессии! Попробуй позже.'); }
  searchBtn.innerText = 'Ищи скидки!'; searchBtn.disabled = false;
};

function renderProducts(products) {
  results.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>Цена: $$ {p.price}₽ ( $${p.discount}% off!)</p>
      <p>Из: ${p.market}</p>
      <a href="${p.affiliateLink}" target="_blank" style="color: gold;">Купить</a>
      <br><button onclick="addToWishlist('${p.id}')">В вишлист ❤️</button>
    `;
    results.appendChild(card);
  });
}

window.addToWishlist = async (id) => {
  try {
    const res = await fetch(`${BACKEND_URL}/wishlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, userId: tg.initDataUnsafe.user.id })
    });
    const data = await res.json();
    tg.showAlert(data.status);
  } catch (e) { tg.showAlert('Премиум для вишлиста!'); }
};

// Кабинет
document.getElementById('wishlistBtn').onclick = async () => {
  const res = await fetch(`${BACKEND_URL}/wishlist/${tg.initDataUnsafe.user.id}`);
  const data = await res.json();
  tg.showAlert('Вишлист: ' + data.wishlist.length + ' товаров. Скоро UI!');
};
document.getElementById('premiumBtn').onclick = () => {
  tg.openInvoice('premium_month', 'Премиум месяц', 'Алерты + история', [{label: '199₽', amount: 19900}]);  // Stars
  // Или ЮKassa: window.open(`${BACKEND_URL}/payment?amount=199&period=month`);
};
document.getElementById('referralBtn').onclick = () => {
  const refCode = 'ref_' + tg.initDataUnsafe.user.id;
  tg.shareUrl(`https://t.me/discount_hunter_prod_bot?start=${refCode}`, 'Пригласи друга +5 премиум запросов!');
};
document.getElementById('shareBtn').onclick = async () => {
  const res = await fetch(`${BACKEND_URL}/wishlist/${tg.initDataUnsafe.user.id}`);
  const data = await res.json();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Мой вишлист скидок: ' + JSON.stringify(data.wishlist, null, 2), 10, 10);
  doc.save('wishlist.pdf');
  tg.showAlert('PDF готов! Шерь в TG/Email.');
  tg.shareUrl('data:application/pdf;base64,' + btoa(doc.output('arraybuffer')), 'Смотри мои скидки!');
};