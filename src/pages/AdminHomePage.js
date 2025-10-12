import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Save, X, FileImage } from 'lucide-react';

const AdminHomePage = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editLabel, setEditLabel] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [uploading, setUploading] = useState({ hero: false, place: false });
  const token = localStorage.getItem('authToken');

  // Obtener datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://videojuegoshabana.com/api/listar_homepage/');
        const data = await response.json();
        setHomeData(data[0]); // Tomamos el primer elemento del array
        setNewLabel(data[0]?.etiqueta || '');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para actualizar la etiqueta
  const updateLabel = async () => {
    try {
      const response = await fetch('https://videojuegoshabana.com/api/editar_etiqueta/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ etiqueta: newLabel }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la etiqueta');
      }

      const updatedData = { ...homeData, etiqueta: newLabel };
      setHomeData(updatedData);
      setEditLabel(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la etiqueta');
    }
  };

  // Función para eliminar imagen del HeroCarousel
  const deleteHeroImage = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta imagen?')) {
      try {
        const response = await fetch(`https://videojuegoshabana.com/api/eliminar_actualizar_herocarusel/${id}/`, {
           headers: {
          'Authorization': `Bearer ${token}`
          },
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Error al eliminar la imagen');
        }

        // Actualizar el estado eliminando la imagen
        const updatedHeroImages = homeData.hero_caruseles.filter(img => img.id !== id);
        setHomeData({ ...homeData, hero_caruseles: updatedHeroImages });
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la imagen');
      }
    }
  };

  // Función para eliminar imagen del PlaceCarousel
  const deletePlaceImage = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta imagen?')) {
      try {
        const response = await fetch(`https://videojuegoshabana.com/api/eliminar_actualizar_placecarusel/${id}/`, {
          headers: {
          'Authorization': `Bearer ${token}`
          },  
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Error al eliminar la imagen');
        }

        // Actualizar el estado eliminando la imagen
        const updatedPlaceImages = homeData.place_caruseles.filter(img => img.id !== id);
        setHomeData({ ...homeData, place_caruseles: updatedPlaceImages });
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la imagen');
      }
    }
  };

  // Función para manejar la subida de nueva imagen al HeroCarousel
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);

    setUploading({ ...uploading, hero: true });

    try {
      const response = await fetch('https://videojuegoshabana.com/api/crear_herocarusel/', {
        headers: {
          'Authorization': `Bearer ${token}`
          },
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const newImage = await response.json();
      setHomeData({
        ...homeData,
        hero_caruseles: [...homeData.hero_caruseles, newImage]
      });
      setUploading({ ...uploading, hero: false });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir la imagen');
      setUploading({ ...uploading, hero: false });
    }
  };

  // Función para manejar la subida de nueva imagen al PlaceCarousel
  const handlePlaceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);

    setUploading({ ...uploading, place: true });

    try {
      const response = await fetch('https://videojuegoshabana.com/api/crear_placecarusel/', {
        headers: {
          'Authorization': `Bearer ${token}`
          },
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const newImage = await response.json();
      setHomeData({
        ...homeData,
        place_caruseles: [...homeData.place_caruseles, newImage]
      });
      setUploading({ ...uploading, place: false });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir la imagen');
      setUploading({ ...uploading, place: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <p className="text-xl font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-gray-600">No se encontraron datos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrar Página de Inicio</h1>
          <p className="text-gray-600">Gestiona el contenido principal de tu sitio web</p>
        </div>

        {/* Etiqueta Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                <Edit size={20} />
              </span>
              Etiqueta Principal
            </h2>
          </div>
          <div className="p-6">
            {editLabel ? (
              <div className="space-y-4">
                <textarea
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Ingresa la etiqueta principal..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={updateLabel}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                  >
                    <Save size={16} className="mr-2" />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditLabel(false);
                      setNewLabel(homeData.etiqueta);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center transition-colors"
                  >
                    <X size={16} className="mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <p className="text-gray-700 leading-relaxed flex-1 mr-4">{homeData.etiqueta}</p>
                <button
                  onClick={() => setEditLabel(true)}
                  className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0"
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Carousel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
                  <FileImage size={20} />
                </span>
                Hero Carousel
                <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {homeData.hero_caruseles.length} imágenes
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {homeData.hero_caruseles.map((image) => (
                  <div key={image.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-16 h-12 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                        <img
                          src={`https://videojuegoshabana.com${image.imagen}`}
                          alt={`Hero ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Imagen Hero</p>
                        <p className="text-sm text-gray-500">ID: {image.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteHeroImage(image.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                  disabled={uploading.hero}
                />
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors ${uploading.hero ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading.hero ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                      <p className="text-green-600 font-medium">Subiendo imagen...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-green-100 text-green-600 p-3 rounded-full mb-2">
                        <Plus size={20} />
                      </div>
                      <p className="text-green-600 font-medium">Agregar nueva imagen</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG o WebP</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Place Carousel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
                  <FileImage size={20} />
                </span>
                Place Carousel
                <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {homeData.place_caruseles.length} imágenes
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {homeData.place_caruseles.map((image) => (
                  <div key={image.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="w-16 h-12 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                        <img
                          src={`https://videojuegoshabana.com${image.imagen}`}
                          alt={`Place ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Imagen Place</p>
                        <p className="text-sm text-gray-500">ID: {image.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deletePlaceImage(image.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePlaceImageUpload}
                  className="hidden"
                  disabled={uploading.place}
                />
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors ${uploading.place ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading.place ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                      <p className="text-green-600 font-medium">Subiendo imagen...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-green-100 text-green-600 p-3 rounded-full mb-2">
                        <Plus size={20} />
                      </div>
                      <p className="text-green-600 font-medium">Agregar nueva imagen</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG o WebP</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;