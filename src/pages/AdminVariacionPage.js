import { API_URL } from '../config/apiConfig';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import GradeIcon from '@mui/icons-material/Grade';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const AdminVariacionPage = () => {
  const { itemId } = useParams();
  const [variaciones, setVariaciones] = useState([]);
  const [garantias, setGarantias] = useState([]);
  const [regalos, setRegalos] = useState([]);
  const [condiciones, setCondiciones] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    submitting: false,
    initialData: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentVariacion, setCurrentVariacion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    color: '',
    modelo: '',
    ubicacion: '',
    precio: '',
    cantidad: '',
    imagen: null,
    garantia: '',
    regalo: [],
    condicion: '',
    comision: '',
    upc: ''
  });
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(prev => ({...prev, initialData: true}));
        const token = localStorage.getItem('authToken');
        
        // Obtener garantías
        const garantiaResponse = await fetch(`${API_URL}/listar_garantia/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Obtener regalos
        const regaloResponse = await fetch(`${API_URL}/listar_regalo/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Obtener condiciones
        const condicionResponse = await fetch(`${API_URL}/listar_condicion/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!garantiaResponse.ok || !regaloResponse.ok || !condicionResponse.ok) {
          throw new Error('Error al obtener datos iniciales');
        }

        const garantiaData = await garantiaResponse.json();
        const regaloData = await regaloResponse.json();
        const condicionData = await condicionResponse.json();

        setGarantias(garantiaData);
        setRegalos(regaloData);
        setCondiciones(condicionData);
        fetchVariaciones();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(prev => ({...prev, initialData: false}));
      }
    };

    fetchInitialData();
  }, [itemId]);

  const fetchVariaciones = async () => {
    try {
      setLoading(prev => ({...prev, list: true}));
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const response = await fetch(`${API_URL}/listar_variaciones_x_item/${itemId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener las variaciones');
      }

      const data = await response.json();
      setVariaciones(data.variaciones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, list: false}));
    }
  };

  const handleOpenDeleteModal = (variacion) => {
    setCurrentVariacion(variacion);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
    setCurrentVariacion(null);
  };

  const handleOpenEditModal = (variacion) => {
    setCurrentVariacion(variacion);
    setEditFormData({
      color: variacion.color,
      modelo: variacion.modelo,
      ubicacion: variacion.ubicacion || '',
      precio: variacion.precio,
      cantidad: variacion.cantidad,
      imagen: null,
      garantia: variacion.garantia?.id || '',
      regalo: Array.isArray(variacion.regalo)
        ? variacion.regalo
        : variacion.regalos
        ? variacion.regalos.map((r) => r.id)
        : variacion.regalo
        ? [variacion.regalo]
        : [],
      condicion: variacion.condicion_detalle?.id || '',
      comision: variacion.comision || '0.00'
    });
    setPreviewImage(variacion.imagen || '');
    setImageFile(null);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setCurrentVariacion(null);
    setPreviewImage('');
    setImageFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'regalo' ? value : value
    }));
  };

  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(prev => ({...prev, submitting: true}));
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('color', editFormData.color);
      formDataToSend.append('modelo', editFormData.modelo);
      formDataToSend.append('ubicacion', editFormData.ubicacion);
      formDataToSend.append('precio', editFormData.precio);
      formDataToSend.append('cantidad', editFormData.cantidad);
      formDataToSend.append('comision', editFormData.comision);
      formDataToSend.append('upc', editFormData.upc);
      
      // Agregar garantía, regalo y condición solo si tienen valor
      if (editFormData.garantia) {
        formDataToSend.append('garantia', editFormData.garantia);
      }
      
      if (editFormData.regalo && editFormData.regalo.length) {
        editFormData.regalo.forEach((id) => formDataToSend.append('regalo', id));
      }
      
      if (editFormData.condicion) {
        formDataToSend.append('condicion', editFormData.condicion);
      }
      
      if (imageFile) {
        formDataToSend.append('imagen', imageFile);
      }

      const response = await fetch(`${API_URL}/editar_detalle_variacion/${currentVariacion.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la variación');
      }

      setSuccess('Variación actualizada correctamente');
      fetchVariaciones();
      handleCloseEditModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  const handleDeleteVariacion = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/eliminar_variacion/${currentVariacion.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la variación');
      }

      setSuccess('Variación eliminada correctamente');
      fetchVariaciones();
      handleCloseDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin-item')}
                className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowBackIcon className="text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Variaciones del Producto: {variaciones[0]?.item_info?.nombre || 'Producto'}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2">
                  <Chip 
                    label={`ID: ${itemId}`} 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                  <Chip 
                    label={`Precio base: $${variaciones[0]?.item_info?.precio_base || '0.00'}`} 
                    color="secondary" 
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                  <Chip 
                    label={`Total items: ${variaciones[0]?.item_info?.total_item || '0'}`} 
                    color="info" 
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/crear-variacion/${itemId}`)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddCircleIcon className="text-white" />
              <span>Nueva Variación</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando variaciones...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tabla responsive */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Color / SKU
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Ubicacion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Precio/Precio con Descuento
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Condición / Comisión
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Garantía / Regalo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variaciones.length > 0 ? (
                    variaciones.map((variacion, index) => (
                      <tr key={variacion.id} className={`hover:bg-orange-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <Avatar 
                            src={variacion.imagen || ''} 
                            variant="rounded"
                            sx={{ width: 56, height: 56 }}
                            className="shadow-md"
                          >
                            {!variacion.imagen && variacion.color?.charAt(0)}
                          </Avatar>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: variacion.color?.toLowerCase() || 'gray' }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{variacion.color}</div>
                              <div className="text-sm text-gray-500">ID: {variacion.id}</div>
                              {variacion.upc && (
                                <div className="text-xs text-gray-400 mt-1 font-mono">
                                  SKU: {variacion.upc}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{variacion.modelo || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{variacion.ubicacion || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-[#FF6B00]">${variacion.precio} / {variacion.precio_post_descuento}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{variacion.cantidad}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            {variacion.condicion_detalle ? (
                              <Tooltip title="Condición">
                                <Chip
                                  icon={<GradeIcon />}
                                  label={variacion.condicion_detalle.nombre}
                                  color="warning"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 'medium' }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Sin condición especificada">
                                <Chip
                                  icon={<GradeIcon />}
                                  label="Sin condición"
                                  color="default"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 'medium' }}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Comisión">
                              <Chip
                                icon={<AttachMoneyIcon />}
                                label={`${variacion.comision}%`}
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Tooltip>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            {variacion.garantia ? (
                              <Tooltip title="Garantía">
                                <Chip
                                  icon={<AssignmentReturnIcon />}
                                  label={variacion.garantia.tiempo}
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
                            {variacion.regalo ? (
                              <Tooltip title="Regalo incluido">
                                <Chip
                                  icon={<LocalOfferIcon />}
                                  label={variacion.regalo_nombre}
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
                        <td className="px-6 py-4">
                          <Chip 
                            label={variacion.estado ? 'Activo' : 'Inactivo'} 
                            color={variacion.estado ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Tooltip title="Editar">
                              <button
                                onClick={() => handleOpenEditModal(variacion)}
                                className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <button
                                onClick={() => handleOpenDeleteModal(variacion)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-16">
                        <div className="text-center">
                          <div className="text-gray-400 mb-4">
                            <AddCircleIcon sx={{ fontSize: 64 }} />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay variaciones</h3>
                          <p className="text-gray-500 mb-6">Crea la primera variación para este producto</p>
                          <button 
                            onClick={() => navigate(`/crear-variacion/${itemId}`)}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                          >
                            Crear Variación
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Eliminación estilizado */}
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
              ¿Estás seguro que deseas eliminar la variación <strong>"{currentVariacion?.color} - {currentVariacion?.modelo}"</strong>?
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
              onClick={handleDeleteVariacion}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200"
            >
              Eliminar
            </button>
          </DialogActions>
        </Dialog>

        {/* Modal de Edición estilizado */}
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
            <h2 className="text-2xl font-bold text-gray-900">Editar Variación</h2>
            <p className="text-gray-500 text-sm mt-1">Actualiza la información de la variación</p>
          </DialogTitle>
          
          <form onSubmit={handleEditSubmit}>
            <DialogContent className="space-y-4">
              {/* Sección de imagen */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <Avatar 
                  src={previewImage || ''} 
                  variant="rounded"
                  sx={{ width: 80, height: 80 }}
                  className="shadow-md"
                >
                  {!previewImage && currentVariacion?.color?.charAt(0)}
                </Avatar>
                <div className="flex-1">
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="edit-variation-image"
                    type="file"
                    onChange={handleEditImageChange}
                  />
                  <label htmlFor="edit-variation-image">
                    <button
                      type="button"
                      onClick={() => document.getElementById('edit-variation-image').click()}
                      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                    >
                      <CloudUploadIcon sx={{ fontSize: 16 }} />
                      <span>Cambiar Imagen</span>
                    </button>
                  </label>
                  {imageFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Archivo seleccionado: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Campos del formulario */}
              <TextField
                label="Color"
                name="color"
                value={editFormData.color}
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
                label="Modelo"
                name="modelo"
                value={editFormData.modelo}
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
                label="Ubicacion"
                name="ubicacion"
                value={editFormData.ubicacion}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                placeholder="Ej: Rojo, vitrina 1, caja A"
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

              {/* Campo UPC */}
              <TextField
                label="SKU (C�digo de Barras)"
                name="upc"
                value={editFormData.upc}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                placeholder="Ingrese el c�digo SKU"
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
                  label="Precio"
                  name="precio"
                  type="number"
                  value={editFormData.precio}
                  onChange={handleEditChange}
                  fullWidth
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
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
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  value={editFormData.cantidad}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Comisión (%)"
                  name="comision"
                  type="number"
                  value={editFormData.comision}
                  onChange={handleEditChange}
                  fullWidth
                  required
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100, step: "0.01" }
                  }}
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

                <FormControl fullWidth margin="normal">
                  <InputLabel>Condición</InputLabel>
                  <Select
                    name="condicion"
                    value={editFormData.condicion}
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
                    {condiciones.map(condicion => (
                      <MenuItem key={condicion.id} value={condicion.id}>
                        {condicion.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* Selectores para Garantía y Regalo */}
              <div className="grid grid-cols-2 gap-4">
                <FormControl fullWidth margin="normal">
                  <InputLabel>Garantía</InputLabel>
                  <Select
                    name="garantia"
                    value={editFormData.garantia}
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
                    {garantias.map(garantia => (
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
                    multiple
                    value={editFormData.regalo}
                    onChange={handleEditChange}
                    label="Regalo"
                    renderValue={(selected) =>
                      selected.map((id) => regalos.find((r) => r.id === id)?.nombre || id).join(', ')
                    }
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
                    {regalos.map(regalo => (
                      <MenuItem key={regalo.id} value={regalo.id}>
                        {regalo.nombre}
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
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                disabled={loading.submitting}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon sx={{ fontSize: 16 }} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Notificaciones estilizadas */}
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

export default AdminVariacionPage;
