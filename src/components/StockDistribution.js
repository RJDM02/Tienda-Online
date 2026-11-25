import { Alert, Box, TextField, Typography } from '@mui/material';

export const stockTotal = (values = {}) => Object.values(values).reduce(
  (total, value) => total + Number(value || 0), 0);

export function stockPayload(values = {}) {
  const rows = Object.entries(values).map(([id, value]) => ({
    punto_venta: id === 'principal' ? null : Number(id),
    cantidad: Number(value || 0),
  }));
  if (rows.some(row => !Number.isSafeInteger(row.cantidad) || row.cantidad < 0)) {
    throw new Error('Las cantidades por locación deben ser números enteros mayores o iguales a cero.');
  }
  return rows.length ? rows : [{ punto_venta: null, cantidad: 0 }];
}

export default function StockDistribution({ locations = [], values = {}, onChange,
  inventory = [], restock = false, disabled = false }) {
  const places = new Map([['principal', 'Sede Principal']]);
  (Array.isArray(locations) ? locations : locations.results || []).forEach(
    place => places.set(String(place.id), place.nombre));
  inventory.forEach(row => places.set(String(row.punto_venta ?? 'principal'), row.nombre));
  const current = inventory.reduce((sum, row) => sum + Number(row.cantidad), 0);
  const added = stockTotal(values);
  return (
    <Box sx={{ gridColumn: '1 / -1', my: 2 }}>
      <Typography variant="h6" gutterBottom>
        {restock ? 'Reponer stock por locación' : 'Stock inicial por locación'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {restock ? 'Indica las unidades que llegan a cada locación. Se sumarán a las existencias actuales.'
          : 'Indica cuántas unidades tendrá cada locación. El total se calcula automáticamente.'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[...places].map(([id, name]) => {
          const existing = Number(inventory.find(row => String(row.punto_venta ?? 'principal') === id)?.cantidad || 0);
          return <TextField key={id} label={name} type="number" fullWidth
            value={values[id] ?? ''} disabled={disabled}
            inputProps={{ min: 0, step: 1 }} placeholder="0"
            onChange={event => onChange({ ...values, [id]: event.target.value })}
            helperText={restock ? `Actual: ${existing} · Después de reponer: ${existing + Number(values[id] || 0)}` : 'Unidades iniciales'} />;
        })}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        {restock ? `Stock actual: ${current} · A agregar: ${added} · Total previsto: ${current + added}`
          : `Stock total: ${added}`}
      </Alert>
    </Box>
  );
}
