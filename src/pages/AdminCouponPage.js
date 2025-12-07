import { useState, useEffect } from 'react';
import { 
  Button, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import { API_URL } from '../config/apiConfig';
// Componente auxiliar para mostrar valores monetarios
const CurrencyValue = ({ value }) => {
  const numValue = Number(value) || 0;
  return <span>${numValue.toFixed(2)}</span>;
};

const AdminCouponPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState({
    list: true,
    clients: true,
    submitting: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cifra: '',
    cliente: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No estás autenticado. Por favor inicia sesión.');
        return;
      }

      try {
        // Obtener clientes
        const clientsResponse = await fetch(`${API_URL}/listar_cliente_all/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!clientsResponse.ok) {
          throw new Error('Error al obtener los clientes');
        }

        const clientsData = await clientsResponse.json();
        setClients(clientsData);

        // Obtener cupones
        const couponsResponse = await fetch(`${API_URL}/listar_cupon/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!couponsResponse.ok) {
          throw new Error('Error al obtener los cupones');
        }

        const couponsData = await couponsResponse.json();
        // Asegurarnos que cifra es un número válido
        const processedCoupons = couponsData.map(coupon => ({
          ...coupon,
          cifra: Number(coupon.cifra) || 0 // Conversión segura a número
        }));
        setCoupons(processedCoupons);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading({
          list: false,
          clients: false,
          submitting: false
        });
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOpenDeleteModal = (coupon) => {
    setCurrentCoupon(coupon);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
    setCurrentCoupon(null);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      nombre: '',
      cifra: '',
      cliente: ''
    });
    setOpenCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({...prev, submitting: true}));
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No estás autenticado. Por favor inicia sesión.');
      return;
    }

    try {
      // Validaciones
      if (!formData.nombre || !formData.cifra || !formData.cliente) {
        throw new Error('Todos los campos son requeridos');
      }

      if (isNaN(formData.cifra) || parseFloat(formData.cifra) <= 0) {
        throw new Error('La cifra debe ser un número positivo');
      }

      const response = await fetch(`${API_URL}/crear_cupon/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          cifra: parseFloat(formData.cifra),
          cliente: parseInt(formData.cliente)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el cupón');
      }

      setSuccess('Cupón creado correctamente');
      
      // Refrescar la lista de cupones
      const couponsResponse = await fetch(`${API_URL}/listar_cupon/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        const processedCoupons = couponsData.map(coupon => ({
          ...coupon,
          cifra: Number(coupon.cifra) || 0
        }));
        setCoupons(processedCoupons);
      }

      handleCloseCreateModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({...prev, submitting: false}));
    }
  };

  const handleDeleteCoupon = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !currentCoupon) return;

    try {
      const response = await fetch(`${API_URL}/eliminar_cupon/${currentCoupon.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el cupón');
      }

      setSuccess('Cupón eliminado correctamente');
      setCoupons(coupons.filter(c => c.id !== currentCoupon.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.username} (${client.correo})` : 'Cliente no encontrado';
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administración de Cupones</h1>
              <p className="text-gray-600">Gestiona los cupones de descuento para clientes</p>
            </div>
            <button 
              onClick={handleOpenCreateModal}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <AddIcon className="text-white" />
              <span>Nuevo Cupón</span>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        {loading.list ? (
          <div className="bg-white rounded-2xl shadow-lg p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando cupones...</p>
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
            {/* Tabla responsive */}
            <TableContainer component={Paper}>
              <Table className="min-w-full">
                <TableHead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableRow>
                    <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Nombre
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Descuento
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Cliente
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <TableRow 
                        key={coupon.id} 
                        className="hover:bg-orange-50 transition-colors duration-200"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <LocalOfferIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{coupon.nombre}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            <CurrencyValue value={coupon.cifra} />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Chip 
                            label={getClientName(coupon.cliente)}
                            color="primary"
                            size="small"
                            sx={{ 
                              fontWeight: 'medium',
                              backgroundColor: '#3B82F6',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleOpenDeleteModal(coupon)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                          <LocalOfferIcon sx={{ fontSize: 64 }} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cupones</h3>
                        <p className="text-gray-500 mb-6">Crea tu primer cupón para un cliente</p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                        >
                          <AddIcon sx={{ fontSize: 16 }} />
                          <span>Crear Cupón</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {/* Modal para crear cupón */}
        <Dialog 
          open={openCreateModal} 
          onClose={handleCloseCreateModal} 
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
            <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Cupón</h2>
            <p className="text-gray-500 text-sm mt-1">Agrega un nuevo cupón de descuento</p>
          </DialogTitle>
          
          <form onSubmit={handleSubmit}>
            <DialogContent className="space-y-4">
              <TextField
                label="Nombre del Cupón"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                placeholder="Ej: Descuento de verano, Promo Black Friday..."
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
                label="Valor del Descuento ($)"
                name="cifra"
                type="number"
                value={formData.cifra}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <span className="text-gray-500 mr-2">$</span>
                  ),
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
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  required
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
                  {loading.clients ? (
                    <MenuItem disabled>Cargando clientes...</MenuItem>
                  ) : (
                    clients.map(client => (
                      <MenuItem key={client.id} value={client.id.toString()}>
                        {client.username} ({client.correo})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </DialogContent>
            
            <DialogActions className="p-6 pt-2">
              <Button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={loading.submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading.submitting}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading.submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Cupón</span>
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Modal de eliminación */}
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
            <h2 className="text-2xl font-bold text-red-600">Confirmar Eliminación</h2>
            <p className="text-gray-500 text-sm mt-1">Esta acción no se puede deshacer</p>
          </DialogTitle>
          <DialogContent className="text-center py-6">
            {currentCoupon && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <DeleteIcon className="text-red-600" sx={{ fontSize: 32 }} />
                </div>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar el cupón <strong>"{currentCoupon.nombre}"</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Descuento: <CurrencyValue value={currentCoupon.cifra} /> - Cliente: {getClientName(currentCoupon.cliente)}
                </p>
              </div>
            )}
          </DialogContent>
          <DialogActions className="p-6 pt-2">
            <Button
              onClick={handleCloseDeleteModal}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCoupon}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
              <span>Eliminar</span>
            </Button>
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

export default AdminCouponPage;