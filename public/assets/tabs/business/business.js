/* ==========================================================================
   BUSINESS TYCOON TAP - TAB USAHA (Dashboard & Pemilih Kategori Bisnis)
   ========================================================================== */

import { hasDOM, getEl } from '../../core/dom.js';
import { state } from '../../core/state.js';
import { formatIntegerID, formatCurrencyValue } from '../../core/format.js';

const businessScreen = getEl('business-screen');
const businessStartBtn = getEl('business-start-btn');
const businessCompanyList = getEl('business-company-list');
const businessCategoryScreen = getEl('business-category-screen');
const businessCategoryBack = getEl('business-category-back');
const businessCategoryGrid = getEl('business-category-grid');

let selectedBusinessCategory = null;

/**
 * Menampilkan hanya kategori usaha yang benar-benar dimiliki pemain.
 * Kategori yang sekadar dibuka atau dipilih tidak dianggap sebagai pembelian.
 */
export function renderBusinessCompanies() {
  if (!businessCompanyList) return;
  businessCompanyList.innerHTML = '';
  const owned = Array.isArray(state.ownedBusinesses) ? state.ownedBusinesses : [];
  owned.forEach(function (business) {
    const card = document.createElement('article');
    card.className = 'business-company-card';
    const top = document.createElement('div');
    top.className = 'business-company-card__top';
    const identity = document.createElement('div');
    identity.className = 'business-company-card__identity';
    const name = document.createElement('h3');
    name.textContent = business.category;
    const count = document.createElement('span');
    count.textContent = formatIntegerID(business.count || 1) + ' perusahaan';
    identity.appendChild(name);
    identity.appendChild(count);
    const icon = document.createElement('div');
    icon.className = 'business-company-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = business.category.slice(0, 1).toUpperCase();
    const chevron = document.createElement('span');
    chevron.className = 'business-company-card__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    top.appendChild(icon);
    top.appendChild(identity);
    top.appendChild(chevron);
    const income = document.createElement('div');
    income.className = 'business-company-card__income';
    const amount = document.createElement('strong');
    amount.textContent = 'Rp' + formatCurrencyValue(business.incomePerHour || 0);
    const unit = document.createElement('span');
    unit.textContent = 'per jam';
    income.appendChild(amount);
    income.appendChild(unit);
    card.appendChild(top);
    card.appendChild(income);
    businessCompanyList.appendChild(card);
  });
}


/**
 * Mendaftarkan event listener khusus tab Usaha (tombol mulai & pemilih kategori).
 */
export function bindBusinessEvents() {
  if (!hasDOM) return;

  if (businessStartBtn && businessCategoryScreen) {
    businessStartBtn.addEventListener('click', function () {
      if (businessScreen) {
        businessScreen.hidden = true;
        businessScreen.classList.remove('screen--active');
      }
      businessCategoryScreen.hidden = false;
      businessCategoryScreen.classList.add('screen--active');
      if (businessCategoryGrid) {
        businessCategoryGrid.querySelectorAll('.business-category-card').forEach(function (card) {
          card.classList.remove('is-selected');
          card.setAttribute('aria-pressed', 'false');
        });
      }
    });
  }

  if (businessCategoryBack) {
    businessCategoryBack.addEventListener('click', function () {
      if (businessCategoryScreen) {
        businessCategoryScreen.hidden = true;
        businessCategoryScreen.classList.remove('screen--active');
      }
      if (businessScreen && state.activeTab === 'Business') {
        businessScreen.hidden = false;
        businessScreen.classList.add('screen--active');
      }
    });
  }

  if (businessCategoryGrid) {
    businessCategoryGrid.addEventListener('click', function (event) {
      const card = event.target.closest('[data-business-category]');
      if (!card) return;
      selectedBusinessCategory = card.getAttribute('data-business-category');
      businessCategoryGrid.querySelectorAll('.business-category-card').forEach(function (item) {
        const selected = item === card;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    });
  }
}
