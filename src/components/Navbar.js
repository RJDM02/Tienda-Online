import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar,
  Tooltip,
  InputAdornment,
  TextField,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CategoryIcon from '@mui/icons-material/Category';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import PeopleIcon from '@mui/icons-material/People';
import EngineeringIcon from '@mui/icons-material/Engineering';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import HistoryIcon from '@mui/icons-material/History';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import GradeIcon from '@mui/icons-material/Grade';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Assessment from "@mui/icons-material/Assessment";
import AccountBalance from "@mui/icons-material/AccountBalance";
import ReceiptIcon from '@mui/icons-material/Receipt';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PaidIcon from '@mui/icons-material/Paid';
import logo from '@/assets/logo.png';
import ModalEditCliente from '../components/ModalEditCliente';
import CarBuy from './CarBuy';
import { useCart } from '../context/CartContext';
import { jwtDecode } from 'jwt-decode';
import './Navbar.css';

import { API_BASE_URL } from '../config/apiConfig';
function Navbar({ onShowLogin }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems } = useCart();

  // Función para verificar y limpiar sesión si el token es inválido
  const checkTokenAndCleanSession = () => {
    const token = localStorage.getItem('authToken');
    
    // Si no hay token, limpiamos la sesión
    if (!token) {
      cleanSession();
      return false;
    }

    try {
      // Verificar expiración del token
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp < Date.now() / 1000;
      
      if (isExpired) {
        cleanSession();
        return false;
      }
      
      return true;
    } catch (error) {
      cleanSession();
      return false;
    }
  };

  // Función para limpiar la sesión
  const cleanSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUserData(null);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchQuery = searchParams.get('search') || '';
    setSearchQuery(urlSearchQuery);
  }, [location.search]);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    
    if (storedUserData) {
      if (checkTokenAndCleanSession()) {
        setUserData(JSON.parse(storedUserData));
      }
    }
  }, [location.pathname]);

  const decodeToken = () => {
    if (!checkTokenAndCleanSession()) {
      return null;
    }
    
    const token = localStorage.getItem('authToken');
    return jwtDecode(token);
  };

  const handleMenuOpen = (event) => {
    if (!checkTokenAndCleanSession()) {
      onShowLogin();
      return;
    }
    
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdminMenuOpen = (event) => {
    if (!checkTokenAndCleanSession()) {
      onShowLogin();
      return;
    }
    setAdminMenuAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    if (!checkTokenAndCleanSession()) {
      onShowLogin();
      return;
    }
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    cleanSession();
    handleMenuClose();
    navigate('/');
    window.location.reload();
  };

  const goToHome = () => {
    navigate('/');
  };

  const isAdmin = userData && (userData.rol === 'Administrador' || userData.rol === 'Super_Administrador');
  const isSuperAdmin = userData && (userData.rol === 'Super_Administrador');
  const isRemesasAdmin = userData && (userData.rol === 'Administrador_Remesas');
  const isCourier = userData && (userData.rol === 'Mensajero');
  const isManager = userData && (userData.rol === 'Gestor de Venta');
  const isRemesasClient = userData && (userData.rol === 'Cliente_Remesas');
  const isClient = userData && (userData.rol === 'Cliente');
  const isAdminPanelUser = isAdmin || isCourier || isManager || isRemesasAdmin;

  const navigateWithReload = (path) => {
    if (!checkTokenAndCleanSession()) {
      onShowLogin();
      return;
    }
    navigate(path);
    window.location.reload();
    handleAdminMenuClose();
    handleMobileMenuClose();
  };

  const fetchClientDetails = async (userId) => {
    try {
      if (!checkTokenAndCleanSession()) {
        throw new Error('Sesión expirada');
      }

      const response = await fetch(`${API_BASE_URL}/api/listar_cliente_detalle/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al cargar los datos del cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  };

  const handleEditProfileClick = async () => {
    try {
      if (!checkTokenAndCleanSession()) {
        throw new Error('Sesión expirada');
      }

      const decodedToken = decodeToken();
      const userId = decodedToken?.user_id;
      
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario desde el token');
      }

      setIsLoading(true);
      const details = await fetchClientDetails(userId);
      
      const completeUserData = {
        id: userId,
        username: details.username || userData?.username || '',
        correo: details.correo || userData?.correo || null,
        telefono: details.telefono || userData?.telefono || '',
        imagen: details.imagen || userData?.imagen || null,
        cumple: details.cumple || userData?.cumple || '',
        password: ''
      };

      setClientDetails(completeUserData);
      setIsEditModalOpen(true);
      handleMenuClose();
    } catch (error) {
      console.error('Error al editar perfil:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = (updatedData) => {
    const updatedUserData = { ...userData, ...updatedData };
    setUserData(updatedUserData);
    setClientDetails(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setIsEditModalOpen(false);
  };

  // Modifica la función handleSearchChange
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Limpia el timer anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Configura un nuevo timer que ejecutará la búsqueda después de 500ms (puedes ajustar este valor)
    const timer = setTimeout(() => {
      updateSearch(value);
    }, 1100);
    
    setDebounceTimer(timer);
  };

  // Modifica la función updateSearch para que no navegue si el query está vacío
  const updateSearch = (query) => {
    const currentPath = location.pathname;
    if (query.trim()) {
      navigate(`${currentPath}?search=${encodeURIComponent(query.trim())}`);
    } else if (location.search) {
      // Si hay parámetros de búsqueda pero el query está vacío, navega sin parámetros
      navigate(currentPath);
    }
  };

  // Asegúrate de limpiar el timer cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

    const handleSearchSubmit = (e) => {
      e.preventDefault();
      updateSearch(searchQuery);
    };

  const showSearch = location.pathname === '/shop' || location.pathname.startsWith('/product/');
  const showCart = location.pathname === '/shop' || location.pathname.startsWith('/product/');

  const adminMenuItems = [
    { icon: <InventoryIcon />, title: "Administrar productos", path: "/admin-item" },
    { icon: <CategoryIcon />, title: "Administrar categorías", path: "/admin-categoria" },
    { icon: <SubdirectoryArrowRightIcon />, title: "Administrar subcategorías", path: "/admin-subcategoria" },
    { icon: <EngineeringIcon />, title: "Administrar trabajadores", path: "/admin-trabajador" },
    { icon: <PeopleIcon />, title: "Administrar clientes", path: "/admin-cliente" },
    { icon: <LocalShippingIcon />, title: "Administrar envíos", path: "/admin-domicilios" },
    { icon: <CurrencyExchangeIcon />, title: "Administrar divisas", path: "/admin-divisas" },
    { icon: <CardGiftcardIcon />, title: "Administrar regalos", path: "/admin-regalos" },
    { icon: <GradeIcon />, title: "Administrar Condicion", path: "/admin-condicion" },
    { icon: <AssignmentTurnedInIcon />, title: "Administrar garantías", path: "/admin-garantias" },
    { icon: <LocalOfferIcon />, title: "Administrar cupones", path: "/admin-cupones" },
    // Removido de aquí: { icon: <PointOfSaleIcon />, title: "Administrar Ventas", path: "/admin-ventas" },
    { icon: <Assessment />, title: "Contabilidad Gestor", path: "/admin-contabilidad-gestor" },
    { icon: <Assessment />, title: "Contabilidad Cliente", path: "/admin-contabilidad-cliente" },
    { icon: <AccountBalance />, title: "Contabilidad General", path: "/admin-contabilidad-general" },
    { icon: <AccountBalance />, title: "Contabilidad General(Administador)", path: "/admin-contabilidad-general-admin" },
    { icon: <ReceiptIcon />, title: "Record Ventas (Todos)", path: "/record-ventas" },
    { icon: <EqualizerIcon />, title: "Estadísticas", path: "/statistics" },
    { icon: <BubbleChartIcon />, title: "Antigüedad Inventario", path: "/analytics-antiguedad-productos" },
    { icon: <HomeIcon />, title: "Administrar HomePage", path: "/admin-homepage" },
  ];

  const superAdminMenuItems = [
    { icon: <AssignmentReturnIcon />, title: "Devoluciones", path: "/admin-devoluciones" },
    { icon: <EditIcon />, title: "Gestionar remesas", path: "/remesa-gestionar" },
    { icon: <HistoryIcon />, title: "Historial remesas", path: "/remesa-historial" }
  ];

  const sharedAdminManagerItems = [
    { icon: <ReceiptIcon />, title: "Record Ventas (Gestor)", path: "/record-ventas-manager" }
  ];

const managerSpecificItems = [
  { icon: <HistoryIcon />, title: "Mis ventas", path: "/admin-ventas-gestor" },
  { icon: <InfoIcon />, title: "Info gestor", path: "/info-gestor" },
  { icon: <PointOfSaleIcon />, title: "Crear remesa", path: "/remesa-crear" },
  { icon: <PeopleIcon />, title: "Crear cliente remesas", path: "/remesa-crear-cliente" },
  { icon: <HistoryIcon />, title: "Historial remesas", path: "/remesa-historial" },
  { icon: <AccountBalance />, title: "Contabilidad remesas", path: "/remesa-contabilidad" }
];

const remesasAdminItems = [
  { icon: <PointOfSaleIcon />, title: "Crear remesa", path: "/remesa-crear" },
  { icon: <PeopleIcon />, title: "Crear cliente remesas", path: "/remesa-crear-cliente" },
  { icon: <EditIcon />, title: "Gestionar remesas", path: "/remesa-gestionar" },
  { icon: <HistoryIcon />, title: "Historial remesas", path: "/remesa-historial" },
  { icon: <AccountBalance />, title: "Contabilidad remesas", path: "/remesa-contabilidad" }
];

const adminRemesaItems = [
  { icon: <PointOfSaleIcon />, title: "Crear remesa", path: "/remesa-crear" },
  { icon: <PeopleIcon />, title: "Crear cliente remesas", path: "/remesa-crear-cliente" },
  { icon: <PaidIcon />, title: "Fondos remesas", path: "/remesa-fondos" },
  { icon: <AccountBalance />, title: "Contabilidad remesas", path: "/remesa-contabilidad" }
];

  const remesasClientItems = [
    { icon: <HistoryIcon />, title: "Mi historial remesas", path: "/remesa-historial" }
  ];

  const mobileMenuItems = [
    ...(isAdminPanelUser ? [
      { icon: <NotificationsIcon />, title: "Notificaciones", path: "/notificaciones" }
    ] : []),
    // Agregar Administrar Ventas al menú móvil para admins
    ...(isAdmin ? [
      { icon: <PointOfSaleIcon />, title: "Administrar Ventas", path: "/admin-ventas" }
    ] : []),
    ...(isAdmin ? [...adminMenuItems, ...(isSuperAdmin ? superAdminMenuItems : []), ...adminRemesaItems, ...sharedAdminManagerItems] : []),
    ...(isRemesasAdmin ? remesasAdminItems : []),
    ...(isManager ? [...sharedAdminManagerItems, ...managerSpecificItems] : []),
    ...(isCourier ? [
      { icon: <DeliveryDiningIcon />, title: "Mis entregas", path: "/mensajeria-lista" }
    ] : []),
    ...(isRemesasClient ? remesasClientItems : [])
  ];

  return (
    <>
      <AppBar position="fixed" style={{ zIndex: 1300 }}>
        <Toolbar sx={{ 
          minHeight: '64px !important', 
          maxHeight: '64px !important',
          paddingX: { xs: 1, sm: 2 },
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Box onClick={goToHome} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mr: 2 }}>
              <img src={logo} alt="VIDEOJUEGOS HABANA logo" style={{ height: isMobile ? '40px' : '50px' }} />
            </Box>
            
            <Typography 
              variant="h6" 
              noWrap
              onClick={goToHome}
              sx={{ 
                cursor: 'pointer',
                display: { xs: 'none', sm: 'block' },
                fontSize: { sm: '1rem', md: '1.25rem' }
              }}
            >
              VIDEOJUEGOS HABANA
            </Typography>
          </Box>

          {showSearch && (
            <Box sx={{ 
              flexGrow: 1,
              maxWidth: { xs: '200px', sm: '300px', md: '400px' },
              mx: 2
            }}>
              <form onSubmit={handleSearchSubmit}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: { xs: '18px', sm: '24px' } }} />
                      </InputAdornment>
                    ),
                    style: {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      height: isMobile ? '36px' : '40px'
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: 'transparent',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& input': {
                      padding: isMobile ? '6px 8px' : '8px 12px'
                    }
                  }}
                />
              </form>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Botón para Administrar Ventas (solo para Administradores y Super Administradores) */}
            {isAdmin && (
              <Tooltip title="Administrar Ventas">
                <Button
                  color="inherit"
                  onClick={() => navigateWithReload('/admin-ventas')}
                  startIcon={<PointOfSaleIcon />}
                  sx={{ 
                    display: { xs: 'none', md: 'flex' },
                    textTransform: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  Administrar Ventas
                </Button>
              </Tooltip>
            )}

            {/* Botón de icono para Administrar Ventas en pantallas más pequeñas */}
            {isAdmin && (
              <Tooltip title="Administrar Ventas">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigateWithReload('/admin-ventas')}
                  sx={{ display: { xs: 'none', sm: 'flex', md: 'none' } }}
                >
                  <PointOfSaleIcon />
                </IconButton>
              </Tooltip>
            )}

            {isAdminPanelUser && (
              <Tooltip title="Notificaciones">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigateWithReload('/notificaciones')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
            )}

            {(isAdmin || isManager) && (
              <Tooltip title="Record Ventas (Gestor)">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigateWithReload('/record-ventas-manager')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <ReceiptIcon />
                </IconButton>
              </Tooltip>
            )}

            {isCourier && (
              <Tooltip title="Mis entregas">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigateWithReload('/mensajeria-lista')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <DeliveryDiningIcon />
                </IconButton>
              </Tooltip>
            )}

            {isAdmin && (
              <Tooltip title="Panel de Administración">
                <IconButton 
                  color="inherit" 
                  onClick={handleAdminMenuOpen}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}

            {isManager && (
              <Tooltip title="Opciones de Gestor">
                <IconButton 
                  color="inherit" 
                  onClick={handleAdminMenuOpen}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}

            {isRemesasClient && (
              <Tooltip title="Mi historial remesas">
                <IconButton
                  color="inherit"
                  onClick={() => navigateWithReload('/remesa-historial')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}

            {isRemesasAdmin && (
              <Tooltip title="Opciones de Remesas">
                <IconButton
                  color="inherit"
                  onClick={handleAdminMenuOpen}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}

            {showCart && <CarBuy />}

            <Tooltip title={userData ? "Mi cuenta" : "Iniciar sesión"}>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                {userData ? (
                  <Avatar 
                    alt={userData.nombre || userData.username} 
                    src={userData.imagen ? require(`../assets/${userData.imagen}.png`) : null}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </Tooltip>

            {(isAdminPanelUser || isRemesasClient) && (
              <IconButton 
                color="inherit" 
                onClick={handleMobileMenuOpen}
                sx={{ display: { xs: 'flex', sm: 'none' }, p: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>

        <Menu
          anchorEl={adminMenuAnchorEl}
          open={Boolean(adminMenuAnchorEl)}
          onClose={handleAdminMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              maxHeight: '400px',
              overflowY: 'auto'
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {isAdmin && [...adminMenuItems, ...(isSuperAdmin ? superAdminMenuItems : []), ...adminRemesaItems].map((item, index) => (
            <MenuItem 
              key={`admin-${index}`}
              onClick={() => navigateWithReload(item.path)}
              sx={{ minWidth: '250px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography variant="body2">{item.title}</Typography>
              </Box>
            </MenuItem>
          ))}
          
          {isManager && managerSpecificItems.map((item, index) => (
            <MenuItem 
              key={`manager-${index}`}
              onClick={() => navigateWithReload(item.path)}
              sx={{ minWidth: '250px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography variant="body2">{item.title}</Typography>
              </Box>
            </MenuItem>
          ))}

          {isRemesasAdmin && remesasAdminItems.map((item, index) => (
            <MenuItem
              key={`remesas-admin-${index}`}
              onClick={() => navigateWithReload(item.path)}
              sx={{ minWidth: '250px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography variant="body2">{item.title}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={mobileMenuAnchorEl}
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              maxHeight: '400px',
              overflowY: 'auto'
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {mobileMenuItems.map((item, index) => (
            <MenuItem 
              key={index}
              onClick={item.onClick ? item.onClick : () => navigateWithReload(item.path)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography variant="body2">{item.title}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleEditProfileClick}>
            <Avatar 
              alt={userData?.nombre || userData?.username} 
              src={userData?.imagen ? require(`../assets/${userData.imagen}.png`) : null}
            />
            <span>{userData?.nombre || userData?.username}</span>
          </MenuItem>

          {!isAdminPanelUser && !isRemesasClient && (
            <MenuItem onClick={handleEditProfileClick}>
              <EditIcon fontSize="small" style={{ marginRight: 8 }} />
              Editar perfil
            </MenuItem>
          )}

          {!isAdminPanelUser && !isRemesasClient && (
            <MenuItem onClick={() => {
              navigate('/datos-cliente');
              handleMenuClose();
            }}>
              <PersonPinIcon fontSize="small" style={{ marginRight: 8 }} />
              Mis datos
            </MenuItem>
          )}

          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
            Cerrar sesión
          </MenuItem>
        </Menu>
      </AppBar>

      <Toolbar />

      <ModalEditCliente
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={clientDetails || userData}
        onEditSuccess={handleEditSuccess}
        isLoading={isLoading}
        apiBaseUrl={API_BASE_URL}
      />
    </>
  );
}

export default Navbar;

