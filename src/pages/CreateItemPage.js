import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, CircularProgress, Alert, Snackbar, Box, Select, MenuItem, InputLabel, FormControl, Chip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import NewProductAlert from '../components/NewProductAlert ';

const CreateItemPage = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: 0,
        cantidad: 0,
        costo: 0,
        sub_categoria: [],
        descuento: 0,
        imagenes_upload: [],
        garantia: '',
        regalo: '',
        condicion: '',
        comision: 0,
        video: null,
        ubicacion: '',
        upc: '' // Nuevo campo agregado
    });
    const [previews, setPreviews] = useState([]);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [subCategorias, setSubCategorias] = useState([]);
    const [garantias, setGarantias] = useState([]);
    const [regalos, setRegalos] = useState([]);
    const [condiciones, setCondiciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    
    // Obtener datos del usuario del localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isSuperAdmin = userData && (userData.rol === 'Super_Administrador');

    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('No estás autenticado. Por favor inicia sesión.');
                    return;
                }

                // Obtener subcategorías
                const subCatResponse = await fetch('https://videojuegoshabana.com/api/listar_subcategoria/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Obtener garantías
                const garantiaResponse = await fetch('https://videojuegoshabana.com/api/listar_garantia/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Obtener regalos
                const regaloResponse = await fetch('https://videojuegoshabana.com/api/listar_regalo/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Obtener condiciones
                const condicionResponse = await fetch('https://videojuegoshabana.com/api/listar_condicion/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!subCatResponse.ok || !garantiaResponse.ok || !regaloResponse.ok || !condicionResponse.ok) {
                    throw new Error('Error al obtener datos iniciales');
                }

                const subCatData = await subCatResponse.json();
                const garantiaData = await garantiaResponse.json();
                const regaloData = await regaloResponse.json();
                const condicionData = await condicionResponse.json();

                setSubCategorias(subCatData);
                setGarantias(garantiaData);
                setRegalos(regaloData);
                setCondiciones(condicionData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        obtenerDatosIniciales();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (formData.imagenes_upload.length + files.length > 5) {
            setError('Solo puedes subir un máximo de 5 imágenes');
            return;
        }

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setFormData({
            ...formData,
            imagenes_upload: [...formData.imagenes_upload, ...files]
        });

        setPreviews([...previews, ...newImages]);
    };

    const handleRemoveImage = (index) => {
        const newImages = [...formData.imagenes_upload];
        newImages.splice(index, 1);
        
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index].preview);
        newPreviews.splice(index, 1);

        setFormData({
            ...formData,
            imagenes_upload: newImages
        });
        
        setPreviews(newPreviews);
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Validar tamaño del video (50MB máximo)
        if (file.size > 50 * 1024 * 1024) {
            setError('El video no puede pesar más de 50MB');
            return;
        }
        
        // Crear vista previa y obtener duración
        const videoUrl = URL.createObjectURL(file);
        const videoElement = document.createElement('video');
        
        videoElement.src = videoUrl;
        videoElement.onloadedmetadata = () => {
            setVideoDuration(videoElement.duration);
            
            // Validar duración del video (1 minuto máximo)
            if (videoElement.duration > 60) {
                setError('El video no puede durar más de 1 minuto');
                URL.revokeObjectURL(videoUrl);
                return;
            }
            
            setVideoPreview(videoUrl);
            setFormData({
                ...formData,
                video: file
            });
        };
    };

    const handleRemoveVideo = () => {
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }
        setVideoPreview(null);
        setVideoDuration(0);
        setFormData({
            ...formData,
            video: null
        });
    };

    const handleSubCategoriaChange = (e) => {
        setFormData({
            ...formData,
            sub_categoria: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No estás autenticado. Por favor inicia sesión.');
            }

            // Validaciones
            if (formData.sub_categoria.length === 0) {
                throw new Error('Debes seleccionar al menos una subcategoría');
            }

            if (formData.precio <= 0 || formData.cantidad < 0 || formData.costo < 0 || formData.comision < 0) {
                throw new Error('Los valores numéricos deben ser positivos');
            }

            if (formData.imagenes_upload.length === 0) {
                throw new Error('Debes subir al menos una imagen del producto');
            }

            if (!formData.condicion) {
                throw new Error('Debes seleccionar una condición para el producto');
            }

            // Validación adicional para el video si existe
            if (formData.video) {
                if (formData.video.size > 50 * 1024 * 1024) {
                    throw new Error('El video no puede pesar más de 50MB');
                }
                
                if (videoDuration > 60) {
                    throw new Error('El video no puede durar más de 1 minuto');
                }
            }

            const data = new FormData();
            data.append('nombre', formData.nombre);
            data.append('descripcion', formData.descripcion);
            data.append('precio', formData.precio);
            data.append('cantidad', formData.cantidad);
            data.append('costo', formData.costo);
            data.append('descuento', formData.descuento);
            data.append('comision', formData.comision);
            data.append('condicion', formData.condicion);
            data.append('ubicacion', formData.ubicacion);
            data.append('upc', formData.upc); // Agregar el campo UPC al FormData
            
            // Agregar video si existe
            if (formData.video) {
                data.append('video', formData.video);
            }
            
            // Solo agregar garantía y regalo si tienen valor
            if (formData.garantia) {
                data.append('garantia', formData.garantia);
            }
            
            if (formData.regalo) {
                data.append('regalo', formData.regalo);
            }
            
            formData.sub_categoria.forEach(id => {
                data.append('sub_categoria', id);
            });
            
            formData.imagenes_upload.forEach((file, index) => {
                data.append(`imagenes_upload`, file);
            });

            const response = await fetch('https://videojuegoshabana.com/api/crear_item/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Error al crear el producto');
            }

            // Enviar notificación SOLO con los datos requeridos
            await NewProductAlert.sendNewProductNotification({
                nombre: formData.nombre,
                precio: formData.precio,
                comision: formData.comision,
                descuento: formData.descuento,
                descripcion: formData.descripcion
            });

            setSuccess(true);
            // Resetear formulario
            setFormData({
                nombre: '',
                descripcion: '',
                precio: 0,
                cantidad: 0,
                costo: 0,
                sub_categoria: [],
                descuento: 0,
                imagenes_upload: [],
                garantia: '',
                regalo: '',
                condicion: '',
                comision: 0,
                video: null,
                ubicacion: '',
                upc: '' // Resetear el campo UPC también
            });
            setPreviews([]);
            setVideoPreview(null);
            setVideoDuration(0);
            
            setTimeout(() => {
                navigate('/admin-item');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            precio: 0,
            cantidad: 0,
            costo: 0,
            sub_categoria: [],
            descuento: 0,
            imagenes_upload: [],
            garantia: '',
            regalo: '',
            condicion: '',
            comision: 0,
            video: null,
            ubicacion: '',
            upc: '' // Limpiar el campo UPC también
        });
        setPreviews([]);
        setVideoPreview(null);
        setVideoDuration(0);
    };

    const handleCloseAlert = () => {
        setError('');
        setSuccess(false);
    };

    const textFieldStyles = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#fef7ed',
            '& fieldset': {
                borderColor: '#e5e7eb'
            },
            '&:hover fieldset': {
                borderColor: '#fb923c'
            },
            '&.Mui-focused fieldset': {
                borderColor: '#f97316',
                borderWidth: '2px'
            }
        },
        '& .MuiInputLabel-root': {
            fontSize: '14px',
            color: '#6b7280',
            '&.Mui-focused': {
                color: '#f97316'
            }
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-orange-400">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Crear Nuevo Producto
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona los productos de tu tienda
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/admin-item')}
                            sx={{
                                backgroundColor: '#000000',
                                color: '#ffffff',
                                borderRadius: '6px',
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '8px 16px',
                                '&:hover': {
                                    backgroundColor: '#1f2937'
                                }
                            }}
                        >
                            + Volver
                        </Button>
                    </div>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-400">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Información Básica
                            </h3>
                            
                            <TextField
                                label="Nombre del Producto"
                                variant="outlined"
                                fullWidth
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Ingresa el nombre del producto"
                                sx={textFieldStyles}
                            />
                            
                            <TextField
                                label="SKU (Código UPC)"
                                variant="outlined"
                                fullWidth
                                name="upc"
                                value={formData.upc}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Ingresa el código SKU/UPC del producto"
                                inputProps={{ maxLength: 50 }}
                                helperText={`${formData.upc.length}/50 caracteres`}
                                sx={textFieldStyles}
                            />
                            
                            <TextField
                                label="Descripción"
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={4}
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Describe tu producto"
                                sx={textFieldStyles}
                            />

                            <TextField
                                label="Ubicación (opcional)"
                                variant="outlined"
                                fullWidth
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="Ej: Almacén central, Pasillo 3"
                                sx={textFieldStyles}
                            />
                        </div>

                        {/* Información de Precios y Stock */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Precios y Stock
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <TextField
                                    label="Precio"
                                    variant="outlined"
                                    type="number"
                                    name="precio"
                                    value={formData.precio}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, step: "0.01" }}
                                    required
                                    disabled={loading}
                                    sx={textFieldStyles}
                                />
                                
                                <TextField
                                    label="Cantidad en Stock"
                                    variant="outlined"
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    inputProps={{ min: 0 }}
                                    required
                                    disabled={loading}
                                    sx={textFieldStyles}
                                />
                                {isSuperAdmin && (
                                <TextField
                                    label="Costo"
                                    variant="outlined"
                                    type="number"
                                    name="costo"
                                    value={formData.costo}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, step: "0.01" }}
                                    required
                                    disabled={loading}
                                    sx={textFieldStyles}
                                />
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField
                                    label="Descuento (%)"
                                    variant="outlined"
                                    type="number"
                                    fullWidth
                                    name="descuento"
                                    value={formData.descuento}
                                    onChange={handleChange}
                                    inputProps={{ min: 0 }}
                                    disabled={loading}
                                    sx={textFieldStyles}
                                />
                                
                                <TextField
                                    label="Comisión (%)"
                                    variant="outlined"
                                    type="number"
                                    fullWidth
                                    name="comision"
                                    value={formData.comision}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, max: 100 }}
                                    required
                                    disabled={loading}
                                    sx={textFieldStyles}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                                        Garantía
                                    </InputLabel>
                                    <Select
                                        name="garantia"
                                        value={formData.garantia}
                                        onChange={handleChange}
                                        disabled={loading}
                                        sx={{
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#fef7ed',
                                            '& fieldset': {
                                                borderColor: '#e5e7eb'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#fb923c'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#f97316',
                                                borderWidth: '2px'
                                            }
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

                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                                        Regalo
                                    </InputLabel>
                                    <Select
                                        name="regalo"
                                        value={formData.regalo}
                                        onChange={handleChange}
                                        disabled={loading}
                                        sx={{
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#fef7ed',
                                            '& fieldset': {
                                                borderColor: '#e5e7eb'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#fb923c'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#f97316',
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>Ninguno</em>
                                        </MenuItem>
                                        {regalos.map(regalo => (
                                            <MenuItem key={regalo.id} value={regalo.id}>
                                                {regalo.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                        </div>

                        {/* Categorización y Condición */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Categorización y Condición
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                                        Subcategorías *
                                    </InputLabel>
                                    <Select
                                        multiple
                                        name="sub_categoria"
                                        value={formData.sub_categoria}
                                        onChange={handleSubCategoriaChange}
                                        required
                                        disabled={loading}
                                        sx={{
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#fef7ed',
                                            '& fieldset': {
                                                borderColor: '#e5e7eb'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#fb923c'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#f97316',
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        {subCategorias.map(subCat => (
                                            <MenuItem key={subCat.id} value={subCat.id}>
                                                {subCat.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#f97316' } }}>
                                        Condición *
                                    </InputLabel>
                                    <Select
                                        name="condicion"
                                        value={formData.condicion}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        sx={{
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#fef7ed',
                                            '& fieldset': {
                                                borderColor: '#e5e7eb'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#fb923c'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#f97316',
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        {condiciones.map(condicion => (
                                            <MenuItem key={condicion.id} value={condicion.id}>
                                                {condicion.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                        </div>

                        {/* Imagen del Producto */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Imágenes del Producto (Máximo 5)
                            </h3>
                            
                            <Box className="space-y-4">
                                <div>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="item-images"
                                        type="file"
                                        onChange={handleFileChange}
                                        disabled={loading || formData.imagenes_upload.length >= 5}
                                        multiple
                                    />
                                    <label htmlFor="item-images">
                                        <Button
                                            variant="contained"
                                            component="span"
                                            startIcon={<CloudUploadIcon />}
                                            disabled={loading || formData.imagenes_upload.length >= 5}
                                            sx={{
                                                backgroundColor: '#f97316',
                                                color: '#ffffff',
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                padding: '10px 20px',
                                                '&:hover': {
                                                    backgroundColor: '#ea580c'
                                                },
                                                '&:disabled': {
                                                    backgroundColor: '#9ca3af',
                                                    color: '#ffffff'
                                                }
                                            }}
                                        >
                                            {formData.imagenes_upload.length >= 5 ? 
                                                'Límite alcanzado' : 
                                                'Seleccionar Imágenes'}
                                        </Button>
                                    </label>
                                    <span className="ml-3 text-sm text-gray-500">
                                        {formData.imagenes_upload.length} / 5 imágenes seleccionadas
                                    </span>
                                </div>
                                
                                {previews.length > 0 && (
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <p className="text-sm text-gray-600 mb-3 font-medium">Vista previa:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {previews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img 
                                                        src={preview.preview} 
                                                        alt={`Preview ${index + 1}`} 
                                                        className="h-32 w-full object-cover rounded-lg border-2 border-orange-300 shadow-sm"
                                                    />
                                                    <Chip
                                                        label="Eliminar"
                                                        onDelete={() => handleRemoveImage(index)}
                                                        deleteIcon={<DeleteIcon />}
                                                        color="error"
                                                        size="small"
                                                        className="absolute top-2 right-2"
                                                        sx={{
                                                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                            color: 'white',
                                                            '& .MuiChip-deleteIcon': {
                                                                color: 'white',
                                                                fontSize: '16px'
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Box>
                        </div>

                        {/* Video del Producto */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Video del Producto (Opcional)
                            </h3>
                            
                            <Box className="space-y-4">
                                <div>
                                    <input
                                        accept="video/*"
                                        style={{ display: 'none' }}
                                        id="item-video"
                                        type="file"
                                        onChange={handleVideoChange}
                                        disabled={loading || !!formData.video}
                                    />
                                    <label htmlFor="item-video">
                                        <Button
                                            variant="contained"
                                            component="span"
                                            startIcon={<VideocamIcon />}
                                            disabled={loading || !!formData.video}
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
                                            {formData.video ? 
                                                'Video seleccionado' : 
                                                'Seleccionar Video'}
                                        </Button>
                                    </label>
                                    {formData.video && (
                                        <span className="ml-3 text-sm text-gray-500">
                                            {Math.round(formData.video.size / (1024 * 1024))}MB • 
                                            {videoDuration > 0 && ` ${Math.round(videoDuration)} segundos`}
                                        </span>
                                    )}
                                </div>
                                
                                {videoPreview && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm text-gray-600 mb-3 font-medium">Vista previa del video:</p>
                                        <div className="relative">
                                            <video 
                                                src={videoPreview} 
                                                controls
                                                className="w-full max-h-64 object-contain rounded-lg border-2 border-blue-300 shadow-sm"
                                            />
                                            <Chip
                                                label="Eliminar"
                                                onDelete={handleRemoveVideo}
                                                deleteIcon={<DeleteIcon />}
                                                color="error"
                                                size="small"
                                                className="absolute top-2 right-2"
                                                sx={{
                                                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                    color: 'white',
                                                    '& .MuiChip-deleteIcon': {
                                                        color: 'white',
                                                        fontSize: '16px'
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Formatos aceptados: MP4, MOV, AVI. Máximo 50MB y 1 minuto de duración.
                                        </p>
                                    </div>
                                )}
                            </Box>
                        </div>

                        {/* Botones */}
                        <div className="flex space-x-3 pt-6">
                            <Button
                                type="submit"
                                disabled={loading || !formData.nombre || formData.sub_categoria.length === 0 || formData.imagenes_upload.length === 0 || !formData.condicion}
                                sx={{
                                    backgroundColor: '#000000',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    padding: '10px 20px',
                                    minWidth: '140px',
                                    '&:hover': {
                                        backgroundColor: '#1f2937'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#9ca3af',
                                        color: '#ffffff'
                                    }
                                }}
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                                        Creando...
                                    </>
                                ) : (
                                    'CREAR PRODUCTO'
                                )}
                            </Button>

                            <Button
                                type="button"
                                onClick={handleClear}
                                disabled={loading}
                                sx={{
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    padding: '10px 20px',
                                    '&:hover': {
                                        backgroundColor: '#dc2626'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#9ca3af',
                                        color: '#ffffff'
                                    }
                                }}
                            >
                                Limpiar
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Notificaciones */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
                    ¡Producto creado exitosamente!
                </Alert>
            </Snackbar>
        </div>
    );
};

export default CreateItemPage;
