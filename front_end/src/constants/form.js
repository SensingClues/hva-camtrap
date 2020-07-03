import * as text from '../assets/text';
import { TEST_MENU_ANIMALS } from './testData';

export const forms = {
  PREDICTION_FORM: 'predictionForm'
};

const formFieldNames = {
  ONE_ANIMAL: 'isOneAnimal',
  ANIMAL_TYPE: 'animalType',
  ANIMAL_VISIBLE: 'animalVisible',
  NOT_ANIMAL: 'isNotAnimal'
};

export const imageForm = [
  {
    type: 'Dropdown',
    name: formFieldNames.ANIMAL_TYPE,
    label: text.IMAGE_FORM_ANIMAL_TYPE,
    menuItems: TEST_MENU_ANIMALS
  }
];
