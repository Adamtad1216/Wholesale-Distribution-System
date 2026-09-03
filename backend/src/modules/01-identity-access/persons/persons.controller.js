import * as personsService from './persons.service.js';
import { sendSuccess } from '../../../utils/api-response.js';

export async function getPersons(req, res, next) {
  try {
    const persons = await personsService.getPersons(req.query);
    return sendSuccess(res, persons, 'Persons fetched successfully');
  } catch (error) {
    next(error);
  }
}
