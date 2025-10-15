import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import RegisterPage from './pages/RegisterPage';
import LoginModal from './components/LoginModal';
import PrivateRoute from './components/PrivateRoute'; 
import CreateCategoryPage from './pages/CreateCategoryPage'; 
import CreateSubcategoryPage from './pages/CreateSubcategoryPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminSubcategoriesPage from './pages/AdminSubcategoryPage';
import CreateWorkerPage from './pages/CreateWorkerPage';
import AdminWorkerPage from './pages/AdminWorkerPage';
import AdminClientPage from './pages/AdminClientPage';
import CreateItemPage from './pages/CreateItemPage';
import AdminItemPage from './pages/AdminItemPage';
import AdminItemImagesPage from './pages/AdminItemImagesPage'; 
import AdminVariacionPage from './pages/AdminVariacionPage';
import CreateVariacionPage from './pages/CreateVariacionPage';
import AdminDivisaPage from './pages/AdminDivisaPage';
import AdminDeliveryPage from './pages/AdminDeliveryPage';
import ProductView from './pages/ProductView';
import AdminGiftPage from './pages/AdminGiftPage';
import AdminWarrantyPage from './pages/AdminWarrantyPage';
import AdminCouponPage from './pages/AdminCouponPage';
import CreateSalesPage from './pages/CreateSalesPage';
import AdminSalesPage from './pages/AdminSalesPage';
import RecordSalesPage from './pages/RecordSalesPage';
import MessengerListPage from './pages/MessengerListPage';
import SalesManagerPage from './pages/SalesManagerPage';
import DataClientePage from './pages/DataClientePage';
import AdminConditionPage from './pages/AdminConditionPage';
import AccountingManagerPage from './pages/AccountingManagerPage';
import AccountingAdminPage from './pages/AccountingAdminPage';
import { CartProvider } from './context/CartContext';
import RecordsSalesManagerPage from './pages/RecordsSalesManagerPage';
import NotificationsPage from './pages/NotificationsPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminHomePage from './pages/AdminHomePage';
import AccountingAdminPageManager from './pages/AccountingAdminPageManager';
import CreateSalesPageAdmin from './pages/CreateSalesPageAdmin';
import CreateSalesPageManager from './pages/CreateSalesPageManager';
import AccountingClientReferidosPage from './pages/AccountingClientReferidosPage';
import InfoManagerPage from './pages/InfoManagerPage';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <Router>
      <CartProvider>
        <div className="App">
          <Navbar onShowLogin={() => setShowLogin(true)} />
          
          <Routes>
            <Route path="/" element={<HomePage onShowLogin={() => setShowLogin(true)} />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/registro" element={<RegisterPage onShowLogin={() => setShowLogin(true)} />} />
            <Route path="/product/:id" element={<ProductView onShowLogin={() => setShowLogin(true)}/>} />
            <Route path="/crear-venta" element={<CreateSalesPage />} />
            <Route path="/datos-cliente" element={<DataClientePage />} />
            <Route 
              path="/crear-categoria" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}>
                  <CreateCategoryPage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/crear-subcategoria" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}>
                  <CreateSubcategoryPage />
                </PrivateRoute>
              } 
            />
          
            <Route 
              path="/admin-categoria" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}>
                  <AdminCategoriesPage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-subcategoria" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}>
                  <AdminSubcategoriesPage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/crear-trabajador" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}>
                  <CreateWorkerPage />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-trabajador" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminWorkerPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-cliente" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminClientPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/crear-item" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <CreateItemPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-item" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminItemPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-item-images/:id" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminItemImagesPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-variacion/:itemId" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminVariacionPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/crear-variacion/:itemId" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <CreateVariacionPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-divisas" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminDivisaPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-domicilios" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminDeliveryPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-regalos" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminGiftPage/>
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin-condicion" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminConditionPage/>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin-garantias" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminWarrantyPage/>
                </PrivateRoute>
              } 

            />
            <Route 
              path="/admin-cupones" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminCouponPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-ventas" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AdminSalesPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-contabilidad-gestor" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AccountingManagerPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-contabilidad-cliente" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AccountingClientReferidosPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-contabilidad-general-admin" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <AccountingAdminPageManager/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/create-venta-admin" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <CreateSalesPageAdmin/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-contabilidad-general" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador']}> 
                  <AccountingAdminPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-homepage" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador']}> 
                  <AdminHomePage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/record-ventas" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <RecordSalesPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/statistics" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador']}> 
                  <StatisticsPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/record-ventas-manager" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador','Gestor de Venta']}> 
                  <RecordsSalesManagerPage/>
                </PrivateRoute>
              } 
            />
             <Route 
              path="/notificaciones" 
              element={
                <PrivateRoute allowedRoles={['Super_Administrador', 'Administrador','Gestor de Venta','Mensajero']}> 
                  <NotificationsPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/mensajeria-lista" 
              element={
                <PrivateRoute allowedRoles={['Mensajero']}> 
                  <MessengerListPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin-ventas-gestor" 
              element={
                <PrivateRoute allowedRoles={['Gestor de Venta']}> 
                  <SalesManagerPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/info-gestor" 
              element={
                <PrivateRoute allowedRoles={['Gestor de Venta']}>
                  <InfoManagerPage/>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/crear-venta-manager" 
              element={
                <PrivateRoute allowedRoles={['Gestor de Venta']}> 
                  <CreateSalesPageManager/>
                </PrivateRoute>
              } 
            />
          </Routes>
          
          <LoginModal 
            open={showLogin} 
            onClose={() => setShowLogin(false)} 
          />
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
