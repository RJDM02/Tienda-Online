import { apiFetch as fetch } from '../auth/session';
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType, Link } from 'react-router-dom';
import { useSessionSnapshot } from '../auth/useSessionSnapshot';
import { Filter } from 'lucide-react';
import Dashbar from '../components/Dashbar';
import CardItem from '../components/CardItem';
import SiteFooter from '../components/SiteFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import { jwtDecode } from 'jwt-decode';
import '../styles/vjh-theme.css';
import './ShopPage.css';

import { API_URL } from '../config/apiConfig';

// Keep a bounded history in this tab; a new catalog visit still fetches fresh data.
const catalogHistory = new Map();

function readFilters(search) {
  const params = new URLSearchParams(search);
  const list = name => params.get(name)?.split(',').filter(Boolean) || [];
  const price = (name, fallback) => {
    const value = params.get(name);
    return value !== null && value !== '' && Number.isFinite(Number(value))
      ? Number(value) : fallback;
  };
  return {
    searchTerm: params.get('search') || '',
    categories: list('categories'),
    subcategories: list('subcategories'),
    conditions: list('conditions'),
    priceRange: [price('min', 0), price('max', 9999)]
  };
}

const ShopPage = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const sessionSnapshot = useSessionSnapshot();
  const userData = useMemo(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      return sessionSnapshot ? JSON.parse(sessionSnapshot) : jwtDecode(token);
    } catch {
      return null;
    }
  }, [sessionSnapshot]);
  const catalogScope = JSON.stringify([
    userData?.user_id, userData?.rol,
    userData?.punto_venta_id, userData?.auth_session
  ]);
  const historyKey = JSON.stringify([location.key, location.search, catalogScope]);

  return <ShopCatalog key={catalogScope} historyKey={historyKey}
    restore={navigationType === 'POP'} userData={userData} />;
};

const ShopCatalog = ({ historyKey, restore, userData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const saved = useMemo(() => restore ? catalogHistory.get(historyKey) : null, [historyKey, restore]);
  const [allProducts, setAllProducts] = useState(saved?.products || []);
  const [loading, setLoading] = useState(!saved);
  const [initialLoadComplete, setInitialLoadComplete] = useState(!!saved);
  const [nextPageUrl, setNextPageUrl] = useState(saved?.nextPageUrl || null);
  const [hasMore, setHasMore] = useState(saved ? saved.hasMore : true);
  const [categoriesData, setCategoriesData] = useState(saved?.categories || []);
  const [categoriesLoaded, setCategoriesLoaded] = useState(!!saved);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filters = useRef(readFilters(location.search));
  const isLoadingMore = useRef(false);
  const productRequest = useRef(null);
  const mounted = useRef(true);
  const requests = useRef(new Set());
  const restoring = useRef(true);
  const snapshot = useRef({ historyKey, scrollY: saved?.scrollY || 0 });

  useLayoutEffect(() => {
    if (snapshot.current.historyKey !== historyKey) return;
    snapshot.current = {
      ...snapshot.current, products: allProducts, nextPageUrl, hasMore,
      categories: categoriesData, complete: initialLoadComplete
    };
  }, [allProducts, nextPageUrl, hasMore, categoriesData, initialLoadComplete, historyKey]);

  useLayoutEffect(() => {
    productRequest.current?.abort();
    productRequest.current = null;
    isLoadingMore.current = false;
    const changingFilters = snapshot.current.historyKey !== historyKey;
    const top = saved?.scrollY ?? (changingFilters ? window.scrollY : 0);
    filters.current = readFilters(location.search);
    setAllProducts(saved?.products || []);
    setNextPageUrl(saved?.nextPageUrl || null);
    setHasMore(saved ? saved.hasMore : true);
    setInitialLoadComplete(!!saved);
    setLoading(!saved);
    snapshot.current = { historyKey, scrollY: top, complete: !!saved,
      products: saved?.products || [], nextPageUrl: saved?.nextPageUrl || null,
      hasMore: saved ? saved.hasMore : true, categories: snapshot.current.categories || [] };
    restoring.current = true;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const restoreScroll = () => window.scrollTo({ top, left: 0, behavior: 'instant' });
    const trackScroll = () => {
      if (!restoring.current) snapshot.current.scrollY = window.scrollY;
    };
    restoreScroll();
    let settledFrame;
    const frame = requestAnimationFrame(() => {
      restoreScroll();
      settledFrame = requestAnimationFrame(() => { restoring.current = false; });
    });
    window.addEventListener('scroll', trackScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settledFrame);
      window.removeEventListener('scroll', trackScroll);
      window.history.scrollRestoration = previousRestoration;
      if (snapshot.current.complete) {
        catalogHistory.delete(historyKey);
        catalogHistory.set(historyKey, snapshot.current);
        if (catalogHistory.size > 6) catalogHistory.delete(catalogHistory.keys().next().value);
      }
    };
  }, [historyKey, saved, location.search]);

  useEffect(() => {
    mounted.current = true;
    const pendingRequests = requests.current;
    return () => {
      mounted.current = false;
      pendingRequests.forEach(controller => controller.abort());
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      const response = await fetch(`${API_URL}/listar_categoria/`, { signal: controller.signal });
      if (!response.ok) throw new Error('Error fetching categories');
      const data = await response.json();
      if (mounted.current && !controller.signal.aborted) setCategoriesData(data);
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Error fetching categories:', error);
    } finally {
      requests.current.delete(controller);
      if (mounted.current && !controller.signal.aborted) setCategoriesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!categoriesLoaded) fetchCategories();
  }, [fetchCategories, categoriesLoaded]);

  const buildApiUrl = useCallback((baseUrl = `${API_URL}/listar_item_activo/`) => {
    const params = new URLSearchParams();

    if (filters.current.searchTerm) {
      params.append('nombre', filters.current.searchTerm);
    }

    params.append('min', filters.current.priceRange[0]);
    params.append('max', filters.current.priceRange[1]);

    if (filters.current.categories.length > 0) {
      const categoryNames = filters.current.categories.map(id => {
        const category = categoriesData.find(cat => String(cat.id) === id);
        return category ? category.nombre : '';
      }).filter(name => name !== '');

      if (categoryNames.length > 0) {
        params.append('categoria', categoryNames.join(','));
      }
    }

    if (filters.current.subcategories.length > 0) {
      params.append('sub_categoria', filters.current.subcategories.join(','));
    }

    if (filters.current.conditions.length > 0) {
      params.append('condicion', filters.current.conditions.join(','));
    }

    // Un Encargado de Punto de Venta ve su catalogo y tambien la Sede Principal.
    if (userData?.rol === 'Encargado de Punto de Venta' && userData?.punto_venta_id) {
      params.append('punto_venta_or_sede', userData.punto_venta_id);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [categoriesData, userData]);

  const fetchProducts = useCallback(async (url) => {
    if (isLoadingMore.current) return;
    const controller = new AbortController();
    productRequest.current = controller;
    requests.current.add(controller);
    try {
      setLoading(true);
      isLoadingMore.current = true;

      const apiUrl = url || buildApiUrl();
      const response = await fetch(apiUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Error fetching products');
      const data = await response.json();
      if (!mounted.current || controller.signal.aborted) return;

      const formattedProducts = data.results.map(item => ({
        ...item,
        precio: parseFloat(item.precio).toFixed(2),
        precio_post_descuento: parseFloat(item.precio_post_descuento).toFixed(2),
        imagenes: item.imagenes || [],
        subcategorias_detalle: item.subcategorias_detalle || [],
        condicion: String(item.condicion_detalle?.id) || ''
      }));

      if (url) {
        setAllProducts(prev => {
          const knownIds = new Set(prev.map(item => item.id));
          return [...prev, ...formattedProducts.filter(item => !knownIds.has(item.id))];
        });
      } else {
        setAllProducts(formattedProducts);
        setInitialLoadComplete(true);
      }

      setNextPageUrl(data.next);
      setHasMore(!!data.next);
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Error:', error);
    } finally {
      requests.current.delete(controller);
      if (mounted.current && !controller.signal.aborted) setLoading(false);
      if (productRequest.current === controller) {
        productRequest.current = null;
        isLoadingMore.current = false;
      }
    }
  }, [buildApiUrl]);

  const loadMoreProducts = useCallback(() => {
    if (restoring.current || !hasMore || isLoadingMore.current || !nextPageUrl) return;
    fetchProducts(nextPageUrl);
  }, [hasMore, nextPageUrl, fetchProducts]);

  useEffect(() => {
    // El catalogo hace scroll con la pagina; el margen cubre la altura del footer
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1000;

      if (isNearBottom && hasMore && !isLoadingMore.current) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreProducts, hasMore]);

  useEffect(() => {
    if (categoriesLoaded && !initialLoadComplete) fetchProducts();
  }, [categoriesLoaded, initialLoadComplete, fetchProducts, historyKey]);

  const handleFilterChange = useCallback((newFilters) => {
    // Dashbar also reports its filters on mount; do not replace history for a no-op.
    const unchanged = Object.keys(newFilters).every(key =>
      JSON.stringify(newFilters[key]) === JSON.stringify(filters.current[key])
    );
    if (unchanged) return;

    filters.current = { ...filters.current, ...newFilters };

    const searchParams = new URLSearchParams();

    if (filters.current.searchTerm) {
      searchParams.set('search', filters.current.searchTerm);
    }

    if (filters.current.subcategories.length > 0) {
      searchParams.set('subcategories', filters.current.subcategories.join(','));
    }

    if (filters.current.categories.length > 0) {
      searchParams.set('categories', filters.current.categories.join(','));
    }

    if (filters.current.conditions.length > 0) {
      searchParams.set('conditions', filters.current.conditions.join(','));
    }

    searchParams.set('min', filters.current.priceRange[0]);
    searchParams.set('max', filters.current.priceRange[1]);

    navigate(`/shop?${searchParams.toString()}`, { replace: true });
  }, [navigate]);

  const getFilterSummary = () => {
    if (filters.current.categories.length > 0 && filters.current.subcategories.length > 0) {
      return <>Filtrando por <span className="shop-accent">{filters.current.categories.length}</span> categorías y <span className="shop-accent">{filters.current.subcategories.length}</span> subcategorías</>;
    }
    if (filters.current.categories.length > 0) {
      return <>Filtrando por <span className="shop-accent">{filters.current.categories.length}</span> categorías</>;
    }
    if (filters.current.subcategories.length > 0) {
      return <>Filtrando por <span className="shop-accent">{filters.current.subcategories.length}</span> subcategorías</>;
    }
    if (filters.current.conditions.length > 0) {
      return <>Filtrando por <span className="shop-accent">{filters.current.conditions.length}</span> condiciones</>;
    }
    if (filters.current.priceRange[0] > 0 || filters.current.priceRange[1] < 9999) {
      return <>Filtrando por precio: <span className="shop-accent">${filters.current.priceRange[0]}</span> - <span className="shop-accent">${filters.current.priceRange[1]}</span></>;
    }
    return <>Mostrando <span className="shop-accent">{allProducts.length}</span> productos</>;
  };

  const clearAllFilters = () => {
    handleFilterChange({
      subcategories: [],
      categories: [],
      conditions: [],
      priceRange: [0, 9999],
      searchTerm: ''
    });
  };

  return (
    <div className="shop-page vj-scope">
      {mobileFiltersOpen && (
        <button
          type="button"
          className="shop-filter-backdrop"
          aria-label="Cerrar filtros"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div className="shop-layout">
        <div className="shop-sidebar">
          <Dashbar
            onFilterChange={handleFilterChange}
            userData={userData}
            selectedCategories={filters.current.categories}
            selectedSubcategories={filters.current.subcategories}
            selectedConditions={filters.current.conditions}
            priceRange={filters.current.priceRange}
            mobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />
        </div>

        <div className="shop-main">
          <div className="shop-catalog-panel">
            <div className="shop-catalog-head">
              <div>
                <p className="shop-eyebrow">Catálogo</p>
                <h1 className="shop-title">Tu Tienda de Confianza</h1>
              </div>
              {filters.current.searchTerm ? (
                <div className="shop-search-state" dir="ltr">
                  <p>
                    Resultados para: <span className="shop-accent">"{filters.current.searchTerm}"</span>
                  </p>
                  <button
                    onClick={() => handleFilterChange({ searchTerm: '' })}
                    className="shop-clear-search"
                  >
                    (Limpiar)
                  </button>
                </div>
              ) : (
                <p className="shop-subtitle">Encuentra tecnología lista para entregar.</p>
              )}
            </div>

            <div className="shop-results-bar">
              <p>
                {getFilterSummary()}
              </p>
              <button
                type="button"
                className="shop-mobile-filter-button"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter size={16} />
                <span>Filtros</span>
              </button>
            </div>

            {loading && !initialLoadComplete ? (
              <div className="shop-state">
                <div className="vj-spinner"></div>
                <p>Cargando productos...</p>
              </div>
            ) : allProducts.length > 0 ? (
              <>
                <div className="shop-products-grid">
                  {allProducts.map(product => (
                    <CardItem
                      key={product.id}
                      product={product}
                      searchTerm={filters.current.searchTerm}
                      userRole={userData?.rol}
                    />
                  ))}
                </div>

                {loading && (
                  <div className="shop-state shop-state--inline">
                    <div className="vj-spinner"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="shop-state">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.469-1.009-5.927-2.616M15 17H9v-2h6v2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-500 mb-6">Prueba ajustando los filtros de búsqueda</p>
                <button
                  onClick={clearAllFilters}
                  className="shop-empty-button"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}

            <div className="shop-back-home">
              <Link to="/">
                <button>
                  Volver al Inicio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
      <ChatWidget />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default ShopPage;
