import { Alert, Box, MenuItem, TextField, Typography } from '@mui/material';

export const stockTotal = (values = {}) => Object.values(values).reduce(
  (total, value) => total + Number(value || 0), 0);

const inventoryValues = inventory => Object.fromEntries(inventory.map(
  row => [String(row.punto_venta ?? 'principal'), Number(row.cantidad)]));

export function stockPayload(values = {}, operation = 'reponer', inventory = [], transfer = {}) {
  const current = inventoryValues(inventory);
  if (operation === 'transferir') {
    const origin = transfer.origen ?? 'principal';
    const destination = transfer.destino || '';
    const quantity = Number(transfer.cantidad);
    if (!destination || origin === destination) {
      throw new Error('Selecciona una locación de destino diferente del origen.');
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('La cantidad a transferir debe ser un número entero mayor que cero.');
    }
    if (quantity > (current[origin] || 0)) {
      throw new Error('La cantidad a transferir supera el stock disponible en el origen.');
    }
    return {
      origen_punto_venta: origin === 'principal' ? null : Number(origin),
      destino_punto_venta: destination === 'principal' ? null : Number(destination),
      cantidad: quantity,
      nota: transfer.nota || '',
    };
  }
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
  operation = 'establecer', onOperationChange, transfer = {}, onTransferChange }) {
  const transferring = restock && operation === 'transferir';
  const setting = restock && operation === 'establecer';
  const withdrawing = restock && operation === 'retirar';
  const direction = withdrawing ? -1 : 1;
  const places = new Map([['principal', 'Sede Principal']]);
  (Array.isArray(locations) ? locations : locations.results || []).forEach(
    place => places.set(String(place.id), place.nombre));
  inventory.forEach(row => places.set(String(row.punto_venta ?? 'principal'), row.nombre));
  const current = inventory.reduce((sum, row) => sum + Number(row.cantidad), 0);
  const quantities = inventoryValues(inventory);
  const origin = transfer.origen ?? 'principal';
  const destination = transfer.destino || '';
  const quantity = Number(transfer.cantidad || 0);
  const available = quantities[origin] || 0;
  const invalidTransfer = !destination || origin === destination || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > available;
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
        <MenuItem value="transferir">Transferir entre locaciones</MenuItem>
      </TextField>}
      <Typography variant="body2" sx={{ mb: 2 }}>
        {transferring ? 'Selecciona origen, destino y unidades a mover. Al guardar se registrará la transferencia y el stock total se mantendrá.'
          : setting ? 'Escribe la cantidad que debe quedar en cada locación. Para quitar todo el stock de una locación, escribe 0 y guarda.'
          : withdrawing ? 'Indica las unidades que quieres retirar de cada locación. Se descontarán de las existencias actuales.'
          : restock ? 'Indica las unidades que llegan a cada locación. Se sumarán a las existencias actuales.'
          : 'Indica cuántas unidades tendrá cada locación. El total se calcula automáticamente.'}
      </Typography>
      {transferring ? <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <TextField select label="Origen" value={origin} disabled={disabled} fullWidth required
          onChange={event => onTransferChange?.({ ...transfer, origen: event.target.value, cantidad: '' })}>
          {[...places].map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
        </TextField>
        <TextField select label="Destino" value={destination} disabled={disabled} fullWidth required
          error={Boolean(destination) && destination === origin}
          onChange={event => onTransferChange?.({ ...transfer, destino: event.target.value })}>
          <MenuItem value="" disabled>Selecciona una locación</MenuItem>
          {[...places].map(([id, name]) => <MenuItem key={id} value={id} disabled={id === origin}>{name}</MenuItem>)}
        </TextField>
        <TextField label="Unidades a transferir" type="number" value={transfer.cantidad ?? ''}
          disabled={disabled} fullWidth required inputProps={{ min: 1, step: 1, max: available }}
          error={quantity > available} helperText={`Disponibles en origen: ${available}`}
          onChange={event => onTransferChange?.({ ...transfer, cantidad: event.target.value })} />
        <TextField label="Nota de la transferencia (opcional)" value={transfer.nota || ''}
          disabled={disabled} fullWidth inputProps={{ maxLength: 1000 }}
          onChange={event => onTransferChange?.({ ...transfer, nota: event.target.value })} />
        {!invalidTransfer && <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography>{places.get(origin)}: {available} → {available - quantity}</Typography>
          <Typography>{places.get(destination)}: {quantities[destination] || 0} → {(quantities[destination] || 0) + quantity}</Typography>
        </Box>}
      </Box> : <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
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
      </Box>}
      <Alert severity="info" sx={{ mt: 2 }}>
        {transferring ? `Stock total: ${current} · El total no cambia con la transferencia.`
          : setting ? `Stock actual: ${current} · Stock final: ${finalTotal}`
          : restock ? `Stock actual: ${current} · ${withdrawing ? 'A retirar' : 'A agregar'}: ${added} · Total previsto: ${finalTotal}`
          : `Stock total: ${added}`}
      </Alert>
    </Box>
  );
}
