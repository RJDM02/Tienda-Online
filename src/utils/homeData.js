import { useEffect, useState } from 'react';
import { apiFetch as fetch } from '../auth/session';
import { API_URL } from '../config/apiConfig';

// La configuracion de la home (textos, FAQ, footer) se pide una sola vez y se
// comparte entre la home y el footer del resto de paginas de la tienda.
let homeDataPromise = null;

const loadHomeData = () => {
  if (!homeDataPromise) {
    homeDataPromise = fetch(`${API_URL}/listar_homepage/`)
      .then((response) => response.json())
      .then((data) => data?.[0] || {})
      .catch((error) => {
        console.error('Error fetching home data:', error);
        homeDataPromise = null;
        return {};
      });
  }
  return homeDataPromise;
};

export const useHomeData = (fallback = {}) => {
  const [homeData, setHomeData] = useState(fallback);

  useEffect(() => {
    let active = true;
    loadHomeData().then((data) => {
      if (active) setHomeData({ ...fallback, ...data });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return homeData;
};
