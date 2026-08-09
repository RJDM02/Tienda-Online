import { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, Save, FileImage } from 'lucide-react';
import { API_BASE_URL, API_URL } from '../config/apiConfig';

const emptyHomeForm = {
  etiqueta: '',
  hero_eyebrow: '',
  hero_title: '',
  hero_title_highlight: '',
  hero_subtitle: '',
  hero_primary_button_text: '',
  hero_primary_button_url: '',
  hero_secondary_button_text: '',
  hero_secondary_button_url: '',
  spotlight_status: '',
  spotlight_price: '',
  spotlight_text: '',
  ticker_items: [],
  products_eyebrow: '',
  products_title: '',
  products_link_text: '',
  products_link_url: '',
  advantages_eyebrow: '',
  advantages_title: '',
  advantages: [],
  new_eyebrow: '',
  new_title: '',
  new_meta: '',
  faq_eyebrow: '',
  faq_title: '',
  faq_intro: '',
  faqs: [],
  footer_logo: '',
  footer_copy: '',
  footer_links: [],
  footer_hours_label: '',
  footer_hours_days: '',
  footer_hours_value: '',
  footer_bottom_text: '',
  terms_title: '',
  terms_content: '',
  conditions_title: '',
  conditions_content: '',
};

const textFields = [
  ['hero_eyebrow', 'Eyebrow del hero'],
  ['hero_title', 'Titulo principal'],
  ['hero_title_highlight', 'Titulo resaltado'],
  ['hero_subtitle', 'Subtitulo del hero', 'textarea'],
  ['hero_primary_button_text', 'Texto boton principal'],
  ['hero_primary_button_url', 'URL boton principal'],
  ['hero_secondary_button_text', 'Texto boton secundario'],
  ['hero_secondary_button_url', 'URL boton secundario'],
  ['spotlight_status', 'Estado tarjeta hero'],
  ['spotlight_price', 'Precio tarjeta hero'],
  ['spotlight_text', 'Texto tarjeta hero'],
  ['products_eyebrow', 'Eyebrow productos vendidos'],
  ['products_title', 'Titulo productos vendidos'],
  ['products_link_text', 'Texto enlace tienda'],
  ['products_link_url', 'URL enlace tienda'],
  ['advantages_eyebrow', 'Eyebrow ventajas'],
  ['advantages_title', 'Titulo ventajas'],
  ['new_eyebrow', 'Eyebrow recientes'],
  ['new_title', 'Titulo recientes'],
  ['new_meta', 'Meta recientes'],
  ['faq_eyebrow', 'Eyebrow FAQ'],
  ['faq_title', 'Titulo FAQ'],
  ['faq_intro', 'Intro FAQ', 'textarea'],
  ['footer_logo', 'Logo footer'],
  ['footer_copy', 'Texto footer', 'textarea'],
  ['footer_hours_label', 'Label horario'],
  ['footer_hours_days', 'Dias horario'],
  ['footer_hours_value', 'Horas horario'],
  ['footer_bottom_text', 'Texto legal footer'],
  ['terms_title', 'Titulo terminos'],
  ['terms_content', 'Contenido terminos', 'textarea'],
  ['conditions_title', 'Titulo condiciones'],
  ['conditions_content', 'Contenido condiciones', 'textarea'],
];

const AdminHomePage = () => {
  const [homeData, setHomeData] = useState(null);
  const [form, setForm] = useState(emptyHomeForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({ hero: false, place: false });
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchData();
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/listar_homepage/`);
      const data = await response.json();
      const homepage = data?.[0] || {};
      setHomeData(homepage);
      setForm({ ...emptyHomeForm, ...homepage });
      setLoading(false);
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateArrayValue = (field, index, value) => {
    setForm((current) => {
      const next = [...(current[field] || [])];
      next[index] = value;
      return { ...current, [field]: next };
    });
  };

  const addArrayValue = (field, value) => {
    setForm((current) => ({ ...current, [field]: [...(current[field] || []), value] }));
  };

  const removeArrayValue = (field, index) => {
    setForm((current) => ({
      ...current,
      [field]: (current[field] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveHome = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/editar_etiqueta/`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el home');
      }

      const updatedData = await response.json();
      setHomeData(updatedData);
      setForm({ ...emptyHomeForm, ...updatedData });
      alert('Home actualizado correctamente');
    } catch (saveError) {
      console.error('Error:', saveError);
      alert('Error al actualizar el home');
    } finally {
      setSaving(false);
    }
  };

  const deleteHeroImage = async (id) => {
    if (!window.confirm('Estas seguro de eliminar esta imagen?')) return;

    try {
      const response = await fetch(`${API_URL}/eliminar_actualizar_herocarusel/${id}/`, {
        headers: authHeaders,
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la imagen');
      const updatedHeroImages = homeData.hero_caruseles.filter((img) => img.id !== id);
      setHomeData({ ...homeData, hero_caruseles: updatedHeroImages });
    } catch (deleteError) {
      console.error('Error:', deleteError);
      alert('Error al eliminar la imagen');
    }
  };

  const deletePlaceImage = async (id) => {
    if (!window.confirm('Estas seguro de eliminar esta imagen?')) return;

    try {
      const response = await fetch(`${API_URL}/eliminar_actualizar_placecarusel/${id}/`, {
        headers: authHeaders,
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar la imagen');
      const updatedPlaceImages = homeData.place_caruseles.filter((img) => img.id !== id);
      setHomeData({ ...homeData, place_caruseles: updatedPlaceImages });
    } catch (deleteError) {
      console.error('Error:', deleteError);
      alert('Error al eliminar la imagen');
    }
  };

  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);
    setUploading((current) => ({ ...current, [type]: true }));

    const endpoint = type === 'hero' ? 'crear_herocarusel' : 'crear_placecarusel';
    const collection = type === 'hero' ? 'hero_caruseles' : 'place_caruseles';

    try {
      const response = await fetch(`${API_URL}/${endpoint}/`, {
        headers: authHeaders,
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir la imagen');
      const newImage = await response.json();
      setHomeData((current) => ({
        ...current,
        [collection]: [...(current[collection] || []), newImage],
      }));
    } catch (uploadError) {
      console.error('Error:', uploadError);
      alert('Error al subir la imagen');
    } finally {
      setUploading((current) => ({ ...current, [type]: false }));
    }
  };

  const renderInput = ([field, label, type]) => (
    <label className="block" key={field}>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {type === 'textarea' ? (
        <textarea
          value={form[field] || ''}
          onChange={(event) => updateField(field, event.target.value)}
          rows="4"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      ) : (
        <input
          value={form[field] || ''}
          onChange={(event) => updateField(field, event.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      )}
    </label>
  );

  const renderTickerEditor = () => (
    <Section title="Ticker superior">
      {(form.ticker_items || []).map((item, index) => (
        <Row key={`ticker-${index}`} onRemove={() => removeArrayValue('ticker_items', index)}>
          <input
            value={item}
            onChange={(event) => updateArrayValue('ticker_items', index, event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </Row>
      ))}
      <AddButton onClick={() => addArrayValue('ticker_items', '')}>Agregar texto</AddButton>
    </Section>
  );

  const renderAdvantagesEditor = () => (
    <Section title="Ventajas">
      {(form.advantages || []).map((item, index) => (
        <Row key={`advantage-${index}`} onRemove={() => removeArrayValue('advantages', index)}>
          <input
            value={item.chip || ''}
            onChange={(event) => updateArrayValue('advantages', index, { ...item, chip: event.target.value })}
            placeholder="Chip"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            value={item.titulo || ''}
            onChange={(event) => updateArrayValue('advantages', index, { ...item, titulo: event.target.value })}
            placeholder="Titulo"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <textarea
            value={item.descripcion || ''}
            onChange={(event) => updateArrayValue('advantages', index, { ...item, descripcion: event.target.value })}
            placeholder="Descripcion"
            rows="2"
            className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2"
          />
        </Row>
      ))}
      <AddButton onClick={() => addArrayValue('advantages', { chip: '', titulo: '', descripcion: '' })}>Agregar ventaja</AddButton>
    </Section>
  );

  const renderFaqEditor = () => (
    <Section title="Preguntas frecuentes">
      {(form.faqs || []).map((item, index) => (
        <Row key={`faq-${index}`} onRemove={() => removeArrayValue('faqs', index)}>
          <input
            value={item.pregunta || ''}
            onChange={(event) => updateArrayValue('faqs', index, { ...item, pregunta: event.target.value })}
            placeholder="Pregunta"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <textarea
            value={item.respuesta || ''}
            onChange={(event) => updateArrayValue('faqs', index, { ...item, respuesta: event.target.value })}
            placeholder="Respuesta"
            rows="2"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </Row>
      ))}
      <AddButton onClick={() => addArrayValue('faqs', { pregunta: '', respuesta: '' })}>Agregar pregunta</AddButton>
    </Section>
  );

  const renderFooterLinksEditor = () => (
    <Section title="Links del footer">
      {(form.footer_links || []).map((group, groupIndex) => (
        <div key={`footer-group-${groupIndex}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <Row onRemove={() => removeArrayValue('footer_links', groupIndex)}>
            <input
              value={group.grupo || ''}
              onChange={(event) => updateArrayValue('footer_links', groupIndex, { ...group, grupo: event.target.value })}
              placeholder="Grupo"
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </Row>
          {(group.links || []).map((link, linkIndex) => (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3" key={`footer-link-${groupIndex}-${linkIndex}`}>
              <input
                value={link.texto || ''}
                onChange={(event) => {
                  const links = [...(group.links || [])];
                  links[linkIndex] = { ...link, texto: event.target.value };
                  updateArrayValue('footer_links', groupIndex, { ...group, links });
                }}
                placeholder="Texto"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                value={link.url || ''}
                onChange={(event) => {
                  const links = [...(group.links || [])];
                  links[linkIndex] = { ...link, url: event.target.value };
                  updateArrayValue('footer_links', groupIndex, { ...group, links });
                }}
                placeholder="URL"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  const links = (group.links || []).filter((_, index) => index !== linkIndex);
                  updateArrayValue('footer_links', groupIndex, { ...group, links });
                }}
                className="text-red-500 px-3"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <AddButton
            onClick={() => {
              const links = [...(group.links || []), { texto: '', url: '' }];
              updateArrayValue('footer_links', groupIndex, { ...group, links });
            }}
          >
            Agregar link
          </AddButton>
        </div>
      ))}
      <AddButton onClick={() => addArrayValue('footer_links', { grupo: '', links: [] })}>Agregar grupo</AddButton>
    </Section>
  );

  const renderCarouselManager = (title, type, images, onDelete) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
            <FileImage size={20} />
          </span>
          {title}
          <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
            {(images || []).length} imagenes
          </span>
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4 mb-6">
          {(images || []).map((image) => (
            <div key={image.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-16 h-12 rounded-lg overflow-hidden mr-4 flex-shrink-0 bg-gray-100">
                  <img src={`${API_BASE_URL}${image.imagen}`} alt={title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Imagen</p>
                  <p className="text-sm text-gray-500">ID: {image.id}</p>
                </div>
              </div>
              <button type="button" onClick={() => onDelete(image.id)} className="text-red-500 hover:text-red-700 p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleImageUpload(event, type)}
            className="hidden"
            disabled={uploading[type]}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50">
            <Plus size={20} className="mx-auto mb-2 text-orange-600" />
            <p className="text-orange-600 font-medium">{uploading[type] ? 'Subiendo imagen...' : 'Agregar nueva imagen'}</p>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG o WebP</p>
          </div>
        </label>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Cargando datos...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrar Pagina de Inicio</h1>
            <p className="text-gray-600">Gestiona textos, terminos, preguntas, footer e imagenes del home.</p>
          </div>
          <button
            type="button"
            onClick={saveHome}
            disabled={saving}
            className="bg-orange-600 text-white px-5 py-3 rounded-lg hover:bg-orange-700 flex items-center justify-center transition-colors disabled:opacity-60"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <Section title="Textos principales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Etiqueta legacy</span>
              <textarea
                value={form.etiqueta || ''}
                onChange={(event) => updateField('etiqueta', event.target.value)}
                rows="2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </label>
            {textFields.map(renderInput)}
          </div>
        </Section>

        {renderTickerEditor()}
        {renderAdvantagesEditor()}
        {renderFaqEditor()}
        {renderFooterLinksEditor()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {renderCarouselManager('Hero Carousel', 'hero', homeData?.hero_caruseles, deleteHeroImage)}
          {renderCarouselManager('Place Carousel', 'place', homeData?.place_caruseles, deletePlaceImage)}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
        <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
          <Edit size={20} />
        </span>
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Row = ({ children, onRemove }) => (
  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-start">
    {children}
    <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 p-2">
      <Trash2 size={16} />
    </button>
  </div>
);

const AddButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
  >
    <Plus size={16} className="mr-2" />
    {children}
  </button>
);

export default AdminHomePage;
