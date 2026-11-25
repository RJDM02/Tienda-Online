import { Alert, Box, MenuItem, TextField, Typography } from '@mui/material';

export const stockTotal = (values = {}) => Object.values(values).reduce(
  (total, value) => total + Number(value || 0), 0);

const inventoryValues = inventory => Object.fromEntries(inventory.map(
  row => [String(row.punto_venta ?? 'principal'), Number(row.cantidad)]));

export function stockPayload(values = {}, operation = 'reponer', inventory = []) {
  const current = inventoryValues(inventory);
  const finalValues = operation === 'establecer' ? { ...current, ...values } : values;
  if (operation === 'establecer' && Object.values(finalValues).some(value => value === '')) {
    throw new Error('Indique la cantidad final. Escriba 0 para dejar la locación sin stock.');
  }
  const rows = Object.entries(finalValues).map(([id, value]) => ({
    punto_venta: id === 'principal' ? null : Number(id),
    cantidad: Number(value || 0),
    ...(operation === 'establecer' ? { cantidad_actual: current[id] || 0 } : {}),
  }));
  if (rows.some(row => !Number.isSafeInteger(row.cantidad) || row.cantidad < 0)) {
    throw new Error('Las cantidades por locación deben ser números enteros mayores o iguales a cero.');
  }
  return rows.length ? rows : [{ punto_venta: null, cantidad: 0,
    ...(operation === 'establecer' ? { cantidad_actual: 0 } : {}) }];
}

export default function StockDistribution({ locations = [], values = {}, onChange,
  inventory = [], restock = false, disabled = false,
  operation = 'establecer', onOperationChange }) {
  const setting = restock && operation === 'establecer';
  const withdrawing = restock && operation === 'retirar';
  const direction = withdrawing ? -1 : 1;
  const places = new Map([['principal', 'Sede Principal']]);
  (Array.isArray(locations) ? locations : locations.results || []).forEach(
    place => places.set(String(place.id), place.nombre));
  inventory.forEach(row => places.set(String(row.punto_venta ?? 'principal'), row.nombre));
  const current = inventory.reduce((sum, row) => sum + Number(row.cantidad), 0);
  const added = stockTotal(values);
  const finalTotal = setting ? stockTotal({ ...inventoryValues(inventory), ...values }) : current + direction * added;
  return (
    <Box sx={{ gridColumn: '1 / -1', my: 2 }}>
      <Typography variant="h6" gutterBottom>
        {restock ? 'Ajustar stock por locación' : 'Stock inicial por locación'}
      </Typography>
      {restock && <TextField select label="Operación de stock" fullWidth
        value={operation} disabled={disabled} sx={{ mb: 2 }}
        onChange={event => onOperationChange?.(event.target.value)}>
        <MenuItem value="establecer">Editar cantidad final</MenuItem>
        <MenuItem value="reponer">Reponer unidades</MenuItem>
        <MenuItem value="retirar">Retirar unidades</MenuItem>
      </TextField>}
      <Typography variant="body2" sx={{ mb: 2 }}>
        {setting ? 'Escribe la cantidad que debe quedar en cada locación. Para quitar todo el stock de una locación, escribe 0 y guarda.'
          : withdrawing ? 'Indica las unidades que quieres retirar de cada locación. Se descontarán de las existencias actuales.'
          : restock ? 'Indica las unidades que llegan a cada locación. Se sumarán a las existencias actuales.'
          : 'Indica cuántas unidades tendrá cada locación. El total se calcula automáticamente.'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        {[...places].map(([id, name]) => {
          const existing = Number(inventory.find(row => String(row.punto_venta ?? 'principal') === id)?.cantidad || 0);
          return <TextField key={id} label={name} type="number" fullWidth
            value={values[id] ?? (setting ? existing : '')} disabled={disabled}
            required={setting}
            inputProps={{ min: 0, step: 1, ...(withdrawing ? { max: existing } : {}) }} placeholder="0"
            error={withdrawing && Number(values[id] || 0) > existing}
            onChange={event => onChange({ ...values, [id]: event.target.value })}
            helperText={withdrawing && Number(values[id] || 0) > existing
              ? `Solo hay ${existing} unidades disponibles en esta locación.`
              : setting ? `Actual: ${existing} · Cantidad final: ${values[id] === '' ? 'pendiente' : Number(values[id] ?? existing)}`
              : restock ? `Actual: ${existing} · Después de ${withdrawing ? 'retirar' : 'reponer'}: ${existing + direction * Number(values[id] || 0)}` : 'Unidades iniciales'} />;
        })}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        {setting ? `Stock actual: ${current} · Stock final: ${finalTotal}`
          : restock ? `Stock actual: ${current} · ${withdrawing ? 'A retirar' : 'A agregar'}: ${added} · Total previsto: ${finalTotal}`
          : `Stock total: ${added}`}
      </Alert>
    </Box>
  );
}
