/* eslint-disable camelcase */
import * as types from './types';

/**
 * This function is used to set the request header for a get file.
 *
 * @param {object} session              - The session object.
 * @param {string} session.access_token - The oauth acces token.
 * @param {string} session.token_type   - The oauth token type.
 * @returns {{redirect: string, headers: Headers, method: string}}
 */
const getRequestOptions = ({ access_token, token_type }) => {
  const myHeaders = new Headers();
  myHeaders.append('Authorization', `${token_type} ${access_token}`);
  myHeaders.append('Content-Type', 'multipart/form-data');

  return { method: 'GET', headers: myHeaders, redirect: 'follow' };
};

/**
 * This function is used to request the files from the ftp.
 *
 * @param   {object} userToken - The session object.
 * @returns {Promise<Response>}
 */
const getImageData = userToken => {
  const requestOptions = getRequestOptions(userToken);
  return fetch('/api.php/files/browse/?path=/ROOT/1/7/images/&itemType=any&recursive=true', requestOptions);
};

/**
 * This function is used to retrieve a specific file from the ftp.
 *
 * @param {object} userToken - The session object.
 * @param {string} folder    - The folder to select.
 * @param {string} fileName  - The name of the file.
 * @returns {Promise<Response>}
 */
const getFile = (userToken, folder, fileName) => {
  const requestOptions = getRequestOptions(userToken);
  return fetch(`/api.php/files/download/?path=/ROOT/1/7/images/${folder}/${fileName}`, requestOptions);
};

/**
 * This function is used to retrieve the images from the ftp server.
 *
 * @returns {function(...[*]=)}
 */
export const getImages = () => async (dispatch, getStore) => {
  dispatch({ type: types.GET_DATA_PENDING });

  try {
    const { userToken } = getStore().userSession.session;
    const result = await getImageData(userToken);
    const { data } = await result.json();

    const files = data.files.children;

    const images = Object.keys(files).reduce((acc, key, index) => {
      if (index > 10) return acc;
      return [...acc, key];
    }, []);

    const validatedData = await Promise.all(
      images.map(async key => {
        const orig = await getFile(userToken, key, 'original.jpg');
        const original = URL.createObjectURL(await orig.blob());

        const croppedKeys = Object.keys(files[key].children.cropped.children);

        const json = croppedKeys.filter(key => key.includes('.json'));
        const jpg = croppedKeys.filter(key => key.includes('.jpg'));

        const results = json.reduce((acc, key, index) => [...acc, { json: key, jpg: jpg[index] }], []);

        const animals = await Promise.all(
          results.map(async croppedKey => {
            const cropped = await getFile(userToken, `${key}/cropped`, croppedKey.jpg);
            const image = URL.createObjectURL(await cropped.blob());

            const jsonFile = await getFile(userToken, `${key}/cropped`, croppedKey.json);
            const animalInfo = await jsonFile.json();

            return {
              image,
              predictions: [
                `${animalInfo.image[0].prediction_1} ${Number(animalInfo.image[0].accuracy_1).toFixed(2)}%`,
                `${animalInfo.image[0].prediction_2} ${Number(animalInfo.image[0].accuracy_2).toFixed(2)}%`,
                `${animalInfo.image[0].prediction_3} ${Number(animalInfo.image[0].accuracy_3).toFixed(2)}%`
              ]
            };
          })
        );

        const { children } = files[key];
        if (!children || !children['validation.json'])
          return { original, isValidated: false, folder: key, animals, label: '' };

        const jsonFile = await getFile(userToken, key, 'validation.json');
        const animalInfo = await jsonFile.json();

        return { original, folder: key, animals, isValidated: true, label: animalInfo.selection_1 };
      }, [])
    );

    dispatch({ type: types.GET_DATA_SUCCESS, data: validatedData });
  } catch (error) {
    dispatch({ type: types.GET_DATA_ERROR, error });
  }
};

/**
 * This function is used to submit a validated image.
 *
 * @param {object} formValues - The values entered for the image.
 * @param {string} folder     - The folder to submit the data to.
 */
export const submitImageData = (formValues, folder) => async (dispatch, getStore) => {
  const { access_token, token_type } = getStore().userSession.session.userToken;

  const myHeaders = new Headers();
  const formdata = new FormData();

  const blob = new Blob([JSON.stringify(formValues)], { type: 'text/plain' });
  const file = new File([blob], 'validation.json', { type: 'text/plain' });

  myHeaders.append('Authorization', `${token_type} ${access_token}`);

  formdata.append('Content-Disposition', 'form-data; name="file";');
  formdata.append('file', file);

  const requestOptions = { method: 'POST', headers: myHeaders, body: formdata, redirect: 'follow' };

  await fetch(`/api.php/files/upload/?path=/ROOT/1/7/images/${folder}/validation.json`, requestOptions);
};
