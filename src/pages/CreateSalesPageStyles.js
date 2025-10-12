import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';

export const styles = {
  // Container styles
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff7ed',
    padding: '24px'
  },

  contentContainer: {
    maxWidth: '960px',
    margin: '0 auto'
  },

  // Header styles
  header: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '24px',
    borderLeft: '4px solid #fb923c'
  },

  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },

  headerSubtitle: {
    color: '#6b7280',
    marginTop: '4px'
  },

  backButton: {
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
  },

  // Form styles
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '24px',
    borderLeft: '4px solid #fb923c'
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '8px',
    marginBottom: '16px'
  },

  // TextField styles
  textField: {
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

  // Select styles
  select: {
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

  selectLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },

  // Submit button styles
  submitButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '6px',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '14px',
    padding: '10px 20px',
    '&:hover': {
      backgroundColor: '#1f2937'
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      color: '#ffffff'
    }
  },

  // Loading styles
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px'
  },

  // Error styles
  errorContainer: {
    padding: '16px'
  },

  // Progress indicator
  progressContainer: {
    marginTop: '8px',
    textAlign: 'center'
  }
};

// Component for loading state
export const LoadingState = () => (
  <Box sx={styles.loadingContainer}>
    <CircularProgress />
  </Box>
);

// Component for error state
export const ErrorState = ({ error, onReload }) => (
  <Box sx={styles.errorContainer}>
    <Alert severity="error">{error}</Alert>
    <Button 
      variant="contained" 
      sx={{ mt: 2 }}
      onClick={onReload}
    >
      Recargar página
    </Button>
  </Box>
);

// Component for section title
export const SectionTitle = ({ children }) => (
  <Typography variant="h3" sx={styles.sectionTitle}>
    {children}
  </Typography>
);