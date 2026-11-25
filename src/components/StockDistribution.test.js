import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StockDistribution, { stockPayload } from './StockDistribution';

const locations = [{ id: 7, nombre: 'Tienda Centro' }];

function Form({ restock = false, inventory = [], initialOperation = 'reponer', onSave }) {
  const [values, setValues] = useState({});
  const [operation, setOperation] = useState(initialOperation);
  const [transfer, setTransfer] = useState({});
  return <>
    <StockDistribution locations={locations} values={values} onChange={setValues}
      restock={restock} inventory={inventory} operation={operation}
      transfer={transfer} onTransferChange={setTransfer}
      onOperationChange={value => { setOperation(value); setValues({}); setTransfer({}); }} />
    <button onClick={() => setValues({})}>Limpiar</button>
    {onSave && <button onClick={() => onSave(stockPayload(values, operation, inventory, transfer))}>Guardar</button>}
  </>;
}

test('transfers from main to a shop in the editor with an unchanged total and correct payload', async () => {
  const onSave = jest.fn();
  render(<Form restock initialOperation="establecer" onSave={onSave} inventory={[
    { punto_venta: null, nombre: 'Sede Principal', cantidad: 5 },
    { punto_venta: 7, nombre: 'Tienda Centro', cantidad: 3 },
  ]} />);
  fireEvent.mouseDown(screen.getByLabelText('Operación de stock'));
  fireEvent.click(screen.getByRole('option', { name: 'Transferir entre locaciones' }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  fireEvent.mouseDown(screen.getByLabelText(/Destino/));
  fireEvent.click(screen.getByRole('option', { name: 'Tienda Centro' }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/Unidades a transferir/), { target: { value: '2' } });
  expect(screen.getByText('Sede Principal: 5 → 3')).toBeInTheDocument();
  expect(screen.getByText('Tienda Centro: 3 → 5')).toBeInTheDocument();
  expect(screen.getByText('Stock total: 8 · El total no cambia con la transferencia.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Guardar'));
  expect(onSave).toHaveBeenCalledWith({ origen_punto_venta: null, destino_punto_venta: 7, cantidad: 2, nota: '' });
  fireEvent.change(screen.getByLabelText(/Unidades a transferir/), { target: { value: '6' } });
  expect(screen.getByLabelText(/Unidades a transferir/).checkValidity()).toBe(false);
  fireEvent.mouseDown(screen.getByLabelText('Operación de stock'));
  fireEvent.click(screen.getByRole('option', { name: 'Editar cantidad final' }));
  expect(screen.getByLabelText(/Tienda Centro/)).toHaveValue(3);
  expect(screen.queryByLabelText(/Unidades a transferir/)).not.toBeInTheDocument();
});

test('transfer payload supports returning to main and rejects invalid movements', () => {
  const inventory = [{ punto_venta: 7, cantidad: 3 }];
  expect(stockPayload({}, 'transferir', inventory, { origen: '7', destino: 'principal', cantidad: '3' }))
    .toEqual({ origen_punto_venta: 7, destino_punto_venta: null, cantidad: 3, nota: '' });
  for (const transfer of [
    { origen: '7', destino: '7', cantidad: '1' },
    { origen: '7', destino: '', cantidad: '1' },
    { origen: '7', destino: 'principal', cantidad: '0' },
    { origen: '7', destino: 'principal', cantidad: '1.5' },
    { origen: '7', destino: 'principal', cantidad: '4' },
  ]) expect(() => stockPayload({}, 'transferir', inventory, transfer)).toThrow();
});

test('entering zero and saving sends final zero while preserving other locations', () => {
  const onSave = jest.fn();
  render(<Form restock initialOperation="establecer" onSave={onSave} inventory={[
    { punto_venta: null, nombre: 'Sede Principal', cantidad: 6 },
    { punto_venta: 7, nombre: 'Tienda Centro', cantidad: 4 },
  ]} />);
  expect(screen.getByLabelText(/Tienda Centro/)).toHaveValue(4);
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '0' } });
  expect(screen.getByText('Actual: 4 · Cantidad final: 0')).toBeInTheDocument();
  expect(screen.getByText('Stock actual: 10 · Stock final: 6')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Guardar'));
  expect(onSave).toHaveBeenCalledWith(expect.arrayContaining([
    { punto_venta: 7, cantidad: 0, cantidad_actual: 4 },
    { punto_venta: null, cantidad: 6, cantidad_actual: 6 },
  ]));
});

test('editing defaults to final quantities and requires explicit zero instead of a blank', () => {
  render(<StockDistribution restock inventory={[
    { punto_venta: null, nombre: 'Sede Principal', cantidad: 10 },
  ]} onChange={() => {}} />);
  expect(screen.getByLabelText(/Sede Principal/)).toHaveValue(10);
  expect(screen.getByText('Editar cantidad final')).toBeInTheDocument();
  expect(() => stockPayload({ principal: '' }, 'establecer')).toThrow('Escriba 0');
});

test('switches to withdrawal, clears additions and allows withdrawing all stock', () => {
  render(<Form restock inventory={[{ punto_venta: 7, nombre: 'Tienda Centro', cantidad: 4 }]} />);
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '2' } });
  fireEvent.mouseDown(screen.getByLabelText('Operación de stock'));
  fireEvent.click(screen.getByRole('option', { name: 'Retirar unidades' }));
  expect(screen.getByLabelText(/Tienda Centro/)).toHaveValue(null);
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '4' } });
  expect(screen.getByText('Actual: 4 · Después de retirar: 0')).toBeInTheDocument();
  expect(screen.getByText('Stock actual: 4 · A retirar: 4 · Total previsto: 0')).toBeInTheDocument();
  expect(screen.getByLabelText(/Tienda Centro/).checkValidity()).toBe(true);
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '5' } });
  expect(screen.getByText('Solo hay 4 unidades disponibles en esta locación.')).toBeInTheDocument();
  expect(screen.getByLabelText(/Tienda Centro/).checkValidity()).toBe(false);
});

test('calculates the initial total and clears the quantities on reset', () => {
  render(<Form />);
  fireEvent.change(screen.getByLabelText(/Sede Principal/), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '4' } });
  expect(screen.getByText('Stock total: 10')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Limpiar'));
  expect(screen.getByText('Stock total: 0')).toBeInTheDocument();
  expect(screen.getByLabelText(/Tienda Centro/)).toHaveValue(null);
});

test('restocking shows existing stock plus new quantities per location', () => {
  render(<Form restock inventory={[
    { punto_venta: null, nombre: 'Sede Principal', cantidad: 6 },
    { punto_venta: 7, nombre: 'Tienda Centro', cantidad: 4 },
  ]} />);
  fireEvent.change(screen.getByLabelText(/Tienda Centro/), { target: { value: '3' } });
  expect(screen.getByText('Actual: 4 · Después de reponer: 7')).toBeInTheDocument();
  expect(screen.getByText('Stock actual: 10 · A agregar: 3 · Total previsto: 13')).toBeInTheDocument();
});

test('keeps existing inventory visible even when a location is absent from the list', () => {
  render(<Form restock inventory={[{ punto_venta: 9, nombre: 'Almacén', cantidad: 8 }]} />);
  expect(screen.getByLabelText('Almacén')).toBeInTheDocument();
  expect(screen.getByText('Actual: 8 · Después de reponer: 8')).toBeInTheDocument();
});

test('sends only the entered additions and supports empty initial stock', () => {
  expect(stockPayload({ 7: '3', principal: '' })).toEqual([
    { punto_venta: 7, cantidad: 3 }, { punto_venta: null, cantidad: 0 },
  ]);
  expect(stockPayload()).toEqual([{ punto_venta: null, cantidad: 0 }]);
});

test.each(['-1', '1.5', 'abc'])('rejects invalid quantities: %s', value => {
  expect(() => stockPayload({ 7: value })).toThrow('números enteros');
});
