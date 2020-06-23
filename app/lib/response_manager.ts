/**
 * Created by Micheal
 * objective: building to scale
 */


function respond(res, data, httpCode) {
  const response = {
    error: data.error,
    code: httpCode,
    data: data.response,
    message: data.message,
    validationError: data.validationError,
    meta: data.meta
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Method', '*');


  res.writeHead(httpCode);
  res.end(JSON.stringify(response));
}

export function success(res, response, status = 200) {
  const data = response;
  data.error = false;
  respond(res, data, status);
};

export function failure(res, response, httpCode = 503) {
  const data = response;
  data.error = true;
  respond(res, data, httpCode);
};
