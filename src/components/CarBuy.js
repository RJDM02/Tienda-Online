import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button as MUIButton,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Slide,
  Fade
} from '@mui/material';
import { ShoppingCart, Close, Add, Remove, Delete, LocalOffer } from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Importar estilos
import {
  CartIconButton,
  StyledBadge,
  DrawerPaper,
  DrawerHeader,
  CloseButton,
  EmptyCartContainer,
  EmptyCartIconContainer,
  EmptyCartIcon,
  EmptyCartCircle,
  EmptyCartButton,
  CartItemContainer,
  DeleteButton,
  ProductAvatar,
  QuantityControl,
  QuantityButton,
  TotalContainer,
  CheckoutButton
} from './CarBuyStyles';

const CarBuy = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const { 
    cartItems,
    getGroupedItems, 
    totalItems, 
    removeFromCart,
    removeAllFromCart,
    calculateTotal,
    addToCart,
    getReferralCode
  } = useCart();

  const groupedItems = getGroupedItems();

  // Función para verificar si el usuario es administrador
  const isAdminUser = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.rol === 'Administrador' || decoded.rol === 'Super_Administrador';
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };
  
  const isManagerUser = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.rol === 'Gestor de Venta';
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };
  
  const handleProceedToCheckout = () => {
    // Verificar si el usuario es administrador
    const isAdmin = isAdminUser();
    const isManager = isManagerUser();
    
    // Obtener el código de referido del carrito
    const referralCode = getReferralCode();
    
    // Preparamos los datos para la página de creación de ventas
    const checkoutData = cartItems.map(item => ({
      id: item.originalId,
      isVariation: item.isVariation,
      variationId: item.isVariation ? item.variationId : null,
      price: item.price,
      productData: {
        nombre: item.nombre,
        imagen: item.image,
        color: item.color,
        modelo: item.model,
        garantia: item.warranty,
        regalo: item.gift
      }
    }));

    // Redirigir según el rol del usuario
    if (isAdmin) {
      navigate('/create-venta-admin', { 
        state: { 
          cartItems: checkoutData,
          referralCode: referralCode 
        } 
      });
    } else if (isManager) {
      navigate('/crear-venta-manager', { 
        state: { 
          cartItems: checkoutData,
          referralCode: referralCode 
        } 
      });
    } else {
      navigate('/crear-venta', { 
        state: { 
          cartItems: checkoutData,
          referralCode: referralCode 
        } 
      });
    }
    
    setOpen(false);
  };

  const handleRemoveOne = (itemId) => {
    removeFromCart(itemId);
  };

  const handleAddOne = (group) => {
    // Tomamos el primer item del grupo como base para agregar uno nuevo
    const baseItem = group.items[0];
    const productData = {
      ...baseItem.productData,
      id: baseItem.originalId,
      variacion: baseItem.isVariation ? {
        id: baseItem.variationId,
        cantidad: baseItem.availableStock,
        precio_post_descuento: baseItem.price,
        precio: baseItem.price,
        imagen: baseItem.image,
        color: baseItem.color,
        modelo: baseItem.model,
        garantia_tiempo: baseItem.warranty,
        regalo_nombre: baseItem.gift
      } : null
    };
    
    // Usamos addToCart para agregar una unidad más
    addToCart(productData, 1);
  };

  return (
    <>
      <Tooltip title="Carrito de compras" placement="bottom">
        <CartIconButton color="inherit" onClick={() => setOpen(true)}>
          <StyledBadge badgeContent={totalItems} color="error" totalitems={totalItems}>
            <ShoppingCart sx={{ fontSize: '24px' }} />
          </StyledBadge>
        </CartIconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: DrawerPaper }}
        transitionDuration={{ enter: 400, exit: 300 }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <DrawerHeader>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontWeight: 'bold',
                  mb: 0.5,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Mi Carrito
                </Typography>
                <Typography variant="body2" sx={{ 
                  opacity: 0.9,
                  fontSize: '0.875rem'
                }}>
                  {totalItems} {totalItems === 1 ? 'producto' : 'productos'} seleccionados
                </Typography>
              </Box>
              <CloseButton onClick={() => setOpen(false)}>
                <Close />
              </CloseButton>
            </Box>
          </DrawerHeader>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {groupedItems.length === 0 ? (
              <Fade in={groupedItems.length === 0} timeout={600}>
                <EmptyCartContainer>
                  <EmptyCartIconContainer>
                    <EmptyCartIcon />
                    <EmptyCartCircle />
                  </EmptyCartIconContainer>
                  <Typography variant="h6" sx={{ 
                    color: '#64748b',
                    fontWeight: 'medium',
                    mb: 1
                  }}>
                    Tu carrito está vacío
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#94a3b8',
                    mb: 3,
                    maxWidth: '200px'
                  }}>
                    Agrega algunos productos increíbles para comenzar
                  </Typography>
                  <EmptyCartButton variant="contained" onClick={() => setOpen(false)}>
                    Continuar comprando
                  </EmptyCartButton>
                </EmptyCartContainer>
              </Fade>
            ) : (
              <Box sx={{ p: 2 }}>
                <List sx={{ '& .MuiListItem-root': { mb: 1 } }}>
                  {groupedItems.map((group, index) => (
                    <Slide 
                      key={group.isVariation ? `${group.originalId}-${group.variationId}` : group.originalId}
                      direction="left"
                      in={true}
                      timeout={300 + index * 100}
                    >
                      <CartItemContainer>
                        <ListItem
                          secondaryAction={
                            <Tooltip title="Eliminar todos">
                              <DeleteButton 
                                edge="end" 
                                onClick={() => 
                                  removeAllFromCart(
                                    group.originalId, 
                                    group.isVariation, 
                                    group.isVariation ? group.variationId : null
                                  )
                                }
                              >
                                <Delete fontSize="small" />
                              </DeleteButton>
                            </Tooltip>
                          }
                          sx={{
                            alignItems: 'flex-start',
                            p: 2.5
                          }}
                        >
                          <ListItemAvatar>
                            <ProductAvatar src={group.image} alt={group.nombre} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 'bold',
                                  color: '#1e293b',
                                  mb: 0.5
                                }}>
                                  {group.nombre}
                                </Typography>
                                {group.isVariation && (
                                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                    {group.color && (
                                      <Chip 
                                        label={group.color}
                                        icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: group.color.toLowerCase() }} />}
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: '#f1f5f9',
                                          color: '#475569',
                                          fontWeight: 'medium',
                                          '&:hover': {
                                            backgroundColor: '#e2e8f0'
                                          }
                                        }}
                                      />
                                    )}
                                    {group.model && (
                                      <Chip 
                                        label={group.model}
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: '#fef3c7',
                                          color: '#d97706',
                                          fontWeight: 'medium'
                                        }}
                                      />
                                    )}
                                  </Box>
                                )}
                                {group.warranty && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <LocalOffer sx={{ fontSize: 14, color: '#FF6B00' }} />
                                    <Typography variant="caption" sx={{ 
                                      color: '#FF6B00',
                                      fontWeight: 'medium'
                                    }}>
                                      Garantía: {group.warranty}
                                    </Typography>
                                  </Box>
                                )}
                                {group.gift && (
                                  <Typography variant="caption" display="block" sx={{ 
                                    color: '#FF6B00',
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem'
                                  }}>
                                    🎁 Regalo: {group.gift}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mt: 2
                              }}>
                                <QuantityControl>
                                  <QuantityButton 
                                    size="small" 
                                    onClick={() => handleRemoveOne(group.items[group.items.length - 1].id)}
                                  >
                                    <Remove fontSize="small" />
                                  </QuantityButton>
                                  <Typography variant="body1" sx={{ 
                                    mx: 2,
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                  }}>
                                    {group.quantity}
                                  </Typography>
                                  <QuantityButton 
                                    size="small" 
                                    onClick={() => handleAddOne(group)}
                                    disabled={group.quantity >= group.availableStock}
                                  >
                                    <Add fontSize="small" />
                                  </QuantityButton>
                                </QuantityControl>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 'bold',
                                  color: '#059669',
                                  textShadow: '0 1px 2px rgba(5, 150, 105, 0.1)'
                                }}>
                                  ${(parseFloat(group.price) * group.quantity).toFixed(2)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </CartItemContainer>
                    </Slide>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          {groupedItems.length > 0 && (
            <Box sx={{ 
              p: 3,
              background: 'white',
              borderTop: '1px solid #e2e8f0',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
            }}>
              <TotalContainer>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="body1" sx={{ 
                    color: '#64748b',
                    fontWeight: 'medium'
                  }}>
                    Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'}):
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>
                    ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ 
                  color: '#94a3b8',
                  fontSize: '0.75rem'
                }}>
                  Los gastos de envío se calcularán en el checkout
                </Typography>
              </TotalContainer>

              <CheckoutButton
                fullWidth
                variant="contained"
                size="large"
                onClick={handleProceedToCheckout}
              >
                {isAdminUser() ? 'Procesar Venta (Admin)' : 'Datos de Compra'}
              </CheckoutButton>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default CarBuy;