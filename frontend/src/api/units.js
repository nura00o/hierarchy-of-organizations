import axios from 'axios';

const api = axios.create({
  baseURL: '/api/units',
});

export const searchUnits = async ({ query, exact = false, limit = 20, offset = 0 }) => {
  const { data } = await api.get('/search', {
    params: { query, exact, limit, offset },
  });
  return data;
};

export const fetchTree = async (parentId = undefined) => {
  const params = {};
  if (parentId !== undefined && parentId !== null) {
    params.parent_id = parentId;
  }
  const { data } = await api.get('/tree', { params });
  return data;
};

export const fetchPath = async (id) => {
  const { data } = await api.get(`/path/${id}`);
  return data; // ordered root -> leaf
};

export const fetchUnit = async (id) => {
  const { data } = await api.get(`/unit/${id}`);
  return data;
};
