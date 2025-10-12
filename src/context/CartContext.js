import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart data:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Vaciar carrito completamente
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // Añadir producto al carrito (agrega N unidades como ítems separados)
  const addToCart = (product, quantity = 1) => {
    // Verificar stock disponible
    const availableStock = product.variacion 
      ? product.variacion.cantidad 
      : product.availableStock || product.cantidad || product.total_item;

    if (availableStock <= 0) {
      alert('No hay stock disponible para este producto');
      return;
    }

    // Verificar que la cantidad solicitada no supere el stock
    if (quantity > availableStock) {
      alert(`Solo hay ${availableStock} unidades disponibles de este producto`);
      return;
    }

    // Obtener referralCode de localStorage si existe
    const referralCode = localStorage.getItem('referralCode') || '';

    setCartItems(prevItems => {
      const newItems = [...prevItems];
      
      // Agregar N unidades como ítems individuales
      for (let i = 0; i < quantity; i++) {
        // Si es una variación
        if (product.variacion) {
          newItems.push({
            ...product,
            id: `${product.id}-${product.variacion.id}-${Date.now()}-${i}`,
            isVariation: true,
            price: product.variacion.precio_post_descuento || product.variacion.precio,
            image: product.variacion.imagen || product.imagenes?.[0]?.imagen || '',
            color: product.variacion.color,
            model: product.variacion.modelo,
            warranty: product.variacion.garantia_tiempo,
            gift: product.variacion.regalo_nombre,
            availableStock: availableStock,
            originalId: product.id,
            variationId: product.variacion.id,
            productData: product, // Mantenemos referencia al producto completo
            referralCode: referralCode // ← AÑADIR CÓDIGO DE REFERIDO
          });
        } else {
          // Si es un producto normal
          newItems.push({
            ...product,
            id: `${product.id}-${Date.now()}-${i}`,
            isVariation: false,
            price: product.precio_post_descuento || product.precio,
            image: product.imagenes?.[0]?.imagen || '',
            warranty: product.garantia_tiempo,
            gift: product.regalo_nombre,
            availableStock: availableStock,
            originalId: product.id,
            productData: product, // Mantenemos referencia al producto completo
            referralCode: referralCode // ← AÑADIR CÓDIGO DE REFERIDO
          });
        }
      }
      
      return newItems;
    });
  };

  // Eliminar un ítem específico del carrito
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Eliminar todos los ítems de un mismo producto/variación
  const removeAllFromCart = (originalId, isVariation, variationId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        isVariation 
          ? !(item.originalId === originalId && item.isVariation && item.variationId === variationId)
          : !(item.originalId === originalId && !item.isVariation)
      )
    );
  };

  // Función para obtener ítems agrupados (para mostrar en la UI)
  const getGroupedItems = () => {
    const grouped = {};
    
    cartItems.forEach(item => {
      const key = item.isVariation 
        ? `${item.originalId}-${item.variationId}` 
        : item.originalId;
      
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          quantity: 0,
          items: []
        };
      }
      
      grouped[key].quantity += 1;
      grouped[key].items.push(item);
    });
    
    return Object.values(grouped);
  };

  // Obtener el primer código de referido encontrado en el carrito
  const getReferralCode = () => {
    const itemWithReferral = cartItems.find(item => item.referralCode && item.referralCode.trim() !== '');
    return itemWithReferral ? itemWithReferral.referralCode : '';
  };

  // Calcular cantidad total de items
  const totalItems = cartItems.length;
  
  // Calcular total del carrito
  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.price) || 0),
      0
    );
  };

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        getGroupedItems,
        addToCart, 
        removeFromCart,
        removeAllFromCart,
        totalItems,
        calculateTotal,
        clearCart,
        getReferralCode // ← NUEVA FUNCIÓN PARA OBTENER EL CÓDIGO DE REFERIDO
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};