import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Mail, Phone, MessageCircle } from 'lucide-react';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';

import { API_BASE_URL, API_URL } from '../config/apiConfig';
const HomePage = () => {
  const [currentMainSlide, setCurrentMainSlide] = useState(0);
  const [currentSecondarySlide, setCurrentSecondarySlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [homeData, setHomeData] = useState(null);
  const [marqueePosition, setMarqueePosition] = useState(0);
  const [marqueeWidth, setMarqueeWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Obtener datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/listar_homepage/`);
        const data = await response.json();
        setHomeData(data[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Configurar animación del texto que se mueve
  useEffect(() => {
    if (!homeData?.etiqueta) return;

    const container = document.querySelector('.marquee-container');
    const text = document.querySelector('.marquee-text');
    
    if (container && text) {
      const containerRect = container.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      
      setContainerWidth(containerRect.width);
      setMarqueeWidth(textRect.width);
      setMarqueePosition(containerRect.width / 2 - textRect.width / 2);
    }
  }, [homeData?.etiqueta]);

  // Animación del texto que se mueve
  useEffect(() => {
    if (marqueeWidth === 0 || containerWidth === 0) return;

    const animationDuration = 15000;
    const startPosition = containerWidth;
    const endPosition = -marqueeWidth;
    const distance = startPosition - endPosition;
    const speed = distance / (animationDuration / 16);

    let animationId;
    let lastTimestamp = 0;

    const animate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      
      setMarqueePosition(prev => {
        const newPosition = prev - speed * (delta / 16);
        if (newPosition <= endPosition) {
          return startPosition;
        }
        return newPosition;
      });

      lastTimestamp = timestamp;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [marqueeWidth, containerWidth]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-slide effects
  useEffect(() => {
    if (!homeData?.hero_caruseles) return;
    const interval = setInterval(() => {
      setCurrentMainSlide((prev) => (prev + 1) % homeData.hero_caruseles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [homeData?.hero_caruseles]);

  useEffect(() => {
    if (!homeData?.place_caruseles) return;
    const interval = setInterval(() => {
      setCurrentSecondarySlide((prev) => (prev + 1) % homeData.place_caruseles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [homeData?.place_caruseles]);

  const nextMainSlide = () => {
    if (!homeData?.hero_caruseles) return;
    setCurrentMainSlide((prev) => (prev + 1) % homeData.hero_caruseles.length);
  };

  const prevMainSlide = () => {
    if (!homeData?.hero_caruseles) return;
    setCurrentMainSlide((prev) => (prev - 1 + homeData.hero_caruseles.length) % homeData.hero_caruseles.length);
  };

  const nextSecondarySlide = () => {
    if (!homeData?.place_caruseles) return;
    setCurrentSecondarySlide((prev) => (prev + 1) % homeData.place_caruseles.length);
  };

  const prevSecondarySlide = () => {
    if (!homeData?.place_caruseles) return;
    setCurrentSecondarySlide((prev) => (prev - 1 + homeData.place_caruseles.length) % homeData.place_caruseles.length);
  };

  // Funciones para manejar touch en el carrusel principal
  const handleMainTouchStart = (e) => {
    if (!isMobile) return;
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleMainTouchMove = (e) => {
    if (!isMobile) return;
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleMainTouchEnd = () => {
    if (!isMobile || !touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const threshold = 50;
    
    if (distance > threshold) {
      nextMainSlide();
    } else if (distance < -threshold) {
      prevMainSlide();
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Funciones para manejar touch en el carrusel secundario
  const handleSecondaryTouchStart = (e) => {
    if (!isMobile) return;
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleSecondaryTouchMove = (e) => {
    if (!isMobile) return;
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleSecondaryTouchEnd = () => {
    if (!isMobile || !touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const threshold = 50;
    
    if (distance > threshold) {
      nextSecondarySlide();
    } else if (distance < -threshold) {
      prevSecondarySlide();
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Componente reutilizable para los carruseles
  const Carousel = ({ images, currentSlide, nextSlide, prevSlide, 
                    onTouchStart, onTouchMove, onTouchEnd, className = '' }) => {
    if (!images || images.length === 0) return null;

    return (
      <div className={`relative bg-[#FF6B00] w-full overflow-hidden ${className}`}>
        {/* Contenedor de imágenes */}
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img 
            src={`${API_BASE_URL}${images[currentSlide].imagen}`} 
            alt={`Slide ${currentSlide + 1}`}
            className={`${
              isMobile ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'
            } transition-opacity duration-500 ease-in-out`}
            style={{ objectPosition: 'center' }}
          />
        </div>

        {/* Controles - Solo visible en desktop */}
        {!isMobile && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white z-30 hover:text-gray-200 transition-colors bg-black bg-opacity-30 rounded-full p-2"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white z-30 hover:text-gray-200 transition-colors bg-black bg-opacity-30 rounded-full p-2"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Indicadores de slide */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center space-x-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!homeData) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Banner naranja */}
      <div className="bg-[#FF6B00] text-white h-64 py-12 md:py-20 px-6 text-center w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">VIDEOJUEGOS</h1>
        <h2 className="text-2xl md:text-3xl font-light mb-2">H A B A N A</h2>
        <Link 
          to="/shop" 
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors duration-300"
        >
          Empiece su compra
        </Link>
      </div>

      {/* Separador negro con texto que se mueve */}
      <div className="marquee-container bg-black h-12 w-full overflow-hidden relative flex items-center">
        {homeData.etiqueta && (
          <div 
            className="marquee-text text-white text-lg whitespace-nowrap absolute"
            style={{ left: `${marqueePosition}px` }}
          >
            {homeData.etiqueta}
          </div>
        )}
      </div>

      {/* Carrusel principal */}
      <Carousel 
        images={homeData.hero_caruseles} 
        currentSlide={currentMainSlide}
        nextSlide={nextMainSlide}
        prevSlide={prevMainSlide}
        onTouchStart={handleMainTouchStart}
        onTouchMove={handleMainTouchMove}
        onTouchEnd={handleMainTouchEnd}
        className="h-48 md:h-80"
      />

      {/* Panel de contenido */}
      <div className="flex-grow px-4 md:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Texto de bienvenida */}
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Bienvenidos a:</h2>
              <p className="text-[#FF6B00] font-medium mb-3">VIDEOJUEGOSHABANA</p>
              <p className="text-gray-600 mb-3 text-left">
                Su tienda de confianza en la Habana con domicilios incluidos en toda
                la provincia Habana. Los mejores precios en productos que usted desee.
              </p>
              <p className="text-gray-600 text-left">
                No dude en contactarnos y siempre se sera atendido como usted 
                que es lo mas importante se merece.
              </p>
            </div>

            {/* Carrusel secundario - usando el mismo componente pero con place_caruseles */}
            <div className="w-full md:w-64 rounded-lg overflow-hidden">
              <Carousel 
                images={homeData.place_caruseles} 
                currentSlide={currentSecondarySlide}
                nextSlide={nextSecondarySlide}
                prevSlide={prevSecondarySlide}
                onTouchStart={handleSecondaryTouchStart}
                onTouchMove={handleSecondaryTouchMove}
                onTouchEnd={handleSecondaryTouchEnd}
                className="h-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página negro */}
      <footer className="bg-black text-white py-6 w-full mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 md:space-x-12">
            <div className="flex flex-col items-center">
               <a href="mailto:rauljavierdominguezmaymir@gmail.com" className="flex flex-col items-center">
              <Mail size={24} className="mb-1" />
              <span className="text-xs md:text-sm">Email</span>
              </a>
            </div>
            <div className="flex flex-col items-center">
              <a href="tel:+5359709174" className="flex flex-col items-center">
              <Phone size={24} className="mb-1" />
              <span className="text-xs md:text-sm">Teléfono</span>
              </a>
            </div>
            <div className="flex flex-col items-center">
              <a href="https://wa.me/+5359709174" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
              <MessageCircle size={24} className="mb-1" />
              <span className="text-xs md:text-sm">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </footer>  
      <FloatingWhatsAppButton />
    </div>
  );
};

export default HomePage;
