import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StockDistribution, { stockPayload } from './StockDistribution';

const locations = [{ id: 7, nombre: 'Tienda Centro' }];

function Form({ restock = false, inventory = [] }) {
  const [values, setValues] = useState({});
  return <>
    <StockDistribution locations={locations} values={values} onChange={setValues}
      restock={restock} inventory={inventory} />
    <button onClick={() => setValues({})}>Limpiar</button>
  </>;
}

test('calculates the initial total and clears the quantities on reset', () => {
  render(<Form />);
  fireEvent.change(screen.getByLabelText('Sede Principal'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Tienda Centro'), { target: { value: '4' } });
  expect(screen.getByText('Stock total: 10')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Limpiar'));
  expect(screen.getByText('Stock total: 0')).toBeInTheDocument();
  expect(screen.getByLabelText('Tienda Centro')).toHaveValue(null);
});

test('restocking shows existing stock plus new quantities per location', () => {
  render(<Form restock inventory={[
    { punto_venta: null, nombre: 'Sede Principal', cantidad: 6 },
    { punto_venta: 7, nombre: 'Tienda Centro', cantidad: 4 },
  ]} />);
  fireEvent.change(screen.getByLabelText('Tienda Centro'), { target: { value: '3' } });
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
