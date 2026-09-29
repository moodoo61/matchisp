/** معرّف إنجليزي: أحرف لاتينية/أرقام/_/- فقط (يسمح بالبدء برقم) */
export const ENGLISH_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export const ENGLISH_NAME_MESSAGE =
  'name يجب أن يكون إنجليزياً فقط (a-z, 0-9, _, -)';
