import axios from 'axios';
import { config } from '../config';

export const downloadJson = async () => {
  const res = await axios.get(`${config.apiUrl}/export/json`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'units.json';
  a.click();
  window.URL.revokeObjectURL(url);
};

export const downloadExcel = async () => {
  const res = await axios.get(`${config.apiUrl}/export/excel`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'units.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
};
