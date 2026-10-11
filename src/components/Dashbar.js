import { apiFetch as fetch } from '../auth/session';
import React, { useState, useEffect } from 'react';
import { Slider, Checkbox } from '@mui/material';
import { ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Edit, User, Filter, DollarSign, Tags, X, Award } from 'lucide-react';
import './Dashbar.css';

import { API_URL } from '../config/apiConfig';
const normalizeOrdenValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const compareNullableNumbers = (a, b) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
};

const sortCategoriesByOrden = (list) => {
  return [...list].sort((a, b) => {
    const ordenComparison = compareNullableNumbers(
      normalizeOrdenValue(a?.orden),
      normalizeOrdenValue(b?.orden)
    );
    if (ordenComparison !== 0) {
      return ordenComparison;
    }

    const nameComparison = (a?.nombre || '').localeCompare(b?.nombre || '', undefined, { sensitivity: 'base' });
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return (a?.id || 0) - (b?.id || 0);
  });
};

const sortSubcategoriesWithCategory = (list) => {
  return [...list].sort((a, b) => {
    const categoryOrdenComparison = compareNullableNumbers(
      normalizeOrdenValue(a?.categoria?.orden),
      normalizeOrdenValue(b?.categoria?.orden)
    );
    if (categoryOrdenComparison !== 0) {
      return categoryOrdenComparison;
    }

    const categoryNameComparison = (a?.categoria?.nombre || '').localeCompare(
      b?.categoria?.nombre || '',
      undefined,
      { sensitivity: 'base' }
    );
    if (categoryNameComparison !== 0) {
      return categoryNameComparison;
    }

    const ordenComparison = compareNullableNumbers(
      normalizeOrdenValue(a?.orden),
      normalizeOrdenValue(b?.orden)
    );
    if (ordenComparison !== 0) {
      return ordenComparison;
    }

    const nameComparison = (a?.nombre || '').localeCompare(b?.nombre || '', undefined, { sensitivity: 'base' });
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return (a?.id || 0) - (b?.id || 0);
  });
};

const getCategoryImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
};

const Dashbar = ({ onFilterChange, userData, onEditProfile, selectedCategories = [], selectedConditions = [], priceRange, mobileOpen = false, onCloseMobile }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState({
    categories: true,
    subcategories: true,
    conditions: true
  });
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [localPriceRange, setLocalPriceRange] = useState([0, 9999]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState(['price', 'categories', 'condition']);

  // Sincronizar con los valores iniciales de las props
  useEffect(() => {
    setLocalPriceRange(priceRange || [0, 9999]);
  }, [priceRange]);

  useEffect(() => {
    // Sincronizar subcategorías desde la URL
    const searchParams = new URLSearchParams(window.location.search);
    const subcategoriesParam = searchParams.get('subcategories');
    if (subcategoriesParam) {
      setSelectedSubcategories(subcategoriesParam.split(','));
    }
  }, []);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_condicion/`, {
          method: 'GET',
        });

        if (!response.ok) throw new Error('Error al cargar condiciones');

        const data = await response.json();
        setConditions(data);
      } catch (err) {
        console.error("Error fetching conditions:", err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, conditions: false }));
      }
    };

    fetchConditions();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_categoria/`);
        if (!response.ok) throw new Error('Error al cargar categorías');

        const data = await response.json();
        const sortedData = sortCategoriesByOrden(data);
        setCategories(sortedData);

        const expanded = {};
        sortedData.forEach(cat => {
          expanded[cat.id] = false;
        });
        setExpandedCategories(expanded);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_subcategoria/`);
        if (!response.ok) throw new Error('Error al cargar subcategorías');
        const data = await response.json();
        const sortedData = sortSubcategoriesWithCategory(data);
        setSubcategories(sortedData);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, subcategories: false }));
      }
    };

    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (!loading.categories && !loading.subcategories && !loading.conditions) {
      onFilterChange({
        subcategories: selectedSubcategories,
        priceRange: localPriceRange,
        categories: selectedCategories,
        conditions: selectedConditions
      });
    }
  }, [selectedSubcategories, localPriceRange, selectedCategories, selectedConditions, loading, onFilterChange]);

  const handleCategoryChange = (categoryId) => {
    const newCategories = selectedCategories.includes(String(categoryId))
      ? selectedCategories.filter(id => id !== String(categoryId))
      : [...selectedCategories, String(categoryId)];

    onFilterChange({ categories: newCategories });
  };

  const handleSubcategoryChange = (subcategoryName) => {
    setSelectedSubcategories(prev =>
      prev.includes(subcategoryName)
        ? prev.filter(name => name !== subcategoryName)
        : [...prev, subcategoryName]
    );
  };

  const handleConditionChange = (conditionId) => {
    const newConditions = selectedConditions.includes(String(conditionId))
      ? selectedConditions.filter(id => id !== String(conditionId))
      : [...selectedConditions, String(conditionId)];

    onFilterChange({ conditions: newConditions });
  };

  const handlePriceChange = (event, newValue) => {
    setLocalPriceRange(newValue);
  };

  const handlePriceChangeCommitted = (event, newValue) => {
    onFilterChange({ priceRange: newValue });
  };

  const toggleSection = (section) => {
    setExpandedSection(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getSubcategoriesByCategory = (categoryId) => {
    const filtered = subcategories.filter(sub => sub.categoria?.id === categoryId);
    return sortSubcategoriesWithCategory(filtered);
  };

  const handleCategoryClick = (categoryId, e) => {
    if (e.target.type === 'checkbox' || e.target.closest('.category-selector')) {
      handleCategoryChange(categoryId);
    } else {
      toggleCategory(categoryId);
    }
  };

  const clearSubcategories = () => {
    setSelectedSubcategories([]);
  };

  const clearConditions = () => {
    onFilterChange({ conditions: [] });
  };

  const clearPriceFilter = () => {
    setLocalPriceRange([0, 9999]);
    onFilterChange({ priceRange: [0, 9999] });
  };

  const clearAllFilters = () => {
    setSelectedSubcategories([]);
    setLocalPriceRange([0, 9999]);
    onFilterChange({
      subcategories: [],
      categories: [],
      conditions: [],
      priceRange: [0, 9999]
    });
  };

  if (error) {
    return (
      <div className={`dashbar-shell vj-scope bg-gray-900 shadow-2xl p-6 border-r border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'dashbar-collapsed w-16' : 'dashbar-expanded w-64'} ${mobileOpen ? 'dashbar-mobile-open' : ''}`}>
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (loading.categories || loading.subcategories || loading.conditions) {
    return (
      <div className={`dashbar-shell vj-scope bg-gray-900 shadow-2xl p-6 flex justify-center items-center border-r border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'dashbar-collapsed w-16' : 'dashbar-expanded w-64'} ${mobileOpen ? 'dashbar-mobile-open' : ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`dashbar-shell vj-scope shadow-2xl border-r transition-all duration-300 ease-in-out ${isCollapsed ? 'dashbar-collapsed w-16' : 'dashbar-expanded w-64'} ${mobileOpen ? 'dashbar-mobile-open' : ''}`}>

      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-4 bg-orange-500 text-white rounded-full p-1 shadow-lg hover:bg-orange-600 transition-colors z-50"
        aria-label={isCollapsed ? "Expandir panel" : "Contraer panel"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {onCloseMobile && (
        <button
          type="button"
          onClick={onCloseMobile}
          className="dashbar-mobile-close"
          aria-label="Cerrar filtros"
        >
          <X size={20} />
        </button>
      )}

      <div className="dashbar-scroll">
        {!isCollapsed && (
          <div className="dashbar-mobile-title">
            <h2>Filtros de Búsqueda</h2>
          </div>
        )}

        {!isCollapsed && userData && (
          <div className="dashbar-user">
            <div className="dashbar-user__avatar">
              {userData?.imagen ? (
                <img
                  src={userData.imagen}
                  alt="Usuario"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <User size={22} style={{ display: userData?.imagen ? 'none' : 'block' }} />
            </div>
            <div className="dashbar-user__meta">
              <h3>{userData?.nombre || userData?.username || 'Usuario'}</h3>
              {(userData?.correo || userData?.email) && <p>{userData?.correo || userData?.email}</p>}
            </div>
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="dashbar-user__edit"
                aria-label="Editar perfil"
              >
                <Edit size={16} />
              </button>
            )}
          </div>
        )}

        {!isCollapsed && (
          <h2 className="dashbar-title">
            <Filter size={18} /> Filtros
          </h2>
        )}

        {/* Sección de Condición */}
        <div className="mb-3 text-left">
          <button
            onClick={() => toggleSection('condition')}
            className={`dashbar-row ${isCollapsed ? 'dashbar-row--icon' : ''}`}
            aria-expanded={expandedSection.includes('condition')}
          >
            <div className="flex items-center">
              <Award className="text-orange-500" size={18} />
              {!isCollapsed && (
                <>
                  <span className="dashbar-row__label">Condición</span>
                  {selectedConditions.length > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {selectedConditions.length}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`text-orange-500 transition-transform duration-200 ${expandedSection.includes('condition') ? 'transform rotate-180' : ''}`} size={16} />
            )}
          </button>

          {!isCollapsed && expandedSection.includes('condition') && (
            <div className="dashbar-panel rounded-lg p-3 mt-1 animate-fadeIn space-y-2">
              {conditions.map(condition => (
                <label key={condition.id} className="flex items-center cursor-pointer">
                  <Checkbox
                    checked={selectedConditions.includes(String(condition.id))}
                    onChange={() => handleConditionChange(condition.id)}
                    size="small"
                    sx={{
                      color: '#9CA3AF',
                      '&.Mui-checked': {
                        color: '#e8611a',
                      },
                    }}
                  />
                  <span className="text-gray-300 text-xs hover:text-white transition-colors ml-1">
                    {condition.nombre}
                  </span>
                </label>
              ))}
              {selectedConditions.length > 0 && (
                <button
                  onClick={clearConditions}
                  className="mt-2 w-full text-xs text-orange-500 hover:text-orange-400 flex items-center justify-center py-1 bg-gray-800 rounded"
                >
                  <X size={14} className="mr-1" />
                  Limpiar condiciones
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección de Precios */}
        <div className="mb-3 text-left">
          <button
            onClick={() => toggleSection('price')}
            className={`dashbar-row ${isCollapsed ? 'dashbar-row--icon' : ''}`}
            aria-expanded={expandedSection.includes('price')}
          >
            <div className="flex items-center">
              <DollarSign className="text-orange-500" size={18} />
              {!isCollapsed && (
                <>
                  <span className="dashbar-row__label">Precios</span>
                  {(localPriceRange[0] > 0 || localPriceRange[1] < 9999) && (
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Filtrado
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`text-orange-500 transition-transform duration-200 ${expandedSection.includes('price') ? 'transform rotate-180' : ''}`} size={16} />
            )}
          </button>

          {!isCollapsed && expandedSection.includes('price') && (
            <div className="dashbar-panel rounded-lg p-3 mt-1 animate-fadeIn">
              <Slider
                value={localPriceRange}
                onChange={handlePriceChange}
                onChangeCommitted={handlePriceChangeCommitted}
                valueLabelDisplay="auto"
                min={0}
                max={9999}
                step={10}
                aria-labelledby="range-slider"
                sx={{
                  color: '#e8611a',
                  '& .MuiSlider-thumb': {
                    height: 16,
                    width: 16,
                    backgroundColor: '#e8611a',
                    border: '2px solid #e8611a',
                    boxShadow: '0 0 6px rgba(232, 97, 26, 0.3)',
                  },
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: '#374151',
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: '#e8611a',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem',
                  }
                }}
              />
              <div className="dashbar-price-range">
                <span>Min: ${localPriceRange[0]} USD</span>
                <span>Max: ${localPriceRange[1]} USD</span>
              </div>
              {(localPriceRange[0] > 0 || localPriceRange[1] < 9999) && (
                <button
                  onClick={clearPriceFilter}
                  className="mt-2 w-full text-xs text-orange-500 hover:text-orange-400 flex items-center justify-center py-1 bg-gray-800 rounded"
                >
                  <X size={14} className="mr-1" />
                  Limpiar filtro de precios
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección de Categorías */}
        <div className="space-y-2 text-left">
          <button
            onClick={() => toggleSection('categories')}
            className={`dashbar-row ${isCollapsed ? 'dashbar-row--icon' : ''}`}
            aria-expanded={expandedSection.includes('categories')}
          >
            <div className="flex items-center">
              <Tags className="text-orange-500" size={18} />
              {!isCollapsed && (
                <>
                  <span className="dashbar-row__label">Categorías</span>
                  {selectedCategories.length > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {selectedCategories.length}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`text-orange-500 transition-transform duration-200 ${expandedSection.includes('categories') ? 'transform rotate-180' : ''}`} size={16} />
            )}
          </button>

          {!isCollapsed && expandedSection.includes('categories') && (
            <div className="space-y-1">
              {categories.length > 0 ? (
                <>
                  {categories.map(category => {
                    const categorySubs = getSubcategoriesByCategory(category.id);
                    const hasSubcategories = categorySubs.length > 0;
                    const categoryImageUrl = getCategoryImageUrl(category.imagen);

                    return (
                      <div
                        key={category.id}
                        className={`dashbar-panel rounded-lg overflow-hidden ${
                          selectedCategories.includes(String(category.id)) ? 'dashbar-selected' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className="category-selector flex items-center px-2 cursor-pointer"
                            onClick={(e) => handleCategoryClick(category.id, e)}
                          >
                            <Checkbox
                              checked={selectedCategories.includes(String(category.id))}
                              onChange={() => handleCategoryChange(category.id)}
                              size="small"
                              sx={{
                                color: '#9CA3AF',
                                '&.Mui-checked': {
                                  color: '#e8611a',
                                },
                              }}
                            />
                          </div>
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className={`flex-1 flex items-center justify-between w-full p-2 text-left hover:bg-gray-700 transition-colors ${
                              selectedCategories.includes(String(category.id)) ? 'bg-gray-700' : ''
                            } ${!hasSubcategories ? 'opacity-50 cursor-default' : ''}`}
                            disabled={!hasSubcategories}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="dashbar-category-image">
                                {categoryImageUrl && (
                                  <img
                                    src={categoryImageUrl}
                                    alt={`Categoría ${category.nombre}`}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                )}
                                <span style={{ display: categoryImageUrl ? 'none' : 'flex' }}>
                                  {category.nombre?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-white text-xs">{category.nombre}</span>
                            </div>
                            {hasSubcategories && (
                              <div className="text-orange-500">
                                {expandedCategories[category.id] ?
                                  <ChevronUp size={14} /> :
                                  <ChevronDown size={14} />
                                }
                              </div>
                            )}
                          </button>
                        </div>

                        {hasSubcategories && expandedCategories[category.id] && (
                          <div className="px-2 pb-2 space-y-1 bg-gray-850 animate-fadeIn">
                            {categorySubs.map(subcategory => (
                              <div key={subcategory.id} className="ml-8 flex items-center">
                                <label className="flex items-center cursor-pointer">
                                  <Checkbox
                                    checked={selectedSubcategories.includes(subcategory.nombre)}
                                    onChange={() => handleSubcategoryChange(subcategory.nombre)}
                                    size="small"
                                    sx={{
                                      color: '#9CA3AF',
                                      '&.Mui-checked': {
                                        color: '#e8611a',
                                      },
                                    }}
                                  />
                                  <span className="text-gray-300 text-xs hover:text-white transition-colors ml-1">
                                    {subcategory.nombre}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex space-x-2">
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => onFilterChange({ categories: [] })}
                        className="mt-2 w-full text-xs text-orange-500 hover:text-orange-400 flex items-center justify-center py-1 bg-gray-800 rounded"
                      >
                        <X size={14} className="mr-1" />
                        Limpiar categorías
                      </button>
                    )}
                    {selectedSubcategories.length > 0 && (
                      <button
                        onClick={clearSubcategories}
                        className="mt-2 w-full text-xs text-orange-500 hover:text-orange-400 flex items-center justify-center py-1 bg-gray-800 rounded"
                      >
                        <X size={14} className="mr-1" />
                        Limpiar subcategorías
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                  <p className="text-xs text-gray-400 text-center">No hay categorías</p>
                </div>
              )}
            </div>
          )}
        </div>

        {!isCollapsed && onCloseMobile && (
          <div className="dashbar-mobile-actions">
            <button type="button" className="dashbar-clear-all" onClick={clearAllFilters}>
              Limpiar
            </button>
            <button type="button" className="dashbar-apply" onClick={onCloseMobile}>
              Aplicar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashbar;
