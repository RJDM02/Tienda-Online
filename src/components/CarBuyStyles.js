import { styled } from '@mui/material/styles';
import { IconButton, Badge, Box, Button as MUIButton, Avatar } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
export const CartIconButton = styled(IconButton)(({ theme }) => ({
  color: '#1a1a1a',
  borderRadius: '12px',
  padding: '10px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
}));

export const StyledBadge = styled(Badge)(({ theme, totalitems }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    border: '2px solid white',
    padding: '0 6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    background: '#FF6B00',
    boxShadow: '0 2px 6px rgba(255, 107, 0, 0.4)',
    animation: totalitems > 0 ? 'pulse 2s infinite' : 'none',
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.1)' },
      '100%': { transform: 'scale(1)' }
    }
  }
}));

export const DrawerPaper = {
  width: '100%',
  maxWidth: 440,
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  backdropFilter: 'blur(20px)',
  '&.MuiDrawer-paper': {
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderLeft: 'none',
    borderRadius: '20px 0 0 20px',
    mt: '64px',
    height: 'calc(100% - 64px)'
  }
};

export const DrawerHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: '#FF6B00',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg  "%3E%3Cg fill="white" fill-opacity="0.05"%3E%3Cpath d="M20 20c0 11.046-8.954 20-20 20v20h40V20H20z"/%3E%3C/g%3E%3C/svg%3E") repeat',
    opacity: 0.1
  }
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  color: 'white',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'rotate(90deg)'
  },
  transition: 'all 0.3s ease'
}));

export const EmptyCartContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  textAlign: 'center'
}));

export const EmptyCartIconContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(3)
}));

export const EmptyCartIcon = styled(ShoppingCart)(({ theme }) => ({
  fontSize: 100,
  color: '#e2e8f0',
  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
}));

export const EmptyCartCircle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '120px',
  height: '120px',
  border: '3px dashed #cbd5e1',
  borderRadius: '50%',
  animation: 'rotate 10s linear infinite',
  '@keyframes rotate': {
    '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
    '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' }
  }
}));

export const EmptyCartButton = styled(MUIButton)(({ theme }) => ({
  background: 'linear-gradient(45deg, #667eea, #764ba2)',
  color: 'white',
  padding: theme.spacing(1.5, 4),
  borderRadius: '25px',
  textTransform: 'none',
  fontWeight: 'medium',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #5a6fd8, #6a42a0)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
  },
  transition: 'all 0.3s ease'
}));

export const CartItemContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(2),
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
  }
}));

export const DeleteButton = styled(IconButton)(({ theme }) => ({
  color: '#dc2626',
  backgroundColor: 'rgba(220, 38, 38, 0.1)',
  '&:hover': {
    color: '#b32323',
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    transform: 'scale(1.1)'
  },
  transition: 'all 0.2s ease'
}));

export const ProductAvatar = styled(Avatar)(({ theme }) => ({
  width: 70,
  height: 70,
  marginRight: theme.spacing(2),
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  border: '2px solid white'
}));

export const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0'
}));

export const QuantityButton = styled(IconButton)(({ theme, disabled }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '4px',
  padding: '4px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  ...(disabled && {
    opacity: 0.5,
    pointerEvents: 'none',
    backgroundColor: 'transparent'
  })
}));

export const TotalContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  borderRadius: '16px',
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  border: '1px solid #e2e8f0'
}));

export const CheckoutButton = styled(MUIButton)(({ theme }) => ({
  background: '#000000',
  color: 'white',
  padding: theme.spacing(2),
  borderRadius: '16px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  '&:hover': {
    background: '#1a1a1a',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)'
  },
  transition: 'all 0.3s ease'
}));

