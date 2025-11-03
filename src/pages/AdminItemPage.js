import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {  
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CollectionsIcon from '@mui/icons-material/Collections';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import GradeIcon from '@mui/icons-material/Grade';
import VideocamIcon from '@mui/icons-material/Videocam';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import DiscountAlert from '../components/DiscountAlert';

const AdminItemPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false,
    initialData: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);
  const [subcategoriesData, setSubcategoriesData] = useState([]);
  const [conditionsData, setConditionsData] = useState([]);
  const [garantiasData, setGarantiasData] = useState([]);
  const [regalosData, setRegalosData] = useState([]);
  const [oldDiscount, setOldDiscount] = useState(0);
  // Filtros como en el ejemplo de la API
  const filters = useRef({
    nombre: '',
    categoria: '',
    sub_categoria: '',
    condicion: '',
    garantia: '',
    regalo: '',
    estado: 'all',
    costo: false
  });
  
  const isLoadingMore = useRef(false);
  const tableRef = useRef(null);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Obtener datos del usuario del localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuperAdmin = userData && (userData.rol === 'Super_Administrador');

  // Obtener token de autenticación
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Construir URL de la API con los filtros actuales
  const buildApiUrl = (baseUrl = 'https://videojuegoshabana.com/api/listar_item_all/') => {
    const params = new URLSearchParams();
    
    // Agregar cada filtro si tiene valor
    if (filters.current.nombre) params.append('nombre', filters.current.nombre);
    if (filters.current.categoria) params.append('categoria', filters.current.categoria);
    if (filters.current.sub_categoria) params.append('sub_categoria', filters.current.sub_categoria);
    if (filters.current.condicion) params.append('condicion', filters.current.condicion);
    if (filters.current.garantia) params.append('garantia', filters.current.garantia);
    if (filters.current.regalo) params.append('regalo', filters.current.regalo);
    
    // Estado (true/false)
    if (filters.current.estado !== 'all') {
      params.append('estado', filters.current.estado === 'active');
    }
    
    // Filtro de costo solo para super admin
    if (isSuperAdmin && filters.current.costo) {
      params.append('costo', '0');
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Obtener datos iniciales (categorías, subcategorías, condiciones, etc.)
  const fetchInitialData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({...prev, initialData: true}));
    setError(null);

    try {
      // Obtener categorías
      const categoriesResponse = await fetch('https://videojuegoshabana.com/api/listar_categoria/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Obtener subcategorías
      const subcategoriesResponse = await fetch('https://videojuegoshabana.com/api/listar_subcategoria/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Obtener condiciones
      const conditionsResponse = await fetch('https://videojuegoshabana.com/api/listar_condicion/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Obtener garantías
      const garantiasResponse = await fetch('https://videojuegoshabana.com/api/listar_garantia/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Obtener regalos
      const regalosResponse = await fetch('https://videojuegoshabana.com/api/listar_regalo/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!categoriesResponse.ok || !subcategoriesResponse.ok || !conditionsResponse.ok || 
          !garantiasResponse.ok || !regalosResponse.ok) {
        throw new Error('Error al obtener datos iniciales');
      }

      const categoriesData = await categoriesResponse.json();
      const subcategoriesData = await subcategoriesResponse.json();
      const conditionsData = await conditionsResponse.json();
      const garantiasData = await garantiasResponse.json();
      const regalosData = await regalosResponse.json();

      setCategoriesData(categoriesData);
      setSubcategoriesData(subcategoriesData);
      setConditionsData(conditionsData);
      setGarantiasData(garantiasData);
      setRegalosData(regalosData);
      
      // Obtener productos iniciales
      fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, initialData: false}));
    }
  }, []);

  // Obtener productos
  const fetchItems = useCallback(async (url) => {
    const token = getAuthToken();
    if (!token) return;

    if (isLoadingMore.current) return;
    
    setLoading(prev => ({...prev, list: true}));
    isLoadingMore.current = true;
    setError(null);

    try {
      const apiUrl = url || buildApiUrl();
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al obtener los productos');
      }

      const data = await response.json();
      
      if (url && url.includes('page=')) {
        setItems(prev => [...prev, ...data.results]);
      } else {
        setItems(data.results);
      }
      
      setNextPageUrl(data.next);
      setHasMore(!!data.next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
      isLoadingMore.current = false;
    }
  }, []);

  // Cargar más productos
  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore.current || !nextPageUrl) return;
    fetchItems(nextPageUrl);
  }, [hasMore, nextPageUrl, fetchItems]);

  // Manejar scroll infinito
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = table;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
      
      if (isNearBottom && hasMore && !isLoadingMore.current) {
        loadMoreItems();
      }
    };

    table.addEventListener('scroll', handleScroll);
    return () => table.removeEventListener('scroll', handleScroll);
  }, [loadMoreItems, hasMore]);

  // Sincronizar scroll horizontal
  useEffect(() => {
    const table = tableRef.current;
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    const handleTableScroll = () => {
      if (topScroll) topScroll.scrollLeft = table.scrollLeft;
      if (bottomScroll) bottomScroll.scrollLeft = table.scrollLeft;
    };

    const handleTopScroll = () => {
      table.scrollLeft = topScroll.scrollLeft;
      if (bottomScroll) bottomScroll.scrollLeft = topScroll.scrollLeft;
    };

    const handleBottomScroll = () => {
      table.scrollLeft = bottomScroll.scrollLeft;
      if (topScroll) topScroll.scrollLeft = bottomScroll.scrollLeft;
    };

    if (table) {
      table.addEventListener('scroll', handleTableScroll);
    }

    if (topScroll) {
      topScroll.addEventListener('scroll', handleTopScroll);
    }

    if (bottomScroll) {
      bottomScroll.addEventListener('scroll', handleBottomScroll);
    }

    return () => {
      if (table) {
        table.removeEventListener('scroll', handleTableScroll);
      }
      if (topScroll) {
        topScroll.removeEventListener('scroll', handleTopScroll);
      }
      if (bottomScroll) {
        bottomScroll.removeEventListener('scroll', handleBottomScroll);
      }
    };
  }, []);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manejar cambios en los filtros
  const handleFilterChange = useCallback((newFilters) => {
    filters.current = { ...filters.current, ...newFilters };
    setItems([]);
    setNextPageUrl(null);
    setHasMore(true);
    fetchItems();
  }, [fetchItems]);

  // Resetear todos los filtros
  const resetFilters = useCallback(() => {
    filters.current = {
      nombre: '',
      categoria: '',
      sub_categoria: '',
      condicion: '',
      garantia: '',
      regalo: '',
      estado: 'all',
      costo: false
    };
    handleFilterChange({});
  }, [handleFilterChange]);

  // Estado para el formulario de edición
  const [currentItem, setCurrentItem] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 0,
    precio: 0,
    costo: 0,
    descuento: 0,
    estado: false,
    garantia: '',
    regalo: '',
    condicion: '',
    sub_categoria: [],
    comision: 0,
    video: null,
    currentVideoUrl: '',
    videoPreview: null
  });
  const [videoError, setVideoError] = useState('');

  // Abrir modal de edición
  const handleOpenEditModal = (item) => {
    setCurrentItem(item);
    setOldDiscount(item.descuento || 0);
    setEditForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      cantidad: item.cantidad,
      precio: item.precio,
      costo: item.costo || 0,
      descuento: item.descuento,
      estado: item.estado,
      garantia: item.garantia?.id || '',
      regalo: item.regalo?.id || '',
      condicion: item.condicion_detalle?.id || '',
      sub_categoria: item.subcategorias_detalle
        ? item.subcategorias_detalle.map(sub => sub.id)
        : [],
      comision: item.comision || 0,
      video: null,
      currentVideoUrl: item.video || '',
      videoPreview: null
    });
    setVideoError('');
    setOpenEditModal(true);
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setCurrentItem(null);
    setVideoError('');
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (item) => {
    setCurrentItem(item);
    setOpenDeleteModal(true);
  };

  // Cerrar modal de eliminación
  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
    setCurrentItem(null);
  };

  // Manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubCategoriaChange = (event) => {
    const { value } = event.target;
    setEditForm(prev => ({
      ...prev,
      sub_categoria: Array.isArray(value) ? value : value ? [value] : [],
    }));
  };

  // Manejar cambio de video
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideoError('');

    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setVideoError('Formato no soportado. Use MP4, MOV, AVI o WEBM.');
      return;
    }

    // Validar tamaño (50MB máximo)
    if (file.size > 50 * 1024 * 1024) {
      setVideoError('El video no puede pesar más de 50MB');
      return;
    }

    // Crear vista previa
    const videoUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    
    videoElement.src = videoUrl;
    videoElement.onloadedmetadata = () => {
      // Validar duración (1 minuto máximo)
      if (videoElement.duration > 60) {
        setVideoError('El video no puede durar más de 1 minuto');
        URL.revokeObjectURL(videoUrl);
        return;
      }

      setEditForm(prev => ({
        ...prev,
        video: file,
        videoPreview: videoUrl,
        currentVideoUrl: '' // Limpiar la URL del video actual si se sube uno nuevo
      }));
    };

    videoElement.onerror = () => {
      setVideoError('Error al cargar el video. Intente con otro archivo.');
      URL.revokeObjectURL(videoUrl);
    };
  };

  // Eliminar video
  const removeVideo = () => {
    if (editForm.videoPreview) {
      URL.revokeObjectURL(editForm.videoPreview);
    }
    setEditForm(prev => ({
      ...prev,
      video: null,
      videoPreview: null,
      currentVideoUrl: ''
    }));
    // Limpiar el input file
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Enviar formulario de edición
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !currentItem) return;

    setLoading(prev => ({...prev, submitting: true}));
    setError(null);

    try {
      const formData = new FormData();
      
      // Agregar campos al FormData
      formData.append('nombre', editForm.nombre);
      formData.append('descripcion', editForm.descripcion);
      formData.append('cantidad', editForm.cantidad);
      formData.append('precio', editForm.precio);
      formData.append('costo', editForm.costo);
      formData.append('descuento', editForm.descuento);
      formData.append('estado', editForm.estado);
      formData.append('comision', editForm.comision);
      
      // Agregar garantía, regalo y condición
      if (editForm.garantia) formData.append('garantia', editForm.garantia);
      if (editForm.regalo) formData.append('regalo', editForm.regalo);
      if (editForm.condicion) formData.append('condicion', editForm.condicion);
      if (editForm.sub_categoria && editForm.sub_categoria.length) {
        editForm.sub_categoria.forEach(subcategoriaId => {
          formData.append('sub_categoria', subcategoriaId);
        });
      }
      // Manejo del video
      if (editForm.video) {
        formData.append('video', editForm.video);
      } else if (!editForm.currentVideoUrl) {
        formData.append('remove_video', 'true');
      }
      
      const response = await fetch(`https://videojuegoshabana.com/api/editar_item/${currentItem.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el producto');
      }
      // Enviar notificación de descuento si aplica
      if (editForm.descuento !== oldDiscount) {
        await DiscountAlert.sendDiscountNotification(
          {
            ...currentItem,
            nombre: editForm.nombre,
            precio: editForm.precio,
            descuento: editForm.descuento,
            // Calcular precio con descuento
            precio_post_descuento: editForm.precio - editForm.descuento
          },
          oldDiscount,
          editForm.descuento
        );
      }
      setSuccess('Producto actualizado correctamente');
      fetchItems();
      handleCloseEditModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  // Eliminar producto
  const handleDeleteItem = async () => {
    const token = getAuthToken();
    if (!token || !currentItem) return;

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/eliminar_item/${currentItem.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      setSuccess('Producto eliminado correctamente');
      fetchItems();
      handleCloseDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cerrar alertas
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Obtener primera imagen del producto
  const getFirstImage = (item) => {
    return item.imagenes?.length > 0 ? item.imagenes[0].imagen : null;
  };

  // Resumen de filtros aplicados
  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.current.nombre) {
      activeFilters.push(`Nombre: "${filters.current.nombre}"`);
    }
    
    if (filters.current.categoria) {
      const category = categoriesData.find(c => String(c.id) === filters.current.categoria);
      activeFilters.push(`Categoría: ${category?.nombre || filters.current.categoria}`);
    }
    
    if (filters.current.sub_categoria) {
      const subcategory = subcategoriesData.find(s => String(s.id) === filters.current.sub_categoria);
      activeFilters.push(`Subcategoría: ${subcategory?.nombre || filters.current.sub_categoria}`);
    }
    
    if (filters.current.condicion) {
      const condition = conditionsData.find(c => String(c.id) === filters.current.condicion);
      activeFilters.push(`Condición: ${condition?.nombre || filters.current.condicion}`);
    }
    
    if (filters.current.garantia) {
      const garantia = garantiasData.find(g => String(g.id) === filters.current.garantia);
      activeFilters.push(`Garantía: ${garantia?.tiempo || filters.current.garantia}`);
    }
    
    if (filters.current.regalo) {
      const regalo = regalosData.find(r => String(r.id) === filters.current.regalo);
      activeFilters.push(`Regalo: ${regalo?.nombre || filters.current.regalo}`);
    }
    
    if (filters.current.estado !== 'all') {
      activeFilters.push(`Estado: ${filters.current.estado === 'active' ? 'Activos' : 'Inactivos'}`);
    }
    
    if (isSuperAdmin && filters.current.costo) {
      activeFilters.push('Sin costo');
    }
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'Mostrando todos los productos';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Productos</h1>
              <p className="text-gray-600">Gestiona el inventario de tu tienda</p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setOpenFilters(!openFilters)}
                className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <FilterListIcon />
                <span>Filtros</span>
              </button>
              <button 
                onClick={() => navigate('/crear-item')}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <AddIcon className="text-white" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          {openFilters && (
            <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Búsqueda por nombre */}
                <TextField
                  label="Nombre del producto"
                  value={filters.current.nombre}
                  onChange={(e) => handleFilterChange({ nombre: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
                
                {/* Filtro por categoría */}
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={filters.current.categoria}
                    onChange={(e) => handleFilterChange({ categoria: e.target.value })}
                    label="Categoría"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    {categoriesData.map((category) => (
                      <MenuItem key={category.nombre} value={String(category.nombre)}>
                        {category.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Filtro por subcategoría */}
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    value={filters.current.sub_categoria}
                    onChange={(e) => handleFilterChange({ sub_categoria: e.target.value })}
                    label="Subcategoría"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    {subcategoriesData.map((subcategory) => (
                      <MenuItem key={subcategory.nombre} value={String(subcategory.nombre)}>
                        {subcategory.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Filtro por condición */}
                <FormControl fullWidth size="small">
                  <InputLabel>Condición</InputLabel>
                  <Select
                    value={filters.current.condicion}
                    onChange={(e) => handleFilterChange({ condicion: e.target.value })}
                    label="Condición"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    {conditionsData.map((condition) => (
                      <MenuItem key={condition.id} value={String(condition.id)}>
                        {condition.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Filtro por garantía */}
                <FormControl fullWidth size="small">
                  <InputLabel>Garantía</InputLabel>
                  <Select
                    value={filters.current.garantia}
                    onChange={(e) => handleFilterChange({ garantia: e.target.value })}
                    label="Garantía"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    {garantiasData.map((garantia) => (
                      <MenuItem key={garantia.id} value={String(garantia.id)}>
                        {garantia.tiempo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Filtro por regalo */}
                <FormControl fullWidth size="small">
                  <InputLabel>Regalo</InputLabel>
                  <Select
                    value={filters.current.regalo}
                    onChange={(e) => handleFilterChange({ regalo: e.target.value })}
                    label="Regalo"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {regalosData.map((regalo) => (
                      <MenuItem key={regalo.id} value={String(regalo.id)}>
                        {regalo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Estado */}
                <FormControl size="small" fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.current.estado}
                    onChange={(e) => handleFilterChange({ estado: e.target.value })}
                    label="Estado"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activos</MenuItem>
                    <MenuItem value="inactive">Inactivos</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Filtro exclusivo para Super Admin */}
                {isSuperAdmin && (
                  <div className="col-span-full flex items-center">
                    <input
                      type="checkbox"
                      id="sin-costo-filter"
                      checked={filters.current.costo}
                      onChange={(e) => handleFilterChange({ costo: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sin-costo-filter" className="ml-2 text-sm text-gray-700">
                      Mostrar solo productos sin costo
                    </label>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                >
                  <ClearIcon fontSize="small" />
                  <span className="ml-1">Limpiar filtros</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de filtros */}
        <div className="mb-4 p-4 bg-white rounded-xl shadow">
          <p className="text-sm text-gray-700">
            {getFilterSummary()}
          </p>
        </div>

        {/* Contenido principal */}
        {loading.list && !items.length ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando productos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Barra de desplazamiento horizontal superior */}
            <div 
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden"
              style={{ height: '15px' }}
            >
              <div style={{ height: '1px' }}></div>
            </div>

            {/* Tabla con scroll vertical */}
            <div 
              ref={tableRef}
              className="overflow-auto"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado / Condición
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Garantía / Regalo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Inventario
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Costo
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Precio / Comisión
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Precio Final
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Variaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {/* Celda de Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Tooltip title="Añadir variación">
                            <button
                              onClick={() => navigate(`/admin-variacion/${item.id}`)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <PlaylistAddIcon sx={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Gestionar imágenes">
                            <button
                              onClick={() => navigate(`/admin-item-images/${item.id}`)}
                              className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <CollectionsIcon sx={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>

                      {/* Producto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <Avatar 
                            src={getFirstImage(item)} 
                            variant="rounded"
                            sx={{ width: 56, height: 56 }}
                            className="shadow-md"
                          >
                            {!getFirstImage(item) && item.nombre.charAt(0)}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                            <div className="text-sm text-gray-500">ID: {item.id}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {item.subcategorias_detalle?.map(sc => sc.nombre).join(', ')}
                            </div>
                            {item.video && (
                              <div className="flex items-center mt-1 text-xs text-blue-600">
                                <VideocamIcon sx={{ fontSize: 14 }} />
                                <span className="ml-1">Tiene video</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado / Condición */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <Chip 
                            label={item.estado ? 'Activo' : 'Inactivo'} 
                            color={item.estado ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          />
                          {item.condicion_detalle && (
                            <Tooltip title="Condición del producto">
                              <Chip
                                icon={<GradeIcon />}
                                label={item.condicion_detalle.nombre}
                                color="warning"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      {/* Garantía / Regalo */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {item.garantia ? (
                            <Tooltip title="Garantía">
                              <Chip
                                icon={<AssignmentReturnIcon />}
                                label={item.garantia.tiempo}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Sin garantía">
                              <Chip
                                icon={<AssignmentReturnIcon />}
                                label="Sin garantía"
                                color="default"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          )}
                          {item.regalo ? (
                            <Tooltip title="Regalo incluido">
                              <Chip
                                icon={<LocalOfferIcon />}
                                label={item.regalo.nombre}
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Sin regalo">
                              <Chip
                                icon={<LocalOfferIcon />}
                                label="Sin regalo"
                                color="default"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      {/* Inventario */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">Stock: {item.cantidad}</div>
                          <div className="text-gray-500">Total: {item.total_item}</div>
                        </div>
                      </td>

                      {/* Costo (solo para Super Admin) */}
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            ${item.costo || 'N/A'}
                          </div>
                        </td>
                      )}

                      {/* Precio / Comisión */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">${item.precio}</div>
                          <div className="flex items-center text-xs text-purple-700 mt-1">
                            <span>{item.comision} comisión</span>
                          </div>
                        </div>
                      </td>

                      {/* Descuento */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.descuento}%
                        </span>
                      </td>

                      {/* Precio Final */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#FF6B00]">${item.precio_post_descuento}</div>
                      </td>

                      {/* Variaciones */}
                      <td className="px-6 py-4">
                        <Chip 
                          label={item.variaciones && item.variaciones.length > 0 ? `${item.variaciones.length} variaciones` : 'Sin variaciones'} 
                          color={item.variaciones && item.variaciones.length > 0 ? 'primary' : 'default'}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Cargando más productos */}
              {loading.list && items.length > 0 && (
                <div className="flex justify-center p-4">
                  <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Barra de desplazamiento horizontal inferior */}
            <div 
              ref={bottomScrollRef}
              className="overflow-x-auto overflow-y-hidden"
              style={{ height: '15px' }}
            >
              <div style={{ height: '1px' }}></div>
            </div>
            
            {items.length === 0 && !loading.list && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <FilterListIcon sx={{ fontSize: 64 }} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos que coincidan con los filtros</h3>
                <p className="text-gray-500 mb-6">Intenta ajustar los filtros o crea un nuevo producto</p>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={resetFilters}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                  <button 
                    onClick={() => navigate('/crear-item')}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    Crear Producto
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Edición */}
        <Dialog 
          open={openEditModal} 
          onClose={handleCloseEditModal} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            style: {
              borderRadius: '16px',
              padding: '8px'
            }
          }}
        >
          <DialogTitle className="text-center pb-2">
            <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información del producto</p>
          </DialogTitle>
          
          <form onSubmit={handleSubmitEdit}>
            <DialogContent className="space-y-4">
              {/* Sección de imagen */}
              {currentItem?.imagenes?.length > 0 && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <Avatar 
                    src={getFirstImage(currentItem)} 
                    variant="rounded"
                    sx={{ width: 80, height: 80 }}
                    className="shadow-md"
                  />
                  <div className="text-sm text-gray-600">
                    <p>Este producto tiene {currentItem.imagenes.length} imágenes</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gestiona las imágenes en la sección correspondiente
                    </p>
                  </div>
                </div>
              )}

              {/* Sección de Video */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Video del Producto (Opcional)
                </h3>
                
                <Box className="space-y-4">
                  <div>
                    <input
                      accept="video/*"
                      style={{ display: 'none' }}
                      id={`edit-item-video-${currentItem?.id || 'new'}`}
                      type="file"
                      onChange={handleVideoChange}
                      ref={fileInputRef}
                      disabled={loading.submitting}
                    />
                    <label htmlFor={`edit-item-video-${currentItem?.id || 'new'}`}>
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<VideocamIcon />}
                        disabled={loading.submitting}
                        sx={{
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '14px',
                          padding: '10px 20px',
                          '&:hover': {
                            backgroundColor: '#2563eb'
                          },
                          '&:disabled': {
                            backgroundColor: '#9ca3af',
                            color: '#ffffff'
                          }
                        }}
                      >
                        {editForm.video || editForm.currentVideoUrl ? 
                          'Video seleccionado' : 
                          'Seleccionar Video'}
                      </Button>
                    </label>
                    {(editForm.video || editForm.currentVideoUrl) && (
                      <span className="ml-3 text-sm text-gray-500">
                        {editForm.video ? 
                          `${Math.round(editForm.video.size / (1024 * 1024))}MB` : 
                          'Video actual del producto'}
                      </span>
                    )}
                  </div>
                  
                  {(editForm.videoPreview || editForm.currentVideoUrl) && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        {editForm.videoPreview ? 'Vista previa del nuevo video' : 'Video actual del producto'}
                      </p>
                      <div className="relative">
                        <video 
                          src={editForm.videoPreview || editForm.currentVideoUrl} 
                          controls
                          className="w-full max-h-64 object-contain rounded-lg border-2 border-blue-300 shadow-sm"
                        />
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<DeleteForeverIcon />}
                          onClick={removeVideo}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 1)'
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Formatos aceptados: MP4, MOV, AVI, WEBM. Máximo 50MB y 1 minuto de duración.
                      </p>
                    </div>
                  )}
                </Box>
              </div>

              {/* Campos del formulario */}
              <TextField
                label="Nombre del Producto"
                name="nombre"
                value={editForm.nombre}
                onChange={handleEditChange}
                fullWidth
                required
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#FF6B00',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF6B00',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF6B00',
                  },
                }}
              />
              
              <TextField
                label="Descripción"
                name="descripcion"
                value={editForm.descripcion}
                onChange={handleEditChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': {
                      borderColor: '#FF6B00',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF6B00',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FF6B00',
                  },
                }}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  value={editForm.cantidad}
                  onChange={handleEditChange}
                  fullWidth
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
                <TextField
                  label="Precio"
                  name="precio"
                  type="number"
                  value={editForm.precio}
                  onChange={handleEditChange}
                  fullWidth
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
              </div>
              
              {isSuperAdmin && (
                <TextField
                  label="Costo"
                  name="costo"
                  type="number"
                  value={editForm.costo}
                  onChange={handleEditChange}
                  fullWidth
                  margin="normal"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Descuento (%)"
                  name="descuento"
                  type="number"
                  value={editForm.descuento}
                  onChange={handleEditChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0}}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
                <TextField
                  label="Comisión (%)"
                  name="comision"
                  type="number"
                  value={editForm.comision}
                  onChange={handleEditChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0}}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#FF6B00',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B00',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FF6B00',
                    },
                  }}
                />
              </div>

              {/* Selectores para Garantía, Regalo y Condición */}
              <div className="grid grid-cols-3 gap-4">
                <FormControl fullWidth margin="normal">
                  <InputLabel>Garantía</InputLabel>
                  <Select
                    name="garantia"
                    value={editForm.garantia}
                    onChange={handleEditChange}
                    label="Garantía"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {garantiasData.map(garantia => (
                      <MenuItem key={garantia.id} value={garantia.id}>
                        {garantia.tiempo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Regalo</InputLabel>
                  <Select
                    name="regalo"
                    value={editForm.regalo}
                    onChange={handleEditChange}
                    label="Regalo"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Ninguno</em>
                    </MenuItem>
                    {regalosData.map(regalo => (
                      <MenuItem key={regalo.id} value={regalo.id}>
                        {regalo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Condición</InputLabel>
                  <Select
                    name="condicion"
                    value={editForm.condicion}
                    onChange={handleEditChange}
                    label="Condición"
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {conditionsData.map(condicion => (
                      <MenuItem key={condicion.id} value={condicion.id}>
                        {condicion.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    multiple
                    name="sub_categoria"
                    value={editForm.sub_categoria}
                    onChange={handleEditSubCategoriaChange}
                    label="Subcategoría"
                    renderValue={(selected) => {
                      const values = Array.isArray(selected) ? selected : selected ? [selected] : [];
                      if (!values.length) {
                        return 'Selecciona subcategorias';
                      }
                      return values
                        .map((value) => {
                          const match = subcategoriesData.find(sub => String(sub.id) === String(value));
                          return match ? match.nombre : value;
                        })
                        .join(', ');
                    }}
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#FF6B00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B00',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#FF6B00',
                      },
                    }}
                  >
                    {subcategoriesData.map(subcategoria => (
                      <MenuItem key={subcategoria.id} value={subcategoria.id}>
                        {subcategoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

            </DialogContent>
            
            <DialogActions className="p-6 pt-2">
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={loading.submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading.submitting || !!videoError}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal de Eliminación */}
        <Dialog 
          open={openDeleteModal} 
          onClose={handleCloseDeleteModal}
          PaperProps={{
            style: {
              borderRadius: '16px',
              padding: '8px'
            }
          }}
        >
          <DialogTitle className="text-center pb-2">
            <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
          </DialogTitle>
          <DialogContent className="text-center py-4">
            <p className="text-gray-600">
              ¿Estás seguro que deseas eliminar el producto <strong>"{currentItem?.nombre}"</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">Esta acción no se puede deshacer.</p>
          </DialogContent>
          <DialogActions className="p-6 pt-2 justify-center space-x-4">
            <button
              onClick={handleCloseDeleteModal}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteItem}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200"
            >
              Eliminar
            </button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="error" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="success" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            {success}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default AdminItemPage;
