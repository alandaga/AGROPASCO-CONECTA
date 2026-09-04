/**
 * ==============================================================================
 * AGROPASCO-CONECTA - COMERCIO JUSTO LOCAL
 * Proyecto Oficial - Concurso Escolar Nacional "Crea y Emprende 2026"
 * Área Curricular: Educación para el Trabajo (EPT) - Computación e Informática
 * ==============================================================================
 * Archivo: app.js
 * Propósito: Lógica reactiva completa de la SPA:
 *            - Gestión de datos (Google Sheets CSV con fallback local resiliente)
 *            - Renderizado reactivo del catálogo y filtros por categoría
 *            - Buscador en tiempo real
 *            - Carrito de compras con persistencia en localStorage
 *            - Offcanvas lateral interactivo
 *            - Modal de checkout con validación estricta
 *            - Generador determinista de pedidos hacia WhatsApp API
 *            - Modal educativo para agricultores
 *            - Sistema modular de notificaciones Toast en Tailwind CSS
 * ==============================================================================
 */

(function () {
  "use strict";

  /* ============================================================================
     1. ESTADO GLOBAL DE LA APLICACIÓN
     ============================================================================ */
  const AppState = {
    products: [],
    cart: [],
    activeCategory: "all",
    searchQuery: "",
    dataSource: "fallback", // 'sheets' | 'fallback'
    catalogQuantities: {}   // Almacena la cantidad seleccionada en cada tarjeta del catálogo
  };

  const STORAGE_KEYS = {
    CART: "agropasco_cart_items_2026",
    FARMER_PRODUCTS: "agropasco_custom_farmer_products_2026"
  };

  const DEFAULT_CATEGORY_IMAGES = {
    tuberculos: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
    lacteos: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80",
    acuicultura: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    otros: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80"
  };

  /* ============================================================================
     2. REFERENCIAS AL DOM
     ============================================================================ */
  const DOM = {
    // Buscadores
    searchInputDesktop: document.getElementById("search-input-desktop"),
    searchInputMobile: document.getElementById("search-input-mobile"),
    btnClearSearchDesktop: document.getElementById("btn-clear-search-desktop"),
    
    // Contenedores del catálogo y filtros
    categoryPillsContainer: document.getElementById("category-pills-container"),
    productsGrid: document.getElementById("products-grid"),
    productCountBadge: document.getElementById("product-count-badge"),
    dataSourceStatus: document.getElementById("data-source-status"),
    dataSourceText: document.getElementById("data-source-text"),
    btnResetFilters: document.getElementById("btn-reset-filters"),
    emptyState: document.getElementById("empty-state"),
    btnEmptyReset: document.getElementById("btn-empty-reset"),
    loadingState: document.getElementById("loading-state"),

    // Carrito de compras y Badges
    btnOpenCart: document.getElementById("btn-open-cart"),
    btnFloatingCart: document.getElementById("btn-floating-cart"),
    cartBadgeCount: document.getElementById("cart-badge-count"),
    floatingCartBadge: document.getElementById("floating-cart-badge"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartBackdrop: document.getElementById("cart-backdrop"),
    cartPanel: document.getElementById("cart-panel"),
    btnCloseCart: document.getElementById("btn-close-cart"),
    cartItemsContainer: document.getElementById("cart-items-container"),
    cartEmptyMessage: document.getElementById("cart-empty-message"),
    btnCartEmptyShop: document.getElementById("btn-cart-empty-shop"),
    cartSummarySection: document.getElementById("cart-summary-section"),
    cartSubtotalVal: document.getElementById("cart-subtotal-val"),
    cartTotalVal: document.getElementById("cart-total-val"),
    cartItemCountText: document.getElementById("cart-item-count-text"),
    btnProceedCheckout: document.getElementById("btn-proceed-checkout"),
    btnClearCart: document.getElementById("btn-clear-cart"),

    // Modal de Checkout
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutBackdrop: document.getElementById("checkout-backdrop"),
    btnCloseCheckout: document.getElementById("btn-close-checkout"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutSummaryTotal: document.getElementById("checkout-summary-total"),
    checkoutSummaryItems: document.getElementById("checkout-summary-items"),
    buyerNameInput: document.getElementById("buyer-name"),
    buyerPhoneInput: document.getElementById("buyer-phone"),
    buyerAddressInput: document.getElementById("buyer-address"),
    buyerReferenceInput: document.getElementById("buyer-reference"),
    buyerNotesInput: document.getElementById("buyer-notes"),

    // Modal del Productor y Formulario de Cosechas
    producerModal: document.getElementById("producer-modal"),
    producerBackdrop: document.getElementById("producer-backdrop"),
    btnCloseProducerModal: document.getElementById("btn-close-producer-modal"),
    btnOpenProducerModal: document.getElementById("btn-open-producer-modal"),
    btnOpenProducerModalTop: document.getElementById("btn-open-producer-modal-top"),
    btnHeroProducer: document.getElementById("btn-hero-producer"),
    btnBannerProducer: document.getElementById("btn-banner-producer"),
    linkSupportWhatsapp: document.getElementById("link-support-whatsapp"),

    // Formulario de publicación del agricultor
    farmerProductForm: document.getElementById("farmer-product-form"),
    farmerNameProd: document.getElementById("farmer-name-prod"),
    farmerCategoryProd: document.getElementById("farmer-category-prod"),
    farmerProducerName: document.getElementById("farmer-producer-name"),
    farmerLocationProd: document.getElementById("farmer-location-prod"),
    farmerPriceProd: document.getElementById("farmer-price-prod"),
    farmerUnitProd: document.getElementById("farmer-unit-prod"),
    farmerBadgeProd: document.getElementById("farmer-badge-prod"),
    farmerPhoneProd: document.getElementById("farmer-phone-prod"),
    farmerImageFile: document.getElementById("farmer-image-file"),
    farmerFileLabel: document.getElementById("farmer-file-label"),
    farmerImageUrl: document.getElementById("farmer-image-url"),
    farmerPreviewImg: document.getElementById("farmer-preview-img"),
    farmerPreviewHint: document.getElementById("farmer-preview-hint"),
    farmerDescProd: document.getElementById("farmer-desc-prod"),

    // Toasts
    toastContainer: document.getElementById("toast-container")
  };

  /* ============================================================================
     3. SISTEMA DE NOTIFICACIONES TOAST (TAILWIND CSS)
     ============================================================================ */
  /**
   * Muestra una notificación emergente estilizada y accesible.
   * @param {string} title Título de la notificación
   * @param {string} message Mensaje explicativo
   * @param {'success'|'error'|'warning'|'info'} type Tipo de toast
   * @param {number} duration Milisegundos antes del auto-cierre
   */
  function showToast(title, message, type = "success", duration = 3500) {
    if (!DOM.toastContainer) return;

    const toastId = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
    
    // Configuración según tipo
    const typeConfig = {
      success: {
        borderClass: "border-emerald-500",
        bgIconClass: "bg-emerald-100 text-emerald-700",
        icon: "fa-solid fa-circle-check",
        progressBarClass: "bg-emerald-500"
      },
      error: {
        borderClass: "border-rose-500",
        bgIconClass: "bg-rose-100 text-rose-700",
        icon: "fa-solid fa-circle-xmark",
        progressBarClass: "bg-rose-500"
      },
      warning: {
        borderClass: "border-amber-500",
        bgIconClass: "bg-amber-100 text-amber-700",
        icon: "fa-solid fa-triangle-exclamation",
        progressBarClass: "bg-amber-500"
      },
      info: {
        borderClass: "border-sky-500",
        bgIconClass: "bg-sky-100 text-sky-700",
        icon: "fa-solid fa-circle-info",
        progressBarClass: "bg-sky-500"
      }
    };

    const cfg = typeConfig[type] || typeConfig.info;

    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `pointer-events-auto bg-white rounded-2xl shadow-xl border-l-4 ${cfg.borderClass} border border-slate-200 p-4 transition-all duration-300 transform translate-y-4 opacity-0 flex items-start gap-3 relative overflow-hidden`;

    toast.innerHTML = `
      <div class="w-9 h-9 rounded-xl ${cfg.bgIconClass} flex items-center justify-center shrink-0 mt-0.5">
        <i class="${cfg.icon} text-base"></i>
      </div>
      <div class="flex-1 min-w-0 pr-2">
        <h4 class="text-xs font-bold text-slate-900 leading-tight">${title}</h4>
        <p class="text-xs text-slate-600 mt-0.5 leading-snug">${message}</p>
      </div>
      <button type="button" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors close-toast-btn" aria-label="Cerrar notificación">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 overflow-hidden">
        <div class="h-full ${cfg.progressBarClass} transition-all ease-linear" style="width: 100%; transition-duration: ${duration}ms;"></div>
      </div>
    `;

    DOM.toastContainer.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-4", "opacity-0");
      toast.classList.add("translate-y-0", "opacity-100");
      const bar = toast.querySelector(`.${cfg.progressBarClass}`);
      if (bar) {
        requestAnimationFrame(() => {
          bar.style.width = "0%";
        });
      }
    });

    // Función para descartar
    const dismiss = () => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };

    // Botón manual de cierre
    const closeBtn = toast.querySelector(".close-toast-btn");
    if (closeBtn) closeBtn.addEventListener("click", dismiss);

    // Temporizador automático
    setTimeout(dismiss, duration);
  }

  /* ============================================================================
     4. PERSISTENCIA EN LOCALSTORAGE (CARRITO)
     ============================================================================ */
  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          AppState.cart = parsed;
        }
      }
    } catch (e) {
      console.warn("[AgroPasco] No se pudo leer el carrito desde localStorage:", e);
      AppState.cart = [];
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(AppState.cart));
    } catch (e) {
      console.warn("[AgroPasco] Error al guardar el carrito en localStorage:", e);
    }
  }

  /**
   * Obtiene los productos registrados por agricultores desde localStorage.
   * @returns {Array<Object>}
   */
  function getSavedFarmerProducts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FARMER_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("[AgroPasco] Error al leer cosechas de agricultores desde localStorage:", e);
    }
    return [];
  }

  /**
   * Guarda la lista de productos de agricultores en localStorage.
   * @param {Array<Object>} list Lista de productos de agricultores
   */
  function saveFarmerProductsToStorage(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.FARMER_PRODUCTS, JSON.stringify(list));
    } catch (e) {
      console.warn("[AgroPasco] Error al guardar cosechas de agricultores en localStorage:", e);
    }
  }

  /* ============================================================================
     4.1. COMUNICACIÓN CON LA API REST CENTRAL (SINCRONIZACIÓN MULTIUSUARIO)
     ============================================================================ */
  const API_ENDPOINTS = {
    PRODUCTS: "/api/products",
    HEALTH: "/api/health"
  };

  /**
   * Consulta las cosechas compartidas desde el servidor central /api/products.
   * Si el servidor no está disponible (ej. modo offline file:///), devuelve null.
   * @returns {Promise<Array<Object>|null>}
   */
  async function apiFetchSharedProducts() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const resp = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      // Servidor no disponible o modo offline (file:///)
    }
    return null;
  }

  /**
   * Envía una nueva cosecha al servidor central para que todos los usuarios la vean.
   * @param {Object} product Objeto de producto
   * @returns {Promise<boolean>}
   */
  async function apiSaveFarmerProduct(product) {
    try {
      const resp = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Accept": "application/json"
        },
        body: JSON.stringify(product)
      });
      if (resp.ok) {
        const result = await resp.json();
        return result.success === true;
      }
    } catch (err) {
      console.warn("[AgroPasco] No se pudo guardar en el servidor central:", err);
    }
    return false;
  }

  /**
   * Elimina una cosecha del servidor central por ID.
   * @param {string} productId ID del producto
   * @returns {Promise<boolean>}
   */
  async function apiDeleteFarmerProduct(productId) {
    try {
      const resp = await fetch(`${API_ENDPOINTS.PRODUCTS}?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
      });
      if (resp.ok) {
        const result = await resp.json();
        return result.success === true;
      }
    } catch (err) {
      console.warn("[AgroPasco] Error al eliminar del servidor central:", err);
    }
    return false;
  }

  /* ============================================================================
     5. CAPA DE DATOS Y PARSER RESILIENTE (GOOGLE SHEETS / CSV / FALLBACK)
     ============================================================================ */
  /**
   * Parser robusto para líneas de CSV que maneja comillas dobles y comas internas.
   * @param {string} text Contenido del archivo CSV
   * @returns {Array<Object>}
   */
  function parseCSV(text) {
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length < 2) return [];

    // Función auxiliar para separar celdas de una línea CSV
    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] !== undefined ? values[index] : "";
      });

      // Mapear campos normalizados
      if (item.name || item.nombre) {
        records.push({
          id: item.id || `PROD-CSV-${i}`,
          name: item.name || item.nombre || "Producto Pasqueño",
          category: (item.category || item.categoria || "otros").toLowerCase().trim(),
          producer: item.producer || item.productor || "Productor Local",
          location: item.location || item.ubicacion || "Pasco, Perú",
          price: parseFloat(item.price || item.precio) || 0,
          unit: item.unit || item.unidad || "unidad",
          image: item.image || item.imagen || "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
          phone: item.phone || item.telefono || APP_CONFIG.centralWhatsAppNumber,
          badge: item.badge || item.etiqueta || "Cosecha Fresca",
          description: item.description || item.descripcion || "Producto fresco cosechado en la región Pasco bajo principios de comercio justo."
        });
      }
    }
    return records;
  }

  /**
   * Carga los productos desde Google Sheets o desde el catálogo de respaldo.
   */
  async function loadProducts() {
    if (DOM.loadingState) DOM.loadingState.classList.remove("hidden");
    if (DOM.productsGrid) DOM.productsGrid.classList.add("hidden");

    let loadedSuccessfully = false;

    // Intentar sincronización con Google Sheets si está habilitado y la URL no está vacía
    if (APP_CONFIG.enableGoogleSheets && APP_CONFIG.googleSheetCsvUrl && APP_CONFIG.googleSheetCsvUrl.trim() !== "") {
      try {
        console.log("[AgroPasco] Conectando a Google Sheets:", APP_CONFIG.googleSheetCsvUrl);
        const response = await fetch(APP_CONFIG.googleSheetCsvUrl, {
          method: "GET",
          headers: { "Accept": "text/csv, text/plain, */*" }
        });

        if (response.ok) {
          const csvText = await response.text();
          const parsed = parseCSV(csvText);
          if (parsed && parsed.length > 0) {
            AppState.products = parsed;
            AppState.dataSource = "sheets";
            loadedSuccessfully = true;
            console.log(`[AgroPasco] ¡Éxito! ${parsed.length} productos cargados desde Google Sheets.`);
          }
        }
      } catch (err) {
        console.warn("[AgroPasco] Falla en la lectura de Google Sheets, conmutando a catálogo de respaldo:", err);
      }
    }

    // Si falló o no estaba habilitado, cargar el catálogo de respaldo (FALLBACK_PRODUCTS)
    if (!loadedSuccessfully) {
      AppState.products = [...APP_CONFIG.FALLBACK_PRODUCTS];
      AppState.dataSource = "fallback";
      console.log(`[AgroPasco] Catálogo cargado desde respaldo local (${AppState.products.length} productos).`);
    }

    // Cargar e incorporar cosechas registradas por agricultores (Servidor multiusuario centralizado)
    let sharedFarmerList = [];
    const remoteProducts = await apiFetchSharedProducts();

    if (remoteProducts !== null) {
      sharedFarmerList = remoteProducts;
      // Sincronizar en localStorage como caché local
      saveFarmerProductsToStorage(sharedFarmerList);
      console.log(`[AgroPasco] ${sharedFarmerList.length} cosechas compartidas cargadas desde el servidor central multiusuario.`);
    } else {
      // Si no hay conexión al servidor central (ej. modo offline file:///), usar localStorage
      sharedFarmerList = getSavedFarmerProducts();
      console.log(`[AgroPasco] Servidor central no disponible, usando almacenamiento local (${sharedFarmerList.length} cosechas).`);
    }

    if (sharedFarmerList.length > 0) {
      const normalizedFarmerProducts = sharedFarmerList.map((p) => ({
        ...p,
        price: typeof p.price === "number" ? p.price : (parseFloat(p.price) || 0),
        isLocalUpload: true
      }));
      AppState.products = [...normalizedFarmerProducts, ...AppState.products];
    }

    // Inicializar cantidades de tarjeta
    AppState.products.forEach((prod) => {
      if (!AppState.catalogQuantities[prod.id]) {
        AppState.catalogQuantities[prod.id] = 1;
      }
    });

    // Actualizar indicador visual de la fuente de datos
    updateDataSourceIndicator();

    if (DOM.loadingState) DOM.loadingState.classList.add("hidden");
    if (DOM.productsGrid) DOM.productsGrid.classList.remove("hidden");

    // Renderizar categorías y catálogo
    renderCategoryPills();
    renderProductsCatalog();
  }

  function updateDataSourceIndicator() {
    if (!DOM.dataSourceText) return;
    if (AppState.dataSource === "sheets") {
      DOM.dataSourceText.textContent = "Google Sheets en vivo";
      DOM.dataSourceStatus.classList.remove("bg-slate-100", "text-slate-600");
      DOM.dataSourceStatus.classList.add("bg-emerald-50", "text-emerald-700", "border-emerald-200");
    } else {
      DOM.dataSourceText.textContent = "Catálogo verificado Pasco";
      DOM.dataSourceStatus.classList.remove("bg-emerald-50", "text-emerald-700", "border-emerald-200");
      DOM.dataSourceStatus.classList.add("bg-slate-100", "text-slate-600", "border-slate-200");
    }
  }

  /* ============================================================================
     6. RENDERIZADO DEL CATÁLOGO Y FILTROS
     ============================================================================ */
  /**
   * Renderiza las píldoras interactivas de categorías con conteos dinámicos.
   */
  function renderCategoryPills() {
    if (!DOM.categoryPillsContainer) return;
    DOM.categoryPillsContainer.innerHTML = "";

    APP_CONFIG.categories.forEach((cat) => {
      // Contar cuántos productos pertenecen a esta categoría
      let count = 0;
      if (cat.id === "all") {
        count = AppState.products.length;
      } else {
        count = AppState.products.filter((p) => p.category === cat.id).length;
      }

      const isActive = AppState.activeCategory === cat.id;

      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `shrink-0 inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
        isActive
          ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.02]"
          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
      }`;

      pill.innerHTML = `
        <i class="${cat.icon}"></i>
        <span>${cat.name}</span>
        <span class="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md text-[10px] font-black ${
          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }">${count}</span>
      `;

      pill.addEventListener("click", () => {
        AppState.activeCategory = cat.id;
        renderCategoryPills();
        renderProductsCatalog();
        updateResetFiltersButton();
      });

      DOM.categoryPillsContainer.appendChild(pill);
    });
  }

  /**
   * Filtra y renderiza los productos en el grid principal.
   */
  function renderProductsCatalog() {
    if (!DOM.productsGrid) return;

    const filtered = AppState.products.filter((prod) => {
      // Filtro por categoría
      const matchesCategory =
        AppState.activeCategory === "all" || prod.category === AppState.activeCategory;

      // Filtro por texto de búsqueda (nombre, productor, ubicación, descripción)
      const query = AppState.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.producer.toLowerCase().includes(query) ||
        prod.location.toLowerCase().includes(query) ||
        prod.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    // Actualizar badge con el total de productos visibles
    if (DOM.productCountBadge) {
      DOM.productCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`;
    }

    // Manejar estado vacío si no hay resultados
    if (filtered.length === 0) {
      DOM.productsGrid.innerHTML = "";
      DOM.productsGrid.classList.add("hidden");
      if (DOM.emptyState) DOM.emptyState.classList.remove("hidden");
      return;
    }

    if (DOM.emptyState) DOM.emptyState.classList.add("hidden");
    DOM.productsGrid.classList.remove("hidden");
    DOM.productsGrid.innerHTML = "";

    // Renderizar tarjetas de producto
    filtered.forEach((prod) => {
      const card = createProductCardElement(prod);
      DOM.productsGrid.appendChild(card);
    });
  }

  /**
   * Genera el elemento DOM para la tarjeta de un producto.
   * @param {Object} prod Objeto de producto
   * @returns {HTMLElement}
   */
  function createProductCardElement(prod) {
    const card = document.createElement("div");
    card.className =
      "group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col overflow-hidden relative";

    const qty = AppState.catalogQuantities[prod.id] || 1;
    const priceNum = typeof prod.price === "number" ? prod.price : (parseFloat(prod.price) || 0);

    card.innerHTML = `
      <!-- Imagen del Producto con Insignia -->
      <div class="relative w-full h-48 bg-slate-100 overflow-hidden">
        <img
          src="${prod.image}"
          alt="${prod.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'"
        />
        <!-- Badge de Calidad / Cosecha -->
        <div class="absolute top-3 left-3">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-white/95 text-slate-900 shadow-md backdrop-blur-sm">
            <i class="fa-solid fa-certificate text-brand-600 mr-1 text-[10px]"></i>
            ${prod.badge || "Cosecha Directa"}
          </span>
        </div>
        ${prod.isLocalUpload ? `
          <div class="absolute top-3 right-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-md">
              <i class="fa-solid fa-sparkles mr-1 text-[9px]"></i> ¡Tu Cosecha!
            </span>
          </div>
        ` : ""}
        <!-- Categoría -->
        <div class="absolute bottom-3 left-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
            ${getCategoryName(prod.category)}
          </span>
        </div>
      </div>

      <!-- Cuerpo de la Tarjeta -->
      <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <!-- Título y Acción de Borrado si es local -->
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-extrabold text-slate-900 text-base leading-snug group-hover:text-brand-700 transition-colors flex-1">
              ${prod.name}
            </h3>
            ${prod.isLocalUpload ? `
              <button
                type="button"
                class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs transition-colors btn-delete-farmer-card shrink-0"
                data-id="${prod.id}"
                title="Eliminar mi cosecha publicada"
                aria-label="Eliminar mi cosecha"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ""}
          </div>

          <!-- Datos del Productor y Ubicación -->
          <div class="space-y-1 text-xs text-slate-500">
            <p class="flex items-center">
              <i class="fa-solid fa-user-check text-brand-600 mr-1.5 text-xs"></i>
              <strong class="text-slate-700 font-semibold mr-1">Productor:</strong> ${prod.producer}
            </p>
            <p class="flex items-center text-slate-500 truncate" title="${prod.location}">
              <i class="fa-solid fa-location-dot text-amber-500 mr-1.5 text-xs"></i>
              <span>${prod.location}</span>
            </p>
          </div>

          <!-- Descripción -->
          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            ${prod.description}
          </p>
        </div>

        <!-- Precio y Controles de Cantidad -->
        <div class="pt-3 border-t border-slate-100 space-y-3">
          <div class="flex items-baseline justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Precio Justo</span>
              <div class="flex items-baseline space-x-1">
                <span class="text-xs font-bold text-slate-900">${APP_CONFIG.currency}</span>
                <span class="text-2xl font-black text-brand-700">${priceNum.toFixed(2)}</span>
                <span class="text-xs text-slate-500 font-medium">/ ${prod.unit}</span>
              </div>
            </div>
          </div>

          <!-- Selector de Cantidad y Botón Añadir -->
          <div class="flex items-center space-x-2">
            <!-- Selector numérico -->
            <div class="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors shadow-xs btn-card-minus"
                data-id="${prod.id}"
                aria-label="Disminuir cantidad"
              >
                <i class="fa-solid fa-minus text-[10px]"></i>
              </button>
              <span
                class="w-8 text-center text-xs font-black text-slate-900 card-qty-display"
                id="qty-display-${prod.id}"
              >
                ${qty}
              </span>
              <button
                type="button"
                class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors shadow-xs btn-card-plus"
                data-id="${prod.id}"
                aria-label="Aumentar cantidad"
              >
                <i class="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>

            <!-- Botón Añadir a la Canasta -->
            <button
              type="button"
              class="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center space-x-1.5 transition-all active:scale-95 btn-card-add"
              data-id="${prod.id}"
            >
              <i class="fa-solid fa-basket-shopping"></i>
              <span>Añadir</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // Eventos del selector de cantidad en la tarjeta
    const btnMinus = card.querySelector(".btn-card-minus");
    const btnPlus = card.querySelector(".btn-card-plus");
    const qtyDisplay = card.querySelector(".card-qty-display");
    const btnAdd = card.querySelector(".btn-card-add");
    const btnDelete = card.querySelector(".btn-delete-farmer-card");

    if (btnMinus) {
      btnMinus.addEventListener("click", () => {
        let current = AppState.catalogQuantities[prod.id] || 1;
        if (current > 1) {
          current -= 1;
          AppState.catalogQuantities[prod.id] = current;
          if (qtyDisplay) qtyDisplay.textContent = current;
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener("click", () => {
        let current = AppState.catalogQuantities[prod.id] || 1;
        current += 1;
        AppState.catalogQuantities[prod.id] = current;
        if (qtyDisplay) qtyDisplay.textContent = current;
      });
    }

    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        const quantityToAdd = AppState.catalogQuantities[prod.id] || 1;
        addToCart(prod, quantityToAdd);
        // Restablecer el selector de tarjeta a 1
        AppState.catalogQuantities[prod.id] = 1;
        if (qtyDisplay) qtyDisplay.textContent = 1;
      });
    }

    // Evento de eliminación si es cosecha publicada localmente
    if (btnDelete) {
      btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`¿Deseas retirar tu publicación de "${prod.name}" del catálogo?`)) {
          AppState.products = AppState.products.filter((p) => p.id !== prod.id);
          const customList = getSavedFarmerProducts().filter((p) => p.id !== prod.id);
          saveFarmerProductsToStorage(customList);
          delete AppState.catalogQuantities[prod.id];
          renderCategoryPills();
          renderProductsCatalog();
          
          // Eliminar del servidor central para que desaparezca a todos los usuarios
          await apiDeleteFarmerProduct(prod.id);

          showToast("Cosecha retirada", `Se eliminó "${prod.name}" de la página principal.`, "info");
        }
      });
    }

    return card;
  }

  function getCategoryName(categoryId) {
    const found = APP_CONFIG.categories.find((c) => c.id === categoryId);
    return found ? found.name : categoryId;
  }

  /* ============================================================================
     7. LÓGICA REACTIVA DEL CARRITO DE COMPRAS
     ============================================================================ */
  /**
   * Añade un producto al carrito de compras o incrementa su cantidad.
   * @param {Object} product Objeto del producto
   * @param {number} quantity Cantidad a agregar
   */
  function addToCart(product, quantity = 1) {
    const existingIndex = AppState.cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      AppState.cart[existingIndex].quantity += quantity;
    } else {
      AppState.cart.push({
        product: { ...product },
        quantity: quantity
      });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(
      "¡Producto añadido!",
      `Se agregó ${quantity} ${product.unit} de "${product.name}" a tu canasta.`,
      "success"
    );
  }

  /**
   * Modifica la cantidad de un ítem existente en el carrito.
   * @param {string} productId ID del producto
   * @param {number} delta Variación (+1 o -1)
   */
  function updateCartItemQuantity(productId, delta) {
    const itemIndex = AppState.cart.findIndex((item) => item.product.id === productId);
    if (itemIndex === -1) return;

    const newQty = AppState.cart[itemIndex].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      AppState.cart[itemIndex].quantity = newQty;
      saveCartToStorage();
      updateCartUI();
    }
  }

  /**
   * Elimina un producto por completo de la canasta.
   * @param {string} productId ID del producto
   */
  function removeFromCart(productId) {
    const item = AppState.cart.find((i) => i.product.id === productId);
    AppState.cart = AppState.cart.filter((i) => i.product.id !== productId);
    saveCartToStorage();
    updateCartUI();
    if (item) {
      showToast("Producto removido", `"${item.product.name}" fue eliminado de la canasta.`, "info");
    }
  }

  /**
   * Vacía la totalidad del carrito.
   */
  function clearCart() {
    if (AppState.cart.length === 0) return;
    AppState.cart = [];
    saveCartToStorage();
    updateCartUI();
    showToast("Canasta vacía", "Se retiraron todos los productos de tu canasta.", "info");
  }

  /**
   * Calcula subtotales y cantidad total de ítems.
   */
  function getCartTotals() {
    let count = 0;
    let total = 0;

    AppState.cart.forEach((item) => {
      count += item.quantity;
      total += item.quantity * item.product.price;
    });

    return { count, total };
  }

  /**
   * Actualiza todos los elementos visuales vinculados al carrito.
   */
  function updateCartUI() {
    const { count, total } = getCartTotals();

    // Actualizar badges
    if (DOM.cartBadgeCount) DOM.cartBadgeCount.textContent = count;
    if (DOM.floatingCartBadge) DOM.floatingCartBadge.textContent = count;
    if (DOM.cartItemCountText) DOM.cartItemCountText.textContent = count;

    // Totales monetarios
    const formattedTotal = `${APP_CONFIG.currency} ${total.toFixed(2)}`;
    if (DOM.cartSubtotalVal) DOM.cartSubtotalVal.textContent = formattedTotal;
    if (DOM.cartTotalVal) DOM.cartTotalVal.textContent = formattedTotal;
    if (DOM.checkoutSummaryTotal) DOM.checkoutSummaryTotal.textContent = formattedTotal;
    if (DOM.checkoutSummaryItems) DOM.checkoutSummaryItems.textContent = `${count} ${count === 1 ? "ítem" : "ítems"}`;

    // Renderizar lista de ítems en el drawer
    renderCartItemsList();
  }

  /**
   * Renderiza el contenido del Drawer lateral del carrito.
   */
  function renderCartItemsList() {
    if (!DOM.cartItemsContainer) return;

    if (AppState.cart.length === 0) {
      DOM.cartItemsContainer.innerHTML = "";
      if (DOM.cartEmptyMessage) DOM.cartEmptyMessage.classList.remove("hidden");
      if (DOM.cartSummarySection) DOM.cartSummarySection.classList.add("hidden");
      return;
    }

    if (DOM.cartEmptyMessage) DOM.cartEmptyMessage.classList.add("hidden");
    if (DOM.cartSummarySection) DOM.cartSummarySection.classList.remove("hidden");

    DOM.cartItemsContainer.innerHTML = "";

    AppState.cart.forEach((item) => {
      const prod = item.product;
      const subtotal = (prod.price * item.quantity).toFixed(2);

      const itemEl = document.createElement("div");
      itemEl.className =
        "flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl relative group";

      itemEl.innerHTML = `
        <!-- Miniatura -->
        <img
          src="${prod.image}"
          alt="${prod.name}"
          class="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-200 border border-slate-200"
          onerror="this.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'"
        />

        <!-- Información -->
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-slate-900 truncate" title="${prod.name}">
            ${prod.name}
          </h4>
          <p class="text-[11px] text-slate-500 truncate">
            <i class="fa-solid fa-user-check text-brand-600 mr-1"></i>${prod.producer}
          </p>
          <div class="flex items-baseline space-x-2 mt-1">
            <span class="text-xs font-black text-brand-700">${APP_CONFIG.currency} ${subtotal}</span>
            <span class="text-[10px] text-slate-400">(${APP_CONFIG.currency} ${prod.price.toFixed(2)} / ${prod.unit})</span>
          </div>
        </div>

        <!-- Controles de cantidad y eliminar -->
        <div class="flex flex-col items-end justify-between self-stretch">
          <button
            type="button"
            class="text-slate-400 hover:text-rose-600 transition-colors p-1 btn-cart-remove"
            data-id="${prod.id}"
            title="Eliminar de la canasta"
          >
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>

          <div class="inline-flex items-center border border-slate-300 rounded-lg bg-white p-0.5">
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded btn-cart-minus"
              data-id="${prod.id}"
            >
              <i class="fa-solid fa-minus text-[9px]"></i>
            </button>
            <span class="w-6 text-center text-xs font-bold text-slate-900">${item.quantity}</span>
            <button
              type="button"
              class="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded btn-cart-plus"
              data-id="${prod.id}"
            >
              <i class="fa-solid fa-plus text-[9px]"></i>
            </button>
          </div>
        </div>
      `;

      // Eventos de botones
      itemEl.querySelector(".btn-cart-minus").addEventListener("click", () => {
        updateCartItemQuantity(prod.id, -1);
      });
      itemEl.querySelector(".btn-cart-plus").addEventListener("click", () => {
        updateCartItemQuantity(prod.id, 1);
      });
      itemEl.querySelector(".btn-cart-remove").addEventListener("click", () => {
        removeFromCart(prod.id);
      });

      DOM.cartItemsContainer.appendChild(itemEl);
    });
  }

  /* ============================================================================
     8. GESTIÓN DEL DRAWER OFFCANVAS (CARRITO)
     ============================================================================ */
  function openCartDrawer() {
    if (!DOM.cartDrawer || !DOM.cartBackdrop || !DOM.cartPanel) return;
    DOM.cartDrawer.classList.remove("invisible");
    requestAnimationFrame(() => {
      DOM.cartBackdrop.classList.remove("opacity-0");
      DOM.cartBackdrop.classList.add("opacity-100");
      DOM.cartPanel.classList.remove("translate-x-full");
      DOM.cartPanel.classList.add("translate-x-0");
    });
  }

  function closeCartDrawer() {
    if (!DOM.cartDrawer || !DOM.cartBackdrop || !DOM.cartPanel) return;
    DOM.cartBackdrop.classList.remove("opacity-100");
    DOM.cartBackdrop.classList.add("opacity-0");
    DOM.cartPanel.classList.remove("translate-x-0");
    DOM.cartPanel.classList.add("translate-x-full");
    setTimeout(() => {
      DOM.cartDrawer.classList.add("invisible");
    }, 300);
  }

  /* ============================================================================
     9. MODAL DE CHECKOUT Y GENERADOR DETERMINISTA DE WHATSAPP API
     ============================================================================ */
  function openCheckoutModal() {
    if (AppState.cart.length === 0) {
      showToast(
        "Canasta vacía",
        "Por favor agrega al menos un producto a tu canasta antes de hacer un pedido.",
        "warning"
      );
      return;
    }
    closeCartDrawer();
    if (DOM.checkoutModal) {
      DOM.checkoutModal.classList.remove("hidden");
    }
  }

  function closeCheckoutModal() {
    if (DOM.checkoutModal) {
      DOM.checkoutModal.classList.add("hidden");
    }
  }

  /**
   * Ensambla el mensaje determinista formateado para WhatsApp API y redirige al usuario.
   * @param {Event} e Evento de submit del formulario
   */
  function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (AppState.cart.length === 0) {
      showToast("Error", "No tienes productos en tu canasta para procesar el pedido.", "error");
      closeCheckoutModal();
      return;
    }

    // Obtener valores del formulario
    const name = DOM.buyerNameInput.value.trim();
    const phone = DOM.buyerPhoneInput.value.trim();
    const address = DOM.buyerAddressInput.value.trim();
    const reference = DOM.buyerReferenceInput.value.trim();
    const notes = DOM.buyerNotesInput.value.trim() || "Ninguna especificación adicional.";

    const selectedPaymentEl = DOM.checkoutForm.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = selectedPaymentEl ? selectedPaymentEl.value : "Yape / Plin";

    // Validaciones estrictas
    if (!name || name.length < 3) {
      showToast("Campo requerido", "Por favor ingresa tu nombre y apellido completos.", "warning");
      DOM.buyerNameInput.focus();
      return;
    }

    if (!phone || phone.length < 8) {
      showToast("Teléfono inválido", "Ingresa un número telefónico de contacto válido para coordinar la entrega.", "warning");
      DOM.buyerPhoneInput.focus();
      return;
    }

    if (!address || address.length < 5) {
      showToast("Dirección requerida", "Indica la dirección o punto de entrega en Pasco.", "warning");
      DOM.buyerAddressInput.focus();
      return;
    }

    if (!reference || reference.length < 3) {
      showToast("Referencia requerida", "Indica un punto de referencia cercano para facilitar la entrega.", "warning");
      DOM.buyerReferenceInput.focus();
      return;
    }

    // Calcular montos finales
    const { total } = getCartTotals();
    const orderId = "AGRO-" + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Construir desglose de productos
    let itemsText = "";
    AppState.cart.forEach((item, index) => {
      const p = item.product;
      const sub = (p.price * item.quantity).toFixed(2);
      itemsText += `${index + 1}. *${p.name}*\n   • Cantidad: ${item.quantity} ${p.unit}\n   • Precio unitario: ${APP_CONFIG.currency} ${p.price.toFixed(2)}\n   • Subtotal: *${APP_CONFIG.currency} ${sub}*\n   • Productor: ${p.producer} (${p.location})\n\n`;
    });

    // Armado determinista del mensaje de WhatsApp con formato enriquecido
    const message = 
`🌱 *NUEVO PEDIDO: AGROPASCO-CONECTA*
🏆 *Concurso Nacional "Crea y Emprende 2026"*
_Comercio Justo Directo del Campo a tu Mesa_
--------------------------------------------------
📋 *Orden N°:* ${orderId}
📅 *Fecha:* ${orderDate}

👤 *DATOS DEL COMPRADOR:*
• *Nombre:* ${name}
• *Teléfono:* ${phone}
• *Dirección:* ${address}
• *Referencia:* ${reference}
• *Método de Pago:* ${paymentMethod}
• *Notas:* ${notes}

--------------------------------------------------
🧺 *DETALLE DE LA CANASTA:*
${itemsText}--------------------------------------------------
💰 *TOTAL A PAGAR: ${APP_CONFIG.currency} ${total.toFixed(2)}*
🚚 *Entrega local:* A coordinar en la Región Pasco
--------------------------------------------------
📌 *Instrucción para confirmación:*
Por favor, confírmeme la recepción del pedido y facilíteme los datos para el pago vía *${paymentMethod}* y la hora estimada de entrega.

¡Muchas gracias por apoyar a las familias campesinas de Pasco! 🇵🇪`;

    // Ensamblar URL oficial de WhatsApp con codificación determinista
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${APP_CONFIG.centralWhatsAppNumber}?text=${encodedMessage}`;

    // Mostrar feedback positivo y limpiar estado
    showToast(
      "¡Orden lista!",
      "Redirigiendo a WhatsApp para completar el pedido con el productor...",
      "success",
      4000
    );

    // Vaciar carrito y cerrar modales
    clearCart();
    DOM.checkoutForm.reset();
    closeCheckoutModal();

    // Abrir WhatsApp en una nueva pestaña
    window.open(whatsappUrl, "_blank");
  }

  /* ============================================================================
     10. MODAL Y FORMULARIO FUNCIONAL PARA EL AGRICULTOR ("SOY PRODUCTOR")
     ============================================================================ */
  let uploadedFarmerImageDataUrl = "";

  function openProducerModal() {
    if (!DOM.producerModal) return;
    
    // Configurar enlace de soporte escolar desde config.js
    if (DOM.linkSupportWhatsapp) {
      DOM.linkSupportWhatsapp.href = APP_CONFIG.supportWhatsAppUrl;
    }

    // Inicializar previsualización por defecto si no hay una cargada
    if (!uploadedFarmerImageDataUrl && DOM.farmerCategoryProd && DOM.farmerPreviewImg) {
      const cat = DOM.farmerCategoryProd.value || "tuberculos";
      DOM.farmerPreviewImg.src = DEFAULT_CATEGORY_IMAGES[cat] || DEFAULT_CATEGORY_IMAGES.tuberculos;
    }

    DOM.producerModal.classList.remove("hidden");
  }

  function closeProducerModal() {
    if (DOM.producerModal) {
      DOM.producerModal.classList.add("hidden");
    }
  }

  /**
   * Comprime una imagen en el navegador usando un elemento Canvas invisible.
   * Reduce el peso a ~30-60KB para garantizar que quepa en localStorage sin sobrepasar la cuota.
   * @param {File} file Archivo de imagen seleccionado
   * @param {number} maxWidth Ancho máximo permitido
   * @param {number} maxHeight Alto máximo permitido
   * @param {number} quality Calidad de compresión JPEG (0.1 a 1.0)
   * @returns {Promise<string>} Data URL comprimido
   */
  function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.72) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } catch (err) {
            console.warn("[AgroPasco] Error al comprimir en canvas:", err);
            resolve(readerEvent.target.result || "");
          }
        };
        img.onerror = () => {
          resolve(readerEvent.target.result || "");
        };
        img.src = readerEvent.target.result;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  /**
   * Configura los eventos del formulario de publicación de cosechas del agricultor.
   */
  function setupFarmerFormEvents() {
    // 1. Selector de archivo de imagen (carga desde celular o PC con compresión automática)
    if (DOM.farmerImageFile) {
      DOM.farmerImageFile.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (!file.type.startsWith("image/")) {
            showToast("Archivo no válido", "Por favor selecciona un archivo de imagen (JPG, PNG, WebP).", "warning");
            return;
          }
          if (DOM.farmerFileLabel) DOM.farmerFileLabel.textContent = "Optimizando foto...";
          if (DOM.farmerPreviewHint) DOM.farmerPreviewHint.textContent = "Comprimiendo foto para publicación rápida...";

          try {
            const compressedDataUrl = await compressImageFile(file, 800, 800, 0.72);
            uploadedFarmerImageDataUrl = compressedDataUrl;
            if (DOM.farmerPreviewImg) DOM.farmerPreviewImg.src = uploadedFarmerImageDataUrl;
            if (DOM.farmerFileLabel) {
              const displayName = file.name.length > 22 ? file.name.substring(0, 20) + "..." : file.name;
              DOM.farmerFileLabel.textContent = displayName;
            }
            if (DOM.farmerPreviewHint) DOM.farmerPreviewHint.textContent = "Foto optimizada y lista para publicar";
            if (DOM.farmerImageUrl) DOM.farmerImageUrl.value = "";
          } catch (err) {
            console.warn("[AgroPasco] Error al procesar imagen:", err);
            if (DOM.farmerFileLabel) DOM.farmerFileLabel.textContent = "Subir foto desde mi equipo";
          }
        }
      });
    }

    // 2. Input alternativo de URL web para la imagen
    if (DOM.farmerImageUrl) {
      DOM.farmerImageUrl.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (url.startsWith("http://") || url.startsWith("https://")) {
          uploadedFarmerImageDataUrl = "";
          if (DOM.farmerPreviewImg) DOM.farmerPreviewImg.src = url;
          if (DOM.farmerFileLabel) DOM.farmerFileLabel.textContent = "Subir foto desde mi equipo";
          if (DOM.farmerPreviewHint) DOM.farmerPreviewHint.textContent = "Foto desde enlace web";
        }
      });
    }

    // 3. Cambio de categoría (asigna imagen sugerida si no hay una personalizada)
    if (DOM.farmerCategoryProd) {
      DOM.farmerCategoryProd.addEventListener("change", (e) => {
        const cat = e.target.value;
        if (!uploadedFarmerImageDataUrl && (!DOM.farmerImageUrl || !DOM.farmerImageUrl.value.trim())) {
          const defaultImg = DEFAULT_CATEGORY_IMAGES[cat] || DEFAULT_CATEGORY_IMAGES.tuberculos;
          if (DOM.farmerPreviewImg) DOM.farmerPreviewImg.src = defaultImg;
          if (DOM.farmerPreviewHint) DOM.farmerPreviewHint.textContent = "Foto asignada por categoría (puedes cambiarla arriba)";
        }
      });
    }

    // 4. Envío y publicación del producto en la página principal
    if (DOM.farmerProductForm) {
      DOM.farmerProductForm.addEventListener("submit", handleFarmerProductSubmit);
    }
  }

  /**
   * Procesa el formulario del agricultor y publica el producto en el catálogo principal en vivo.
   * @param {Event} e Evento submit
   */
  async function handleFarmerProductSubmit(e) {
    e.preventDefault();

    const name = DOM.farmerNameProd ? DOM.farmerNameProd.value.trim() : "";
    const category = DOM.farmerCategoryProd ? DOM.farmerCategoryProd.value : "tuberculos";
    const producer = DOM.farmerProducerName ? DOM.farmerProducerName.value.trim() : "";
    const location = DOM.farmerLocationProd ? DOM.farmerLocationProd.value.trim() : "";

    // Sanitización robusta del precio (acepta comas, puntos y símbolos como 'S/.')
    const rawPriceStr = DOM.farmerPriceProd ? String(DOM.farmerPriceProd.value).trim() : "";
    const cleanPriceStr = rawPriceStr.replace(/[^0-9.,]/g, "").replace(",", ".");
    const priceVal = parseFloat(cleanPriceStr);

    const unit = DOM.farmerUnitProd ? DOM.farmerUnitProd.value : "kg";
    const badge = DOM.farmerBadgeProd ? DOM.farmerBadgeProd.value : "Cosecha Fresca";
    
    // Teléfono flexible
    const rawPhone = DOM.farmerPhoneProd ? DOM.farmerPhoneProd.value.trim() : "";
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
    const phone = cleanPhone.length >= 7 ? cleanPhone : APP_CONFIG.centralWhatsAppNumber;
    
    const desc = DOM.farmerDescProd ? DOM.farmerDescProd.value.trim() : "";

    // Validaciones claras
    if (!name || name.length < 2) {
      showToast("Nombre requerido", "Ingresa el nombre del producto o cosecha (ej. Papa Huayro Especial).", "warning");
      if (DOM.farmerNameProd) DOM.farmerNameProd.focus();
      return;
    }

    if (!producer || producer.length < 2) {
      showToast("Productor requerido", "Indica el nombre del productor o familia campesina.", "warning");
      if (DOM.farmerProducerName) DOM.farmerProducerName.focus();
      return;
    }

    if (!location || location.length < 2) {
      showToast("Ubicación requerida", "Indica la comunidad o localidad de Pasco de donde proviene la cosecha.", "warning");
      if (DOM.farmerLocationProd) DOM.farmerLocationProd.focus();
      return;
    }

    if (isNaN(priceVal) || priceVal <= 0) {
      showToast("Precio inválido", "El precio por unidad debe ser mayor a 0 Soles (ej. 4.50 o 3.00).", "warning");
      if (DOM.farmerPriceProd) DOM.farmerPriceProd.focus();
      return;
    }

    // Si seleccionó archivo pero la compresión aún no terminó
    if (DOM.farmerImageFile && DOM.farmerImageFile.files && DOM.farmerImageFile.files[0] && !uploadedFarmerImageDataUrl) {
      try {
        uploadedFarmerImageDataUrl = await compressImageFile(DOM.farmerImageFile.files[0], 800, 800, 0.72);
      } catch (err) {
        console.warn("[AgroPasco] Fallback compresión en submit:", err);
      }
    }

    // Determinar la imagen final (archivo subido > URL ingresada > imagen temática por categoría)
    const manualUrl = DOM.farmerImageUrl ? DOM.farmerImageUrl.value.trim() : "";
    const finalImage =
      uploadedFarmerImageDataUrl ||
      manualUrl ||
      DEFAULT_CATEGORY_IMAGES[category] ||
      DEFAULT_CATEGORY_IMAGES.tuberculos;

    // Crear el objeto del nuevo producto con datos estandarizados
    const newProduct = {
      id: "PROD-CAMPESINO-" + Date.now(),
      name: name,
      category: category,
      producer: producer,
      location: location,
      price: Number(priceVal.toFixed(2)),
      unit: unit,
      image: finalImage,
      phone: phone,
      badge: badge,
      description:
        desc ||
        `Cosecha fresca producida en ${location} por ${producer}. Comercializada bajo precio justo y sin intermediación abusiva.`,
      isLocalUpload: true
    };

    // 1. Anteponer al catálogo activo en memoria (aparece de primer lugar)
    AppState.products.unshift(newProduct);

    // 2. Guardar en localStorage para que persista al recargar la página
    const customList = getSavedFarmerProducts().filter((p) => p.id !== newProduct.id);
    customList.unshift(newProduct);
    saveFarmerProductsToStorage(customList);

    // 3. Enviar al servidor central para que se actualice en las pantallas de TODOS los usuarios
    apiSaveFarmerProduct(newProduct).then((ok) => {
      if (ok) {
        console.log(`[AgroPasco] Cosecha '${newProduct.name}' sincronizada con el servidor central para todos los usuarios.`);
      }
    });

    // 4. Inicializar selector de cantidad para la nueva tarjeta
    AppState.catalogQuantities[newProduct.id] = 1;

    // 4. Restablecer categoría a "all" y limpiar buscador para asegurar que la nueva cosecha sea visible de inmediato
    AppState.activeCategory = "all";
    AppState.searchQuery = "";
    if (DOM.searchInputDesktop) DOM.searchInputDesktop.value = "";
    if (DOM.searchInputMobile) DOM.searchInputMobile.value = "";
    if (DOM.btnClearSearchDesktop) DOM.btnClearSearchDesktop.classList.add("hidden");

    // 5. Renderizar catálogo y pastillas de categorías inmediatamente en la página principal
    renderCategoryPills();
    renderProductsCatalog();
    updateResetFiltersButton();

    // 6. Cerrar modal y limpiar formulario
    closeProducerModal();
    DOM.farmerProductForm.reset();
    uploadedFarmerImageDataUrl = "";
    if (DOM.farmerFileLabel) DOM.farmerFileLabel.textContent = "Subir foto desde mi equipo";
    if (DOM.farmerPreviewImg) DOM.farmerPreviewImg.src = DEFAULT_CATEGORY_IMAGES.tuberculos;
    if (DOM.farmerPreviewHint) DOM.farmerPreviewHint.textContent = "Foto asignada por categoría (puedes cambiarla arriba)";

    // 7. Notificación Toast de éxito
    showToast(
      "¡Cosecha Publicada con Éxito!",
      `"${newProduct.name}" de ${newProduct.producer} ya está visible en la página principal.`,
      "success",
      5000
    );

    // 8. Desplazamiento inteligente directo a la nueva tarjeta con efecto visual de resalto
    setTimeout(() => {
      if (DOM.productsGrid && DOM.productsGrid.firstElementChild) {
        const firstCard = DOM.productsGrid.firstElementChild;
        firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
        firstCard.classList.add("ring-4", "ring-emerald-500", "scale-[1.02]", "transition-all", "duration-500");
        setTimeout(() => {
          firstCard.classList.remove("ring-4", "ring-emerald-500", "scale-[1.02]");
        }, 4000);
      }
    }, 150);
  }

  /* ============================================================================
     11. BÚSQUEDA Y FILTROS EN TIEMPO REAL
     ============================================================================ */
  function handleSearchInput(e) {
    const value = e.target.value;
    AppState.searchQuery = value;

    // Sincronizar inputs
    if (e.target === DOM.searchInputDesktop && DOM.searchInputMobile) {
      DOM.searchInputMobile.value = value;
    } else if (e.target === DOM.searchInputMobile && DOM.searchInputDesktop) {
      DOM.searchInputDesktop.value = value;
    }

    // Mostrar/ocultar botón de limpiar búsqueda en desktop
    if (DOM.btnClearSearchDesktop) {
      if (value.trim().length > 0) {
        DOM.btnClearSearchDesktop.classList.remove("hidden");
      } else {
        DOM.btnClearSearchDesktop.classList.add("hidden");
      }
    }

    updateResetFiltersButton();
    renderProductsCatalog();
  }

  function clearSearch() {
    AppState.searchQuery = "";
    if (DOM.searchInputDesktop) DOM.searchInputDesktop.value = "";
    if (DOM.searchInputMobile) DOM.searchInputMobile.value = "";
    if (DOM.btnClearSearchDesktop) DOM.btnClearSearchDesktop.classList.add("hidden");
    updateResetFiltersButton();
    renderProductsCatalog();
  }

  function resetAllFilters() {
    AppState.activeCategory = "all";
    clearSearch();
    renderCategoryPills();
    renderProductsCatalog();
    updateResetFiltersButton();
  }

  function updateResetFiltersButton() {
    if (!DOM.btnResetFilters) return;
    const hasFilter = AppState.activeCategory !== "all" || AppState.searchQuery.trim() !== "";
    if (hasFilter) {
      DOM.btnResetFilters.classList.remove("hidden");
    } else {
      DOM.btnResetFilters.classList.add("hidden");
    }
  }

  /* ============================================================================
     12. INICIALIZACIÓN DE EVENTOS Y ARRANQUE
     ============================================================================ */
  function setupEventListeners() {
    // Eventos de Buscador
    if (DOM.searchInputDesktop) {
      DOM.searchInputDesktop.addEventListener("input", handleSearchInput);
    }
    if (DOM.searchInputMobile) {
      DOM.searchInputMobile.addEventListener("input", handleSearchInput);
    }
    if (DOM.btnClearSearchDesktop) {
      DOM.btnClearSearchDesktop.addEventListener("click", clearSearch);
    }
    if (DOM.btnResetFilters) {
      DOM.btnResetFilters.addEventListener("click", resetAllFilters);
    }
    if (DOM.btnEmptyReset) {
      DOM.btnEmptyReset.addEventListener("click", resetAllFilters);
    }

    // Eventos de Apertura/Cierre del Carrito
    if (DOM.btnOpenCart) {
      DOM.btnOpenCart.addEventListener("click", openCartDrawer);
    }
    if (DOM.btnFloatingCart) {
      DOM.btnFloatingCart.addEventListener("click", openCartDrawer);
    }
    if (DOM.btnCloseCart) {
      DOM.btnCloseCart.addEventListener("click", closeCartDrawer);
    }
    if (DOM.cartBackdrop) {
      DOM.cartBackdrop.addEventListener("click", closeCartDrawer);
    }
    if (DOM.btnCartEmptyShop) {
      DOM.btnCartEmptyShop.addEventListener("click", () => {
        closeCartDrawer();
        const catalogEl = document.getElementById("catalogo");
        if (catalogEl) catalogEl.scrollIntoView({ behavior: "smooth" });
      });
    }
    if (DOM.btnClearCart) {
      DOM.btnClearCart.addEventListener("click", () => {
        if (confirm("¿Estás seguro de que deseas vaciar tu canasta de compras?")) {
          clearCart();
        }
      });
    }

    // Eventos de Checkout
    if (DOM.btnProceedCheckout) {
      DOM.btnProceedCheckout.addEventListener("click", openCheckoutModal);
    }
    if (DOM.btnCloseCheckout) {
      DOM.btnCloseCheckout.addEventListener("click", closeCheckoutModal);
    }
    if (DOM.checkoutBackdrop) {
      DOM.checkoutBackdrop.addEventListener("click", closeCheckoutModal);
    }
    if (DOM.checkoutForm) {
      DOM.checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }

    // Eventos de Modal de Agricultores
    const producerButtons = [
      DOM.btnOpenProducerModal,
      DOM.btnOpenProducerModalTop,
      DOM.btnHeroProducer,
      DOM.btnBannerProducer
    ];
    producerButtons.forEach((btn) => {
      if (btn) btn.addEventListener("click", openProducerModal);
    });

    if (DOM.btnCloseProducerModal) {
      DOM.btnCloseProducerModal.addEventListener("click", closeProducerModal);
    }
    if (DOM.producerBackdrop) {
      DOM.producerBackdrop.addEventListener("click", closeProducerModal);
    }

    // Configurar eventos del formulario interactivo de cosecha campesina
    setupFarmerFormEvents();

    // Tecla ESC para cerrar cualquier modal abierto
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCartDrawer();
        closeCheckoutModal();
        closeProducerModal();
      }
    });
  }

  /* ============================================================================
     13. MOTOR DE SINCRONIZACIÓN EN TIEMPO REAL MULTIUSUARIO (LIVE SYNC)
     ============================================================================ */
  let knownSharedIds = new Set();
  let isSyncing = false;

  /**
   * Consulta periódicamente el servidor central para detectar nuevas cosechas
   * publicadas por otros usuarios o dispositivos en la red.
   */
  async function syncSharedProductsWithServer() {
    if (isSyncing) return;
    isSyncing = true;

    try {
      const remoteProducts = await apiFetchSharedProducts();
      if (!remoteProducts) {
        isSyncing = false;
        return;
      }

      const remoteIds = new Set(remoteProducts.map((p) => String(p.id)));

      // Extraer productos locales actuales
      const currentLocalProducts = AppState.products.filter((p) => p.isLocalUpload);
      const currentLocalIds = new Set(currentLocalProducts.map((p) => String(p.id)));

      // Detectar si hay nuevos productos que no tenemos
      const newItems = remoteProducts.filter((p) => !currentLocalIds.has(String(p.id)));
      // Detectar si algún producto fue eliminado en el servidor
      const deletedCount = currentLocalProducts.filter((p) => !remoteIds.has(String(p.id))).length;

      if (newItems.length > 0 || deletedCount > 0) {
        console.log(`[AgroPasco Live-Sync] Actualización detectada: +${newItems.length} nuevos, -${deletedCount} retirados.`);

        // Sincronizar respaldo local
        saveFarmerProductsToStorage(remoteProducts);

        // Conservar catálogo base
        const baseProducts = AppState.products.filter((p) => !p.isLocalUpload);

        // Normalizar los productos remotos
        const normalizedRemote = remoteProducts.map((p) => ({
          ...p,
          price: typeof p.price === "number" ? p.price : (parseFloat(p.price) || 0),
          isLocalUpload: true
        }));

        // Reconstruir catálogo en memoria (nuevos al inicio)
        AppState.products = [...normalizedRemote, ...baseProducts];

        // Inicializar cantidades de tarjeta
        newItems.forEach((prod) => {
          if (!AppState.catalogQuantities[prod.id]) {
            AppState.catalogQuantities[prod.id] = 1;
          }
        });

        // Si ya habíamos cargado antes y hay una nueva cosecha de otro usuario, mostrar notificación toast
        if (newItems.length > 0 && knownSharedIds.size > 0) {
          const newest = newItems[0];
          showToast(
            "¡Nueva Cosecha en la Región!",
            `"${newest.name}" de ${newest.producer} acaba de ser publicada en vivo.`,
            "info",
            5000
          );
        }

        // Renderizar catálogo actualizado en la página principal para que todos lo vean
        renderCategoryPills();
        renderProductsCatalog();
      }

      knownSharedIds = remoteIds;
    } catch (err) {
      // Ignorar silenciosamente si hay corte momentáneo
    } finally {
      isSyncing = false;
    }
  }

  function startLiveSync() {
    // Sondeo periódico cada 4 segundos para actualización en tiempo real
    setInterval(syncSharedProductsWithServer, 4000);
  }

  // Inicialización de la aplicación al cargar el DOM
  document.addEventListener("DOMContentLoaded", () => {
    console.log(
      `%c ${APP_CONFIG.appName} - ${APP_CONFIG.contestBadge} %c Conectando con los productores de Pasco... `,
      "background: #15803d; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px 0 0 4px;",
      "background: #334155; color: #fff; padding: 4px; border-radius: 0 4px 4px 0;"
    );

    loadCartFromStorage();
    setupEventListeners();
    updateCartUI();
    loadProducts().then(() => {
      // Iniciar sincronización en vivo multiusuario tras la carga inicial
      startLiveSync();
    });
  });

})();
