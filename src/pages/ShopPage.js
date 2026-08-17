import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import Dashbar from '../components/Dashbar';
import Navbar from '../components/Navbar';
import CardItem from '../components/CardItem';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import ChatWidget from '../components/ChatWidget';
import { jwtDecode } from 'jwt-decode';
import './ShopPage.css';

import { API_URL } from '../config/apiConfig';
const ShopPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filters = useRef({
    subcategories: [],
    priceRange: [0, 9999],
    searchTerm: '',
    categories: [],
    conditions: []
  });
  const isLoadingMore = useRef(false);
  const scrollContainerRef = useRef(null);

  const getCurrentUser = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const decoded = jwtDecode(token);
      setUserData(decoded);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/listar_categoria/`);
      const data = await response.json();
      setCategoriesData(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const buildApiUrl = (baseUrl = `${API_URL}/listar_item_activo/`) => {
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

    // Un Encargado de Punto de Venta solo vende productos de su propio punto de venta
    if (userData?.rol === 'Encargado de Punto de Venta' && userData?.punto_venta_id) {
      params.append('punto_venta', userData.punto_venta_id);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const fetchProducts = useCallback(async (url) => {
    try {
      if (isLoadingMore.current) return;
      
      setLoading(true);
      isLoadingMore.current = true;
      
      const apiUrl = url || buildApiUrl();
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      const formattedProducts = data.results.map(item => ({
        ...item,
        precio: parseFloat(item.precio).toFixed(2),
        precio_post_descuento: parseFloat(item.precio_post_descuento).toFixed(2),
        imagenes: item.imagenes || [],
        subcategorias_detalle: item.subcategorias_detalle || [],
        condicion: String(item.condicion_detalle?.id) || ''
      }));
      
      if (url && url.includes('page=')) {
        setAllProducts(prev => [...prev, ...formattedProducts]);
      } else {
        setAllProducts(formattedProducts);
        setInitialLoadComplete(true);
      }
      
      setNextPageUrl(data.next);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [categoriesData]);

  const loadMoreProducts = useCallback(() => {
    if (!hasMore || isLoadingMore.current || !nextPageUrl) return;
    fetchProducts(nextPageUrl);
  }, [hasMore, nextPageUrl, fetchProducts]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    const handleScroll = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const scrollSource = isMobile ? document.documentElement : scrollContainer;

      if (!scrollSource) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollSource;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
      
      if (isNearBottom && hasMore && !isLoadingMore.current) {
        loadMoreProducts();
      }
    };

    scrollContainer?.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreProducts, hasMore]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    const categoriesParam = searchParams.get('categories') || '';
    const subcategoriesParam = searchParams.get('subcategories') || '';
    const conditionsParam = searchParams.get('conditions') || '';
    const minPrice = parseInt(searchParams.get('min')) || 0;
    const maxPrice = parseInt(searchParams.get('max')) || 9999;
    
    filters.current = {
      searchTerm: searchQuery,
      categories: categoriesParam ? categoriesParam.split(',') : [],
      subcategories: subcategoriesParam ? subcategoriesParam.split(',') : [],
      conditions: conditionsParam ? conditionsParam.split(',') : [],
      priceRange: [minPrice, maxPrice]
    };
    
    setAllProducts([]);
    setNextPageUrl(null);
    setInitialLoadComplete(false);
    setHasMore(true);
    
    fetchProducts();
  }, [location.search, fetchProducts]);

  const handleFilterChange = useCallback((newFilters) => {
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
      return <>Filtrando por <span className="text-[#FF6B00] font-bold">{filters.current.categories.length}</span> categorías y <span className="text-[#FF6B00] font-bold">{filters.current.subcategories.length}</span> subcategorías</>;
    }
    if (filters.current.categories.length > 0) {
      return <>Filtrando por <span className="text-[#FF6B00] font-bold">{filters.current.categories.length}</span> categorías</>;
    }
    if (filters.current.subcategories.length > 0) {
      return <>Filtrando por <span className="text-[#FF6B00] font-bold">{filters.current.subcategories.length}</span> subcategorías</>;
    }
    if (filters.current.conditions.length > 0) {
      return <>Filtrando por <span className="text-[#FF6B00] font-bold">{filters.current.conditions.length}</span> condiciones</>;
    }
    if (filters.current.priceRange[0] > 0 || filters.current.priceRange[1] < 9999) {
      return <>Filtrando por precio: <span className="text-[#FF6B00] font-bold">${filters.current.priceRange[0]}</span> - <span className="text-[#FF6B00] font-bold">${filters.current.priceRange[1]}</span></>;
    }
    return <>Mostrando <span className="text-[#FF6B00] font-bold">{allProducts.length}</span> productos</>;
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
    <div className="shop-page min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar onShowLogin={() => {}} />
      </div>
      
      {mobileFiltersOpen && (
        <button
          type="button"
          className="shop-filter-backdrop"
          aria-label="Cerrar filtros"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div className="shop-layout flex flex-1">
        <div className="shop-sidebar">
          <Dashbar 
            onFilterChange={handleFilterChange} 
            userData={userData}
            selectedCategories={filters.current.categories}
            selectedConditions={filters.current.conditions}
            priceRange={filters.current.priceRange}
            mobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="shop-main flex-1 overflow-y-auto"
        >
          <div className="shop-catalog-panel">
            <div className="shop-catalog-head">
              <div>
                <p className="shop-eyebrow">Catalogo</p>
                <h1 className="shop-title">Tu Tienda de Confianza</h1>
              </div>
              {filters.current.searchTerm ? (
                <div className="shop-search-state" dir="ltr">
                  <p>
                    Resultados para: <span className="font-semibold text-orange-600">"{filters.current.searchTerm}"</span>
                  </p>
                  <button 
                    onClick={() => handleFilterChange({ searchTerm: '' })}
                    className="shop-clear-search"
                  >
                    (Limpiar)
                  </button>
                </div>
              ) : (
                <p className="shop-subtitle">Encuentra tecnologia lista para entregar.</p>
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
                <SlidersHorizontal size={18} />
                <span>Filtros</span>
              </button>
            </div>
            
            {loading && !initialLoadComplete ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando productos...</p>
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
                  <div className="mt-4 text-center">
                    <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-16">
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
      <ChatWidget />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default ShopPage;
