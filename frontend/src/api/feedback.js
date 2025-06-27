import axios from 'axios';
import { config } from '../config';

export const sendFeedback = async ({ type, message, contact = null, unitId = null }) => {
  const payload = { type, message, contact, unit_id: unitId };
  const { data } = await axios.post(`${config.apiUrl}/feedback`, payload);
  return data;
};
