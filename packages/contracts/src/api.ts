export interface ServiceHealthResponse {
  status: 'ok';
}

export interface ApiQueries {
  serviceHealth: {
    params: undefined;
    response: ServiceHealthResponse;
  };
}
