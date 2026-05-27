// ────────────────────────────────────────────────────────────────────────
//  Catálogo de productos de OXI-GAS
//
//  Para cargar productos:
//  1. Definí las categorías reales en PRODUCT_CATEGORIES (value + label).
//  2. Definí las marcas reales en PRODUCT_BRANDS.
//  3. Cargá los productos en PRODUCTS, usando los `value` de categoría
//     y los strings de PRODUCT_BRANDS.
//
//  Productos con medidas variables llevan `custom_fields`: campos que
//  el cliente debe completar antes de agregar a la cotización.
// ────────────────────────────────────────────────────────────────────────

export type ProductCategory = string;
export type ProductBrand = string;

export type ProductCategoryOption = {
  readonly value: ProductCategory;
  readonly label: string;
};

/** Un campo de entrada que el cliente debe completar para este producto. */
export type CustomField = {
  readonly key: string;           // identificador único dentro del producto
  readonly label: string;         // texto mostrado al usuario
  readonly placeholder?: string;  // texto de ejemplo dentro del input
};

export type Product = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly brand: ProductBrand;
  readonly category: ProductCategory;
  readonly highlight?: string;
  /**
   * Cuando está presente, la tarjeta muestra inputs adicionales para que
   * el cliente complete medidas / especificaciones variables antes de
   * agregar el artículo a la cotización.
   */
  readonly custom_fields?: readonly CustomField[];
};

// ── Categorías ──────────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES: readonly ProductCategoryOption[] = [
  { value: 'gases',          label: 'Gases industriales y envasados' },
  { value: 'discos',         label: 'Discos de corte y desbaste' },
  { value: 'soldadura',      label: 'Soldadura y consumibles' },
  { value: 'abrasivos',      label: 'Abrasivos y lijas' },
  { value: 'fijacion',       label: 'Fijación y anclaje' },
  { value: 'correas',        label: 'Correas y transmisión' },
  { value: 'herramientas',   label: 'Herramientas' },
  { value: 'lubricantes',    label: 'Lubricantes y aerosoles' },
  { value: 'accesorios_mig', label: 'Accesorios MIG / TIG' },
  { value: 'cables_cadenas', label: 'Cables, cadenas y sogas' },
  { value: 'proteccion',     label: 'Protección personal' },
  { value: 'varios',         label: 'Varios' },
];

// ── Marcas ──────────────────────────────────────────────────────────────

export const PRODUCT_BRANDS: readonly ProductBrand[] = [
  'ACINDAR',
  'BOSCH',
  'BREMENN',
  'CONARCO',
  'DEWALT',
  'DOGO',
  'FISCHER',
  'FIXER',
  'LUSQTOFF',
  'NEBRASKA',
  'PERFECT',
  'SILOC',
  'TBI',
  'W80',
  'WD40',
  'SIN MARCA',
];

// ── Productos ───────────────────────────────────────────────────────────

export const PRODUCTS: readonly Product[] = [

  // ── Fijación y anclaje ──────────────────────────────────────────────

  {
    id: 'FIXE140010',
    code: 'FIXE140010',
    name: 'Tornillo Madera FIXER',
    brand: 'FIXER',
    category: 'fijacion',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro',  placeholder: 'Ej: 4 mm' },
      { key: 'largo',    label: 'Largo',     placeholder: 'Ej: 40 mm' },
      { key: 'cantidad', label: 'Cantidad',  placeholder: 'Ej: 100 unidades' },
    ],
  },
  {
    id: 'UNITRIPLAS',
    code: 'UNITRIPLAS',
    name: 'Unión Triple Plástica',
    brand: 'SIN MARCA',
    category: 'fijacion',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro (mm)', placeholder: 'Ej: 20 mm' },
    ],
  },
  {
    id: 'PE00',
    code: 'PE00',
    name: 'Abrazadera A. Inox PERFECT',
    brand: 'PERFECT',
    category: 'fijacion',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro nominal (mm)', placeholder: 'Ej: 25 mm' },
      { key: 'rango',    label: 'Rango (mm)',            placeholder: 'Ej: 20-32 mm' },
    ],
  },
  {
    id: '60890',
    code: '60890',
    name: 'Tarugo L/Hueco Fischer SX',
    brand: 'FISCHER',
    category: 'fijacion',
    custom_fields: [
      { key: 'medida', label: 'Medida', placeholder: 'Ej: 10 x 50 mm' },
    ],
  },
  {
    id: '60800',
    code: '60800',
    name: 'Tarugo Nylon S FISCHER',
    brand: 'FISCHER',
    category: 'fijacion',
    custom_fields: [
      { key: 'medida', label: 'Medida', placeholder: 'Ej: 8 x 40 mm' },
    ],
  },
  {
    id: 'FIMOSTP10',
    code: 'FIMOSTP10',
    name: 'Mosquetón Pera',
    brand: 'SIN MARCA',
    category: 'fijacion',
    custom_fields: [
      { key: 'medida', label: 'Medida (mm)', placeholder: 'Ej: 10 x 60 mm' },
    ],
  },
  {
    id: 'BULONES',
    code: 'BULONES',
    name: 'Bulones – consultar medidas',
    brand: 'SIN MARCA',
    category: 'fijacion',
    custom_fields: [
      { key: 'medida', label: 'Medida / especificación', placeholder: 'Ej: M10×50 mm, grado 8.8' },
    ],
  },

  // ── Aceros y alambres ───────────────────────────────────────────────

  {
    id: 'ACER02000',
    code: 'ACER02000',
    name: 'Acero Plata x KG',
    brand: 'SIN MARCA',
    category: 'varios',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro (mm)', placeholder: 'Ej: 6 mm' },
    ],
  },
  {
    id: 'ACINDAR0001',
    code: 'ACINDAR0001',
    name: 'Alambre Acindar 0.9 mm × KG Rollo',
    brand: 'ACINDAR',
    category: 'soldadura',
  },
  {
    id: 'B4409H',
    code: 'B4409H',
    name: 'Alambre Conarco 0.9 mm × KG Rollo × 18 KG',
    brand: 'CONARCO',
    category: 'soldadura',
  },

  // ── Protección personal ─────────────────────────────────────────────

  {
    id: '2958',
    code: '2958',
    name: 'Máscara Fotosensible Policarbonato Exterior',
    brand: 'SIN MARCA',
    category: 'proteccion',
    highlight: 'Fotosensible',
  },

  // ── Discos de corte / desbaste ──────────────────────────────────────

  {
    id: 'BREM0000016',
    code: 'BREM0000016',
    name: 'Disco C/ Dep. BREMENN O.A. 115×4.8×22',
    brand: 'BREMENN',
    category: 'discos',
  },
  {
    id: 'DCL18016',
    code: 'DCL18016',
    name: 'Disco C. Plano LUSQTOFF O.A. 180×1.6',
    brand: 'LUSQTOFF',
    category: 'discos',
  },
  {
    id: '2608600545',
    code: '2608600545',
    name: 'Disco C. Plano BOSCH O.A. 115×1.0×22',
    brand: 'BOSCH',
    category: 'discos',
  },
  {
    id: '2608600215-115',
    code: '2608600215',
    name: 'Disco C. Plano BOSCH O.A. 115×1.6×22',
    brand: 'BOSCH',
    category: 'discos',
  },
  {
    id: '2608600215-180',
    code: '2608600215-180',
    name: 'Disco C. Plano BOSCH O.A. 180×1.6×22',
    brand: 'BOSCH',
    category: 'discos',
  },
  {
    id: 'DW84402',
    code: 'DW84402',
    name: 'Disco C. Plano DEWALT O.A. 115×1.6×22',
    brand: 'DEWALT',
    category: 'discos',
  },
  {
    id: 'DOG04685',
    code: 'DOG04685',
    name: 'Disco C. Plano DOGO OA 180×1.6×22.2',
    brand: 'DOGO',
    category: 'discos',
  },
  {
    id: 'DOG04650',
    code: 'DOG04650',
    name: 'Disco C. Plano DOGO OA 115×0.8×22',
    brand: 'DOGO',
    category: 'discos',
  },
  {
    id: 'DOG04690',
    code: 'DOG04690',
    name: 'Disco C/ Deprimido P/ Metal NEBRASKA 115×5.0×22.2',
    brand: 'NEBRASKA',
    category: 'discos',
  },
  {
    id: 'DDL11560',
    code: 'DDL11560',
    name: 'Disco C/ Deprimido Desbaste LUSQTOFF 115×6.0×22',
    brand: 'LUSQTOFF',
    category: 'discos',
  },
  {
    id: 'DOG04687',
    code: 'DOG04687',
    name: 'Disco Corte Sensitiva DOGO 355×3.2×25.4 – Caja × 25 un.',
    brand: 'DOGO',
    category: 'discos',
  },
  {
    id: 'DUM11580',
    code: 'DUM11580',
    name: 'Disco Carboflap Zirconio 115 GR80 R/Plástico Plano',
    brand: 'SIN MARCA',
    category: 'discos',
  },
  {
    id: 'DOG04628',
    code: 'DOG04628',
    name: 'Disco Flap Óxido de Zirconio DOGO 115 GR40 R/Plástico',
    brand: 'DOGO',
    category: 'discos',
  },
  {
    id: 'DOG04630',
    code: 'DOG04630',
    name: 'Disco Flap Óxido de Zirconio DOGO 115 GR60 R/Plástico',
    brand: 'DOGO',
    category: 'discos',
  },
  {
    id: 'DOG04632',
    code: 'DOG04632',
    name: 'Disco Flap Óxido de Zirconio DOGO 115 GR80 R/Plástico',
    brand: 'DOGO',
    category: 'discos',
  },

  // ── Correas ─────────────────────────────────────────────────────────

  {
    id: 'CORREA-A',
    code: 'CORREA-A',
    name: 'Correa Tipo A',
    brand: 'SIN MARCA',
    category: 'correas',
    custom_fields: [
      { key: 'numero', label: 'Número de correa', placeholder: 'Ej: A40, A55…' },
    ],
  },
  {
    id: 'CORREA-B',
    code: 'CORREA-B',
    name: 'Correa Tipo B',
    brand: 'SIN MARCA',
    category: 'correas',
    custom_fields: [
      { key: 'numero', label: 'Número de correa', placeholder: 'Ej: B48, B60…' },
    ],
  },
  {
    id: 'CORREA-C',
    code: 'CORREA-C',
    name: 'Correa Tipo C',
    brand: 'SIN MARCA',
    category: 'correas',
    custom_fields: [
      { key: 'numero', label: 'Número de correa', placeholder: 'Ej: C51, C75…' },
    ],
  },
  {
    id: 'CORREA-Z',
    code: 'CORREA-Z',
    name: 'Correa Tipo Z',
    brand: 'SIN MARCA',
    category: 'correas',
    custom_fields: [
      { key: 'numero', label: 'Número de correa', placeholder: 'Ej: Z32, Z45…' },
    ],
  },

  // ── Herramientas ────────────────────────────────────────────────────

  {
    id: 'DESTOR-PHILLIPS',
    code: 'DESTOR-PHILLIPS',
    name: 'Destornillador Phillips',
    brand: 'SIN MARCA',
    category: 'herramientas',
    custom_fields: [
      { key: 'punta', label: 'Tamaño de punta', placeholder: 'Ej: PH1, PH2' },
      { key: 'largo', label: 'Largo (mm)',       placeholder: 'Ej: 150 mm' },
    ],
  },
  {
    id: 'DESTOR-PLANO',
    code: 'DESTOR-PLANO',
    name: 'Destornillador Plano',
    brand: 'SIN MARCA',
    category: 'herramientas',
    custom_fields: [
      { key: 'ancho', label: 'Ancho de hoja (mm)', placeholder: 'Ej: 6 mm' },
      { key: 'largo', label: 'Largo (mm)',          placeholder: 'Ej: 150 mm' },
    ],
  },
  {
    id: 'LBL320-8',
    code: 'LBL320-8',
    name: 'Lijadora Orbital LUSQTOFF 320 W',
    brand: 'LUSQTOFF',
    category: 'herramientas',
  },

  // ── Soldadura y electrodos ──────────────────────────────────────────

  {
    id: 'B0625',
    code: 'B0625',
    name: 'Electrodo CONARCO × KG',
    brand: 'CONARCO',
    category: 'soldadura',
    custom_fields: [
      { key: 'tipo',     label: 'Tipo de electrodo', placeholder: 'Ej: 6013, 7018' },
      { key: 'diametro', label: 'Diámetro (mm)',     placeholder: 'Ej: 3.25 mm' },
    ],
  },
  {
    id: 'DOG25212',
    code: 'DOG25212',
    name: 'Electrodo Tungsteno DOGO Punta Roja',
    brand: 'DOGO',
    category: 'soldadura',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro (mm)', placeholder: 'Ej: 2.4 mm' },
      { key: 'largo',    label: 'Largo (mm)',    placeholder: 'Ej: 175 mm' },
    ],
  },

  // ── Abrasivos y lijas ───────────────────────────────────────────────

  {
    id: 'DAA02180',
    code: 'DAA02180',
    name: 'Lija al Agua',
    brand: 'SIN MARCA',
    category: 'abrasivos',
    custom_fields: [
      { key: 'grano', label: 'Grano', placeholder: 'Ej: 180, 320, 400, 600' },
    ],
  },

  // ── Gases industriales ──────────────────────────────────────────────

  {
    id: 'GAS0100017',
    code: 'GAS0100017',
    name: 'Mix 20 – Gas de mezcla',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 10 m³' },
    ],
  },
  {
    id: 'GAS0100016',
    code: 'GAS0100016',
    name: 'Gas Carbónico (CO₂)',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'kg', label: 'Kilogramos', placeholder: 'Ej: 25 KG' },
    ],
  },
  {
    id: 'GAS0100013',
    code: 'GAS0100013',
    name: 'Oxígeno en Metros Cúbicos',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 5 m³' },
    ],
  },
  {
    id: 'GAS0100015',
    code: 'GAS0100015',
    name: 'Nitrógeno en Metros Cúbicos',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 5 m³' },
    ],
  },
  {
    id: 'GAS0100014',
    code: 'GAS0100014',
    name: 'Acetileno × KG',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'kg', label: 'Kilogramos', placeholder: 'Ej: 7 KG' },
    ],
  },
  {
    id: 'GAS0100020',
    code: 'GAS0100020',
    name: 'Mix 310 – Gas de mezcla',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 10 m³' },
    ],
  },
  {
    id: 'GAS0100018',
    code: 'GAS0100018',
    name: 'Argón × Metros Cúbicos',
    brand: 'SIN MARCA',
    category: 'gases',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 10 m³' },
    ],
  },
  {
    id: 'ARGON-5.0',
    code: 'ARGON-5.0',
    name: 'Argón 5.0 (alta pureza)',
    brand: 'SIN MARCA',
    category: 'gases',
    highlight: 'Alta pureza',
    custom_fields: [
      { key: 'metros3', label: 'Metros cúbicos', placeholder: 'Ej: 5 m³' },
    ],
  },
  {
    id: 'GAS0100012',
    code: 'GAS0100012',
    name: 'Gas Butano 10 KG – TOTAL',
    brand: 'SIN MARCA',
    category: 'gases',
  },
  {
    id: 'GAS0100008',
    code: 'GAS0100008',
    name: 'Gas Butano 10 KG – YPF',
    brand: 'SIN MARCA',
    category: 'gases',
  },
  {
    id: 'GAS01000011',
    code: 'GAS01000011',
    name: 'Gas Butano × 15 KG',
    brand: 'SIN MARCA',
    category: 'gases',
  },
  {
    id: 'GAS010002',
    code: 'GAS010002',
    name: 'Gas Propano 15 Clark Domiciliario – TOTAL',
    brand: 'SIN MARCA',
    category: 'gases',
  },
  {
    id: 'GAS0100003',
    code: 'GAS0100003',
    name: 'Gas Propano 15 Clark Domiciliario – YPF',
    brand: 'SIN MARCA',
    category: 'gases',
  },
  {
    id: 'GAS0100005',
    code: 'GAS0100005',
    name: 'Gas Propano 45 KG – YPF',
    brand: 'SIN MARCA',
    category: 'gases',
  },

  // ── Accesorios MIG / TIG (TBI) ──────────────────────────────────────

  {
    id: 'DOG49001',
    code: 'DOG49001',
    name: 'TBI 150 – Tubo Contacto 0.8 mm BW15AK M6×25',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49003',
    code: 'DOG49003',
    name: 'TBI 150 – Tubo Contacto 0.9 mm BW15AK M6×25',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49006',
    code: 'DOG49006',
    name: 'TBI 150 – Tobera Cónica 12 mm BW15AK',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49017',
    code: 'DOG49017',
    name: 'TBI 250 – Tobera Cónica 15 mm',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49021',
    code: 'DOG49021',
    name: 'TBI 250 – Tubo Contacto 0.8 mm',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49020',
    code: 'DOG49020',
    name: 'TBI 250 – Tubo Contacto 0.9 mm',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },
  {
    id: 'DOG49023',
    code: 'DOG49023',
    name: 'TBI 250 – Tubo Contacto 1.2 mm',
    brand: 'DOGO',
    category: 'accesorios_mig',
  },

  // ── Cables, cadenas y sogas ─────────────────────────────────────────

  {
    id: 'DOG23370',
    code: 'DOG23370',
    name: 'Cadena Galvanizada N°',
    brand: 'DOGO',
    category: 'cables_cadenas',
    custom_fields: [
      { key: 'numero', label: 'Número de cadena', placeholder: 'Ej: 3, 4, 5, 6' },
    ],
  },
  {
    id: 'SOLY0200052',
    code: 'SOLY0200052',
    name: 'Caño Solyon A. Rojo 300 L × MTS',
    brand: 'SIN MARCA',
    category: 'cables_cadenas',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro (mm)', placeholder: 'Ej: 6 mm' },
    ],
  },
  {
    id: '714',
    code: '714',
    name: 'Soga Polipropileno 14 mm Blanca/Azul × MT',
    brand: 'SIN MARCA',
    category: 'cables_cadenas',
  },
  {
    id: 'CABLE-ACERO',
    code: 'CABLE-ACERO',
    name: 'Cable de Acero – consultar',
    brand: 'SIN MARCA',
    category: 'cables_cadenas',
    custom_fields: [
      { key: 'diametro', label: 'Diámetro (mm)', placeholder: 'Ej: 6 mm, 8 mm' },
      { key: 'longitud', label: 'Longitud (m)',  placeholder: 'Ej: 10 m' },
    ],
  },

  // ── Lubricantes y aerosoles ─────────────────────────────────────────

  {
    id: 'WD400200002',
    code: 'WD400200002',
    name: 'WD40 Lubricante Aerosol 311 GR',
    brand: 'WD40',
    category: 'lubricantes',
  },
  {
    id: 'W500050',
    code: 'W500050',
    name: 'W80 Lubric. Multiuso ×288 GR / 426 ML SILOC',
    brand: 'W80',
    category: 'lubricantes',
  },
  {
    id: 'W500020',
    code: 'W500020',
    name: 'W80 Lubricante P/Cadena 170 G',
    brand: 'W80',
    category: 'lubricantes',
  },
  {
    id: 'W500021',
    code: 'W500021',
    name: 'W80 Lubricante Silicona 240 ML',
    brand: 'W80',
    category: 'lubricantes',
  },
];
