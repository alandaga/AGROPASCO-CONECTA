/**
 * ==============================================================================
 * AGROPASCO-CONECTA - COMERCIO JUSTO LOCAL
 * Proyecto Oficial - Concurso Escolar Nacional "Crea y Emprende 2026"
 * Área Curricular: Educación para el Trabajo (EPT) - Computación e Informática
 * ==============================================================================
 * Archivo: config.js
 * Propósito: Configuración global de la aplicación, endpoints para Google Sheets,
 *            teléfonos de contacto, instructivo de publicación y catálogo de respaldo.
 * ==============================================================================
 */

const APP_CONFIG = {
  // Información Institucional del Proyecto EPT
  appName: "AgroPasco-Conecta",
  tagline: "Comercio Justo del Campo Pasqueño a tu Mesa",
  contestBadge: "Crea y Emprende 2026",
  region: "Región Pasco, Perú",
  currency: "S/.",
  
  // Número oficial de WhatsApp de la cooperativa / central escolar para recepción de pedidos
  // Formato internacional sin signos: 51 + número de 9 dígitos (ej. 51963123456)
  centralWhatsAppNumber: "51963123456",

  // Datos para transferencia móvil (Yape / Plin)
  paymentInfo: {
    yapeNumber: "963 123 456",
    yapeTitular: "Cooperativa Escolar AgroPasco-Conecta / Juan Pérez (EPT)",
    plinNumber: "963 123 456",
    allowCashOnDelivery: true
  },

  // Enlace a Google Forms para que nuevos agricultores registren sus cosechas
  googleFormsRegisterUrl: "https://docs.google.com/forms/d/e/1FAIpQLScAgroPascoRegistroCosechas2026/viewform",

  // Enlace a WhatsApp de soporte técnico escolar (estudiantes de EPT)
  supportWhatsAppUrl: "https://wa.me/51963123456?text=Hola%2C%20soy%20agricultor%20y%20deseo%20ayuda%20para%20publicar%20mis%20productos%20en%20AgroPasco-Conecta",

  /**
   * ============================================================================
   * INTEGRACIÓN CON GOOGLE SHEETS EN VIVO
   * ============================================================================
   * Si deseas vincular una hoja de cálculo en vivo:
   * 1. Crea una hoja en Google Sheets con las siguientes columnas en la Fila 1:
   *    id, name, category, producer, location, price, unit, image, phone, badge, description
   * 2. Ve a: Archivo > Compartir > Publicar en la web.
   * 3. Selecciona: "Página principal" y formato "Valores separados por comas (.csv)".
   * 4. Haz clic en "Publicar" y pega el enlace generado en `googleSheetCsvUrl` abajo.
   * 5. Cambia `enableGoogleSheets` a true.
   * 
   * NOTA DE RESILIENCIA:
   * Si la URL está vacía, no hay conexión a internet o la hoja falla por CORS,
   * el sistema conmuta de forma automática e inmediata al catálogo de respaldo (FALLBACK_PRODUCTS),
   * garantizando que la aplicación NUNCA se quede en blanco o sin productos.
   */
  enableGoogleSheets: false,
  googleSheetCsvUrl: "", // Pega aquí tu URL pública de Google Sheets en formato .csv

  // Categorías admitidas en la plataforma
  categories: [
    { id: "all", name: "Todos los Productos", icon: "fa-solid fa-basket-shopping" },
    { id: "tuberculos", name: "Tubérculos y Raíces", icon: "fa-solid fa-seedling" },
    { id: "lacteos", name: "Lácteos Artesanales", icon: "fa-solid fa-cheese" },
    { id: "acuicultura", name: "Acuicultura y Pesca", icon: "fa-solid fa-fish" },
    { id: "otros", name: "Derivados y Superalimentos", icon: "fa-solid fa-jar" }
  ],

  /**
   * ============================================================================
   * CATÁLOGO DE RESPALDO (FALLBACK DATA)
   * ============================================================================
   * 8 productos agropecuarios auténticos de las provincias de Pasco, Daniel Alcides Carrión
   * y Oxapampa. Fotografías libres de derechos optimizadas de Unsplash.
   */
  FALLBACK_PRODUCTS: [
    {
      id: "PROD-001",
      name: "Papa Huayro Pasqueña",
      category: "tuberculos",
      producer: "Don Victoriano Quispe",
      location: "Paucartambo - Pasco (3,200 msnm)",
      price: 3.50,
      unit: "kg",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
      phone: "51963456789",
      badge: "Cosecha del Día",
      description: "Cultivada con aguas de deshielo andino. Textura arenosa exquisita, perfecta para sancochados, papa rellena y guisos tradicionales."
    },
    {
      id: "PROD-002",
      name: "Papa Amarilla Tumbay",
      category: "tuberculos",
      producer: "Familia Alania Cóndor",
      location: "Chaupimarca - Pasco",
      price: 4.20,
      unit: "kg",
      image: "https://images.unsplash.com/photo-1590165482129-1b8b27698980?auto=format&fit=crop&w=800&q=80",
      phone: "51963789012",
      badge: "100% Ecológica",
      description: "Papa nativa de pulpa dorada y cremosa consistencia. Libre de pesticidas químicos, cosechada con abono orgánico tradicional."
    },
    {
      id: "PROD-003",
      name: "Queso Andino Tipo Paria Artesanal",
      category: "lacteos",
      producer: "Asoc. Ganaderos San Pedro",
      location: "Ninacaca - Pasco (4,140 msnm)",
      price: 22.00,
      unit: "molde (aprox. 900g)",
      image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80",
      phone: "51963345671",
      badge: "Maduración Natural",
      description: "Elaborado con leche fresca de vacas criollas alimentadas con pastos naturales de la puna pasqueña. Sal moderada y textura compacta."
    },
    {
      id: "PROD-004",
      name: "Miel de Abeja de Floración Silvestre",
      category: "otros",
      producer: "Apícola Bio-Oxapampa",
      location: "Oxapampa - Selva Pasqueña",
      price: 26.00,
      unit: "frasco (500g)",
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
      phone: "51963889900",
      badge: "Reserva de Biósfera",
      description: "Miel 100% pura y cruda recolectada en los bosques de niebla de Oxapampa. Rica en antioxidantes naturales y propiedades antibacterianas."
    },
    {
      id: "PROD-005",
      name: "Trucha Arcoíris Fresca Eviscerada",
      category: "acuicultura",
      producer: "Comunidad Campesina Punrun",
      location: "Laguna Punrun - Pasco (4,200 msnm)",
      price: 16.50,
      unit: "kg (3 a 4 piezas)",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
      phone: "51963223344",
      badge: "Pesca de Altura",
      description: "Criada en aguas cristalinas y oxigenadas de laguna glaciar. Carne rosada firme, rica en ácidos grasos Omega 3 de altísimo valor nutritivo."
    },
    {
      id: "PROD-006",
      name: "Harina de Maca Negra Andina",
      category: "otros",
      producer: "Cooperativa Agroecológica Bombón",
      location: "Meseta de Bombón - Pasco (4,100 msnm)",
      price: 18.00,
      unit: "empaque ziploc (250g)",
      image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
      phone: "51963556677",
      badge: "Superalimento Ancestral",
      description: "Maca gelatinizada de secado solar natural. Potente energizante físico y mental, regulador hormonal y fuente rica en minerales bioasimilables."
    },
    {
      id: "PROD-007",
      name: "Café Especial Gourmet Villa Rica",
      category: "otros",
      producer: "Finca Ecológica Santa Rosa",
      location: "Villa Rica - Oxapampa, Pasco",
      price: 24.00,
      unit: "bolsa con válvula (250g)",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      phone: "51963667788",
      badge: "Denominación de Origen",
      description: "Café arábica de estricta altura (tueste medio artesanal). Notas aromáticas a chocolate bitter, miel de caña y frutos secos pasqueños."
    },
    {
      id: "PROD-008",
      name: "Mantequilla Pura de Campo Andino",
      category: "lacteos",
      producer: "Derivados Lácteos El Paucartambino",
      location: "Paucartambo - Pasco",
      price: 12.00,
      unit: "bloque artesanal (250g)",
      image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80",
      phone: "51963778899",
      badge: "Sin Conservantes",
      description: "Elaborada por batido artesanal de crema de leche fresca sin blanqueadores ni aditivos químicos. Con un toque suave de sal marina."
    }
  ]
};

// Congelamos el objeto de configuración básica para prevenir mutaciones no intencionadas
Object.freeze(APP_CONFIG.categories);
