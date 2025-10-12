import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  IconButton,
  Avatar,
  Box,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AdminItemImagesPage = () => {
  const { id } = useParams(); // Obtenemos el ID del producto de la URL
  const [productName, setProductName] = useState('Producto #' + id); // Nombre temporal hasta cargar
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState({
    images: true,
    submitting: false,
    deleting: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Obtener token de autenticación
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Obtener las imágenes del producto
  const fetchImages = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, images: true }));
    setError(null);

    try {
      // Solo obtenemos las imágenes ya que el nombre del producto lo mostramos del ID
      const response = await fetch(`https://videojuegoshabana.com/api/listar_imagen/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status} al obtener imágenes`);
      }

      const data = await response.json();
      
      if (!data.imagenes) {
        throw new Error('Formato de respuesta inesperado');
      }

      setImages(data.imagenes);
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, images: false }));
    }
  };

  useEffect(() => {
    fetchImages();
  }, [id]);

  // Subir nueva imagen
  const handleUploadImage = async () => {
    if (!imageFile) return;
    if (images.length >= 5) {
      setError('Límite de 5 imágenes alcanzado');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('imagen', imageFile);

      const response = await fetch(`https://videojuegoshabana.com/api/subir_imagen/${id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir imagen');
      }

      setSuccess('Imagen subida correctamente');
      setImageFile(null);
      await fetchImages(); // Refrescar lista
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Eliminar imagen
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    const token = getAuthToken();
    if (!token) return;

    setLoading(prev => ({ ...prev, deleting: true }));
    setError(null);

    try {
      const response = await fetch(`https://videojuegoshabana.com/api/eliminar_imagen/${imageToDelete}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar imagen');
      }

      setSuccess('Imagen eliminada correctamente');
      setOpenDeleteModal(false);
      setImageToDelete(null);
      await fetchImages(); // Refrescar lista
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Cerrar notificaciones
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.paper', p: 3 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 1, 
          p: 3, 
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigate('/admin-item')}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" fontWeight="bold">
                Gestión de Imágenes
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Producto ID: {id}
            </Typography>
          </Box>
          <Chip 
            label={`${images.length}/5 imágenes`} 
            color={images.length >= 5 ? 'error' : 'primary'}
            variant="outlined"
          />
        </Box>

        {/* Contenido principal */}
        {loading.images ? (
          <Box sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: 1, 
            p: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            <Typography variant="body1" color="text.secondary">
              Cargando imágenes...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: 1, 
            p: 3
          }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button 
              onClick={fetchImages}
              variant="outlined"
              color="error"
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Subir nueva imagen */}
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              boxShadow: 1, 
              p: 3
            }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Agregar nueva imagen
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2,
                alignItems: 'center'
              }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="upload-image"
                  type="file"
                  onChange={handleFileChange}
                  disabled={images.length >= 5 || loading.submitting}
                />
                <label htmlFor="upload-image" style={{ width: '100%' }}>
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={images.length >= 5 || loading.submitting}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      py: 1.5
                    }}
                  >
                    Seleccionar Imagen
                  </Button>
                </label>
                
                {imageFile && (
                  <Box sx={{ 
                    flex: 1, 
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Avatar 
                      src={URL.createObjectURL(imageFile)} 
                      variant="rounded"
                      sx={{ width: 40, height: 40 }}
                    />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {imageFile.name}
                    </Typography>
                  </Box>
                )}
                
                <Button
                  onClick={handleUploadImage}
                  disabled={!imageFile || loading.submitting || images.length >= 5}
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    py: 1.5
                  }}
                >
                  {loading.submitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Subiendo...
                    </>
                  ) : (
                    'Subir Imagen'
                  )}
                </Button>
              </Box>
              {images.length >= 5 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Límite de 5 imágenes alcanzado. Elimina alguna para agregar nuevas.
                </Typography>
              )}
            </Box>

            {/* Lista de imágenes */}
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              boxShadow: 1, 
              p: 3
            }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Imágenes del producto ({images.length})
              </Typography>
              
              {images.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Typography variant="body1" color="text.secondary">
                    Este producto no tiene imágenes aún
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                  gap: 2
                }}>
                  {images.map((image) => (
                    <Box key={image.id} sx={{ 
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover .image-actions': {
                        opacity: 1
                      }
                    }}>
                      <Box
                        component="img"
                        src={image.imagen}
                        alt={`Imagen ${image.id}`}
                        sx={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=Imagen+no+disponible';
                        }}
                      />
                      <Box className="image-actions" sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}>
                        <Tooltip title="Eliminar imagen">
                          <IconButton
                            onClick={() => {
                              setImageToDelete(image.id);
                              setOpenDeleteModal(true);
                            }}
                            sx={{
                              bgcolor: 'error.main',
                              color: 'common.white',
                              '&:hover': {
                                bgcolor: 'error.dark'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Modal de confirmación para eliminar */}
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
            <Typography variant="h6" fontWeight="bold">
              Confirmar Eliminación
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1">
              ¿Estás seguro que deseas eliminar esta imagen?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 2, pt: 0 }}>
            <Button
              onClick={() => setOpenDeleteModal(false)}
              disabled={loading.deleting}
              variant="outlined"
              sx={{
                borderRadius: 1,
                px: 3
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteImage}
              disabled={loading.deleting}
              variant="contained"
              color="error"
              sx={{
                borderRadius: 1,
                px: 3
              }}
            >
              {loading.deleting ? (
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              Eliminar
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
              borderRadius: 1,
              boxShadow: 3
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
              borderRadius: 1,
              boxShadow: 3
            }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminItemImagesPage;